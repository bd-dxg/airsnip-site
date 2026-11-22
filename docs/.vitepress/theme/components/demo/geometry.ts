/**
 * 演示台的几何与 SVG 路径：锤子函数，不碰响应式状态。
 * 出处：src/editor/curve.rs（贝塞尔）、src/render/mod.rs（箭头与头部）、
 * src/render/badge.rs（徽标与引线）、src/render/stroke.rs（手绘平滑）。
 */
import { demo } from '../../../data/site'
import { isBox } from './types'
import type { ArrowObject, BoxObject, DemoObject, NumberObject, Point, TextObject } from './types'

export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

export function snapDirection(anchor: Point, point: Point): Point {
  const dx = point.x - anchor.x
  const dy = point.y - anchor.y
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax >= ay * 2) return { x: point.x, y: anchor.y }
  if (ay >= ax * 2) return { x: anchor.x, y: point.y }
  const t = (ax + ay) * 0.5
  return { x: anchor.x + t * Math.sign(dx), y: anchor.y + t * Math.sign(dy) }
}

export function squareCorner(origin: Point, point: Point): Point {
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  const side = Math.max(Math.abs(dx), Math.abs(dy))
  return { x: origin.x + side * Math.sign(dx), y: origin.y + side * Math.sign(dy) }
}

export function cubicPoint(o: ArrowObject, t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * o.from.x + b * o.c1.x + c * o.c2.x + d * o.to.x,
    y: a * o.from.y + b * o.c1.y + c * o.c2.y + d * o.to.y,
  }
}

export function arrowPolyline(o: ArrowObject): Point[] {
  const segments = 24
  const points: Point[] = []
  for (let i = 0; i <= segments; i += 1) {
    points.push(cubicPoint(o, i / segments))
  }
  return points
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function distToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  const t = len2 > 1e-6 ? Math.min(Math.max(((point.x - a.x) * dx + (point.y - a.y) * dy) / len2, 0), 1) : 0
  return dist(point, { x: a.x + dx * t, y: a.y + dy * t })
}

export function distToPolyline(points: Point[], point: Point): number {
  let best = Infinity
  for (let i = 1; i < points.length; i += 1) {
    best = Math.min(best, distToSegment(point, points[i - 1], points[i]))
  }
  return best
}

export function polylineLength(points: Point[]): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) total += dist(points[i - 1], points[i])
  return total
}

export function unit(to: Point, from: Point): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  return len > 1e-6 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 }
}

/** 终点切线：P3 − P2，退化时回退 P3 − P1（editor/curve.rs 的 end_tangent） */
export function endDirection(o: ArrowObject): Point {
  const main = { x: o.to.x - o.c2.x, y: o.to.y - o.c2.y }
  if (Math.hypot(main.x, main.y) > 1e-3) return unit(o.to, o.c2)
  return unit(o.to, o.c1)
}

/** de Casteljau 在 t 处分割，返回左段控制点（editor/curve.rs 的 split_left） */
export function splitCubic(o: ArrowObject, t: number): [Point, Point, Point, Point] {
  const a = lerp(o.from, o.c1, t)
  const b = lerp(o.c1, o.c2, t)
  const c = lerp(o.c2, o.to, t)
  const d = lerp(a, b, t)
  const e = lerp(b, c, t)
  return [o.from, a, d, lerp(d, e, t)]
}

/**
 * 线身在头部三角边界处截断（render/mod.rs 的 draw_arrow）。
 * 不截断的话，弯曲时线身会从三角侧面穿出来，看起来“三角跟直线对不上”。
 */
