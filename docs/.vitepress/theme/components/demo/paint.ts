/**
 * 演示台的颜色与渐变：HSV 换算、8 色标取色、沿路径分段。
 * 出处：src/editor/gradient.rs、src/editor/oklab.rs（色标）、
 * src/editor/palette.rs（HSV）、src/render/gradient_stroke.rs 与 src/render/paint.rs（走色方向）。
 */
import { demo } from '../../../data/site'
import { dist, numberArrowStart, numberRadius } from './geometry'
import type { DemoObject, EllipseObject, NumberObject, Point, RectObject } from './types'
import { supportsGradient } from './types'

export interface GradientDef {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  /** 按 offset（0..1）排好的色标；描边段只两端各一个，面渐变用完整 8 个 */
  stops: Array<{ offset: number; color: string }>
}

export interface StrokePiece extends GradientDef {
  d: string
}

export function hexChannels(hex: string): [number, number, number] {
  const v = hex.replace('#', '')
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}

export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexChannels(a)
  const [r2, g2, b2] = hexChannels(b)
  const q = (v: number): string =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0')
  return `#${q(r1 + (r2 - r1) * t)}${q(g1 + (g2 - g1) * t)}${q(b1 + (b2 - b1) * t)}`
}

/** RGB → HSV（palette.rs 的 rgb_to_hsv），返回 h 0..360、s / v 0..1 */
export function rgbToHsv(hex: string): { h: number; s: number; v: number } {
  const [r0, g0, b0] = hexChannels(hex)
  const [r, g, b] = [r0 / 255, g0 / 255, b0 / 255]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d > 1e-6) {
    if (max === r) h = 60 * (((g - b) / d) % 6)
    else if (max === g) h = 60 * ((b - r) / d + 2)
    else h = 60 * ((r - g) / d + 4)
  }
  return { h: ((h % 360) + 360) % 360, s: max === 0 ? 0 : d / max, v: max }
}

/** HSV → RGB（palette.rs 的 hsv_to_rgb） */
export function hsvToHex(h: number, s: number, v: number): string {
  const hh = ((((h % 360) + 360) % 360) / 60)
  const c = v * Math.min(Math.max(s, 0), 1)
  const x = c * (1 - Math.abs((hh % 2) - 1))
  const m = v - c
  const [r, g, b] =
    hh < 1 ? [c, x, 0] : hh < 2 ? [x, c, 0] : hh < 3 ? [0, c, x] : hh < 4 ? [0, x, c] : hh < 5 ? [x, 0, c] : [c, 0, x]
  const q = (f: number): string =>
    Math.round(Math.min(255, Math.max(0, (f + m) * 255)))
      .toString(16)
      .padStart(2, '0')
  return `#${q(r)}${q(g)}${q(b)}`
}

/** 在某一套色标上取 t（0..1）的颜色；8 个色标足够密，段内线性看不出来 */
export function stopColor(set: number, t: number): string {
  const stops = demo.swatches.gradientSets[set] ?? demo.swatches.gradientSets[0]
  const last = stops.length - 1
  const pos = Math.min(Math.max(t, 0), 1) * last
  const i = Math.min(Math.floor(pos), last - 1)
  return mixHex(stops[i], stops[i + 1], pos - i)
}

/** 整条色标按 offset 铺开（面渐变用）：软件 paint.rs 的 gradient_shader 就是这么排的 */
export function fullStops(set: number): Array<{ offset: number; color: string }> {
  const stops = demo.swatches.gradientSets[set] ?? demo.swatches.gradientSets[0]
  const last = stops.length - 1
  return stops.map((color, i) => ({ offset: i / last, color }))
}

/** 包围盒长边方向的水平 / 竖直向量（paint.rs 的 box_span） */
export function boxSpan(x0: number, y0: number, x1: number, y1: number): Omit<GradientDef, 'id' | 'stops'> {
  const mx = (x0 + x1) / 2
  const my = (y0 + y1) / 2
  return x1 - x0 >= y1 - y0 ? { x1: x0, y1: my, x2: x1, y2: my } : { x1: mx, y1: y0, x2: mx, y2: y1 }
}

/** 圆角矩形轮廓（顺时针，首点在上边左端）；圆角按每角 6 段采样 */
export function rectOutline(o: RectObject): Point[] {
  const { x, y, width: w, height: h } = o
  const r = Math.min(o.radius, w / 2, h / 2)
  if (r < 0.5) return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }]
  const pts: Point[] = [{ x: x + r, y }, { x: x + w - r, y }]
  const arc = (cx: number, cy: number, from: number, to: number): void => {
    const steps = 6
    for (let i = 1; i <= steps; i += 1) {
      const a = (((from + ((to - from) * i) / steps) * Math.PI) / 180)
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r })
    }
  }
  arc(x + w - r, y + r, -90, 0)
  pts.push({ x: x + w, y: y + h - r })
  arc(x + w - r, y + h - r, 0, 90)
  pts.push({ x: x + r, y: y + h })
  arc(x + r, y + h - r, 90, 180)
  pts.push({ x, y: y + r })
  arc(x + r, y + r, 180, 270)
  return pts
}