export function arrowBodyPath(o: ArrowObject): string {
  const points = arrowPolyline(o)
  const total = polylineLength(points)
  if (total < 0.5) return ''
  const head = Math.min(Math.max(o.stroke * demo.arrow.headScale, demo.arrow.headMin), total)
  const dir = endDirection(o)
  const perp = { x: -dir.y, y: dir.x }
  const base = { x: o.to.x - dir.x * head, y: o.to.y - dir.y * head }
  const half = head * demo.arrow.headHalf
  const inside = (point: Point): boolean => {
    const dx = point.x - base.x
    const dy = point.y - base.y
    const s = dx * dir.x + dy * dir.y
    // 尖端处的 s 刚好等于 head，不留容差会被判成“在外”，线身就画到尖端外面去了
    if (s < -0.01 || s > head + 0.01) return false
    return Math.abs(dx * perp.x + dy * perp.y) <= half * (1 - s / head) + 0.01
  }
  // 从终点往回找最后一个在三角外的采样点，再在这两段之间二分出精确边界
  let cut = points.length - 1
  while (cut > 0 && inside(points[cut])) cut -= 1
  let t0 = cut / (points.length - 1)
  if (cut < points.length - 1) {
    let lo = t0
    let hi = (cut + 1) / (points.length - 1)
    for (let i = 0; i < 8; i += 1) {
      const mid = (lo + hi) / 2
      // 边界下方在外、上方在三角内：在外就抬高 lo，别把边界挤出区间
      if (inside(cubicPoint(o, mid))) hi = mid
      else lo = mid
    }
    t0 = lo
  }
  const seg = splitCubic(o, t0)
  const rawTangent = unit(seg[3], seg[2])
  const tangent = dist(seg[2], seg[3]) > 1e-6 ? rawTangent : dir
  // 往三角里多探半个线宽，粗线在底边才不会留缝
  const deep = Math.max(o.stroke / 2 + 1, 1)
  const end = { x: seg[3].x + tangent.x * deep, y: seg[3].y + tangent.y * deep }
  return `M ${o.from.x} ${o.from.y} C ${seg[1].x} ${seg[1].y} ${seg[2].x} ${seg[2].y} ${end.x} ${end.y}`
}

export function arrowHead(o: ArrowObject): string {
  const head = Math.min(Math.max(o.stroke * demo.arrow.headScale, demo.arrow.headMin), polylineLength(arrowPolyline(o)))
  const dir = endDirection(o)
  const base = { x: o.to.x - dir.x * head, y: o.to.y - dir.y * head }
  const perp = { x: -dir.y, y: dir.x }
  const half = head * demo.arrow.headHalf
  const p1 = { x: base.x + perp.x * half, y: base.y + perp.y * half }
  const p2 = { x: base.x - perp.x * half, y: base.y - perp.y * half }
  return `${o.to.x},${o.to.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`
}

/** 手绘：相邻点中点 + 二次贝塞尔平滑（render/stroke.rs 的 draw_freehand） */
export function freehandPath(points: Point[]): string {
  if (points.length === 0) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) return `${d} L ${points[1].x} ${points[1].y}`
  for (let i = 1; i < points.length - 1; i += 1) {
    const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 }
    d += ` Q ${points[i].x} ${points[i].y} ${mid.x} ${mid.y}`
  }
  const last = points[points.length - 1]
  return `${d} L ${last.x} ${last.y}`
}

export function textWidth(o: TextObject): number {
  let units = 0
  for (const ch of o.text) units += /[\u2e80-\uffff]/.test(ch) ? 1 : 0.6
  return Math.max(units, 1) * o.fontSize
}

export function textBox(o: TextObject): BoxObject {
  return { x: o.x, y: o.y, width: textWidth(o), height: o.fontSize * 1.25 }
}

export function pointsBounds(points: Point[]): BoxObject {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const point of points) {
    x0 = Math.min(x0, point.x)
    y0 = Math.min(y0, point.y)
    x1 = Math.max(x1, point.x)
    y1 = Math.max(y1, point.y)
  }
  if (!Number.isFinite(x0)) return { x: 0, y: 0, width: 1, height: 1 }
  return { x: x0, y: y0, width: Math.max(x1 - x0, 1), height: Math.max(y1 - y0, 1) }
}

export function boxOf(o: DemoObject): BoxObject | null {
  if (isBox(o)) return o
  if (o.kind === 'text') return textBox(o)
  if (o.kind === 'freehand') return pointsBounds(o.points)
  return null
}

/** 对象包围盒（舞台坐标，供拖动夹取与自由笔画命中用） */
export function boundsOf(o: DemoObject): { x0: number; y0: number; x1: number; y1: number } {
  if (isBox(o) || o.kind === 'text') {
    const box = boxOf(o) as BoxObject
    return { x0: box.x, y0: box.y, x1: box.x + box.width, y1: box.y + box.height }
  }
  if (o.kind === 'arrow' || o.kind === 'line') {
    const points = o.kind === 'arrow' ? arrowPolyline(o) : [o.from, o.to]
    const box = pointsBounds(points)
    return { x0: box.x, y0: box.y, x1: box.x + box.width, y1: box.y + box.height }
  }
  if (o.kind === 'freehand') {
    const box = pointsBounds(o.points)
    return { x0: box.x, y0: box.y, x1: box.x + box.width, y1: box.y + box.height }
  }
  const r = numberRadius(o)
  return {
    x0: Math.min(o.center.x - r, o.tip.x),
    y0: Math.min(o.center.y - r, o.tip.y),
    x1: Math.max(o.center.x + r, o.tip.x),
    y1: Math.max(o.center.y + r, o.tip.y),
  }
}

export function numberRadius(o: NumberObject): number {
  const fs = o.fontSize
  const contentWidth = o.mark === 'num' ? String(o.value).length * fs * 0.6 : fs * 0.6
  return Math.max(contentWidth / 2 + fs * demo.number.radiusK, fs * demo.number.minRadiusK)
}

export function numberArrowStart(o: NumberObject): Point {
  const dx = o.tip.x - o.center.x
  const dy = o.tip.y - o.center.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-3) return o.center
  const radius = numberRadius(o)
  return { x: o.center.x + (dx / len) * radius, y: o.center.y + (dy / len) * radius }
}

/** 徽标内容按底色亮度取反色（render/badge.rs 的 contrast_ink）；渐变没法算亮度，统一用白字 */
export function badgeInk(o: NumberObject): string {
  if (!o.color.startsWith('#')) return '#fff'
  const hex = o.color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const lum = (r * 299 + g * 587 + b * 114) / 1000
  return lum >= 150 ? '#000' : '#fff'
}

export function badgeCheckPath(o: NumberObject): string {
  const radius = numberRadius(o)
  return demo.number.check
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${o.center.x + x * radius} ${o.center.y + y * radius}`)
    .join(' ')
}

export function badgeCrossPath(o: NumberObject): string {
  const radius = numberRadius(o)
  return demo.number.cross
    .map(([a, b]) => {
      return `M ${o.center.x + a[0] * radius} ${o.center.y + a[1] * radius} L ${o.center.x + b[0] * radius} ${o.center.y + b[1] * radius}`
    })
    .join(' ')
}

/** 引线箭头：头部尺寸与普通箭头一致（render/badge.rs 复用 draw_arrow） */
export function numberHead(o: NumberObject): string {
  const start = numberArrowStart(o)
  const dir = unit(o.tip, start)
  const len = dist(start, o.tip)
  const head = Math.min(Math.max(o.stroke * demo.arrow.headScale, demo.arrow.headMin), len)
  const base = { x: o.tip.x - dir.x * head, y: o.tip.y - dir.y * head }
  const perp = { x: -dir.y, y: dir.x }
  const half = head * demo.arrow.headHalf
  return `${o.tip.x},${o.tip.y} ${base.x + perp.x * half},${base.y + perp.y * half} ${base.x - perp.x * half},${base.y - perp.y * half}`
}

/** 序号引线：线身同样在头部三角边界处截断，不能画到尖端外面去 */
export function numberLeaderPath(o: NumberObject): string {
  const start = numberArrowStart(o)
  const len = dist(start, o.tip)
  if (len < 1) return ''
  const dir = unit(o.tip, start)
  const head = Math.min(Math.max(o.stroke * demo.arrow.headScale, demo.arrow.headMin), len)
  const deep = Math.max(o.stroke / 2 + 1, 1)
  // 线身从徽标边缘跑到头部底边，再往三角里探 deep
  const bodyLen = Math.max(len - head + deep, 0)
  return `M ${start.x} ${start.y} L ${start.x + dir.x * bodyLen} ${start.y + dir.y * bodyLen}`
}