export function ellipseOutline(o: EllipseObject): Point[] {
  const cx = o.x + o.width / 2
  const cy = o.y + o.height / 2
  const steps = 96
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    return { x: cx + Math.cos(a) * (o.width / 2), y: cy + Math.sin(a) * (o.height / 2) }
  })
}

/** 按弧长把折线切成段，每段一个两端取色的线性渐变（gradient_stroke.rs 的做法） */
export function piecesAlong(points: Point[], closed: boolean, o: DemoObject, step: number): StrokePiece[] {
  if (!supportsGradient(o) || o.gradient == null || points.length < 2) return []
  const pts = closed ? [...points, points[0]] : points
  const lens = pts.slice(1).map((p, i) => dist(pts[i], p))
  const total = lens.reduce((sum, l) => sum + l, 0)
  if (total < 1) return []
  const out: StrokePiece[] = []
  let arc = 0
  let startArc = 0
  let start = pts[0]
  // 段内必须保留中间的拐点，否则圆角会被拉成直线
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i += 1) {
    arc += lens[i - 1]
    d += ` L ${pts[i].x} ${pts[i].y}`
    if (arc - startArc < step && i < pts.length - 1) continue
    out.push({
      id: `grad-${o.id}-${out.length}`,
      d,
      x1: start.x,
      y1: start.y,
      x2: pts[i].x,
      y2: pts[i].y,
      stops: [
        { offset: 0, color: stopColor(o.gradient, startArc / total) },
        { offset: 1, color: stopColor(o.gradient, arc / total) },
      ],
    })
    start = pts[i]
    startArc = arc
    d = `M ${pts[i].x} ${pts[i].y}`
  }
  return out
}

/** 直角矩形的 4 条边各一段（gradient_stroke.rs 的 stroke_rect_edges 快速路径） */
export function edgePieces(o: RectObject, corners: Point[]): StrokePiece[] {
  const set = o.gradient ?? 0
  const { width: w, height: h } = o
  const per = 2 * (w + h)
  const segs: Array<[Point, Point, number, number]> = [
    [corners[0], corners[1], 0, w / per],
    [corners[1], corners[2], w / per, (w + h) / per],
    [corners[2], corners[3], (w + h) / per, (2 * w + h) / per],
    [corners[3], corners[0], (2 * w + h) / per, 1],
  ]
  return segs.map(([a, b, t0, t1], i) => ({
    id: `grad-${o.id}-${i}`,
    d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`,
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    stops: [
      { offset: 0, color: stopColor(set, t0) },
      { offset: 1, color: stopColor(set, t1) },
    ],
  }))
}

/** 描边要沿路径走色的三类：矩形 / 椭圆 / 手绘（箭头与直线走起点→终点的线性） */
export function strokePieces(o: DemoObject): StrokePiece[] {
  if (!supportsGradient(o) || o.gradient == null) return []
  switch (o.kind) {
    case 'rect':
      if (o.filled) return []
      // 直角矩形走 4 条边的快速路径；有圆角就沿轮廓按弧长切
      return o.radius < 0.5 ? edgePieces(o, rectOutline(o)) : piecesAlong(rectOutline(o), true, o, 64)
    case 'ellipse':
      return o.filled ? [] : piecesAlong(ellipseOutline(o), true, o, 24)
    case 'freehand':
      return piecesAlong(o.points, false, o, 24)
    default:
      return []
  }
}

/** 面（填充 / 徽标圆 / 箭头三角）的线性渐变：填充与徽标沿长边，箭头沿起点→终点；用完整彩虹色标 */
export function faceDef(o: DemoObject): GradientDef | null {
  if (!supportsGradient(o) || o.gradient == null) return null
  const set = o.gradient
  const make = (span: Omit<GradientDef, 'id' | 'stops'>, id: string): GradientDef => ({
    id,
    ...span,
    stops: fullStops(set),
  })
  switch (o.kind) {
    case 'rect':
    case 'ellipse':
      return o.filled ? make(boxSpan(o.x, o.y, o.x + o.width, o.y + o.height), `grad-face-${o.id}`) : null
    case 'number':
      return make(boxSpan(o.center.x - numberRadius(o), o.center.y - numberRadius(o), o.center.x + numberRadius(o), o.center.y + numberRadius(o)), `grad-face-${o.id}`)
    case 'arrow':
    case 'line':
      return make({ x1: o.from.x, y1: o.from.y, x2: o.to.x, y2: o.to.y }, `grad-face-${o.id}`)
    default:
      return null
  }
}

/** 序号引线沿起点→终点线性；圆面另用 faceDef 的长边渐变 */
export function leaderDef(o: NumberObject): GradientDef | null {
  if (o.gradient == null) return null
  const start = numberArrowStart(o)
  return {
    id: `grad-lead-${o.id}`,
    x1: start.x,
    y1: start.y,
    x2: o.tip.x,
    y2: o.tip.y,
    stops: fullStops(o.gradient),
  }
}
