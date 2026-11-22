<script setup lang="ts">
/**
 * 首页演示台：按真实覆盖层 1:1 重绘的工具栏 + 10 个可玩的标注工具。
 * 阶段 3 范围：对象数组（支持叠加）、箭头曲线、文本、模糊、荧光笔、聚光灯、序号徽标、
 * 直线、椭圆、手绘，以及每个工具一句提示。
 * 所有数字与配色都来自 data/site.ts 的 `demo`，不在这里另写一份。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useInView } from '../../composables/useInView'
import { useReducedMotion } from '../../composables/useReducedMotion'
import { demo, tools } from '../../data/site'

const stage = demo.stage
const swatch = demo.swatches.solid[0]

const stageEl = ref<HTMLElement | null>(null)

interface Point {
  x: number
  y: number
}

type BadgeMark = 'num' | 'check' | 'cross'

interface BoxObject {
  x: number
  y: number
  width: number
  height: number
}

interface RectObject extends BoxObject {
  id: number
  kind: 'rect'
  radius: number
  stroke: number
  color: string
  filled: boolean
}

interface EllipseObject extends BoxObject {
  id: number
  kind: 'ellipse'
  stroke: number
  color: string
  filled: boolean
}

interface HighlightObject extends BoxObject {
  id: number
  kind: 'highlight'
  corner: number
  color: string
}

interface BlurObject extends BoxObject {
  id: number
  kind: 'blur'
  radius: number
  corner: number
}

interface GlowObject extends BoxObject {
  id: number
  kind: 'glow'
  corner: number
}

interface ArrowObject {
  id: number
  kind: 'arrow'
  from: Point
  to: Point
  c1: Point
  c2: Point
  stroke: number
  color: string
}

interface LineObject {
  id: number
  kind: 'line'
  from: Point
  to: Point
  stroke: number
  color: string
}

interface FreehandObject {
  id: number
  kind: 'freehand'
  points: Point[]
  stroke: number
  color: string
}

interface TextObject {
  id: number
  kind: 'text'
  x: number
  y: number
  text: string
  fontSize: number
  color: string
}

interface NumberObject {
  id: number
  kind: 'number'
  center: Point
  tip: Point
  mark: BadgeMark
  value: number
  fontSize: number
  stroke: number
  color: string
}

type DemoObject =
  | RectObject
  | EllipseObject
  | HighlightObject
  | BlurObject
  | GlowObject
  | ArrowObject
  | LineObject
  | FreehandObject
  | TextObject
  | NumberObject

type HandleId = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'
type HandleKey = HandleId | 'from' | 'to' | 'c1' | 'c2'

function isBox(o: DemoObject): o is RectObject | EllipseObject | HighlightObject | BlurObject | GlowObject {
  return o.kind === 'rect' || o.kind === 'ellipse' || o.kind === 'highlight' || o.kind === 'blur' || o.kind === 'glow'
}

let nextId = 1

/** 首帧矩形：SSR 直接把它写进 HTML，无 JS / 窄屏看到的就是这张「成品」 */
function staticRect(): RectObject {
  return {
    id: nextId++,
    kind: 'rect',
    x: demo.initialRect.x,
    y: demo.initialRect.y,
    width: demo.initialRect.width,
    height: demo.initialRect.height,
    radius: demo.staticFrame.radius,
    stroke: demo.staticFrame.stroke,
    color: swatch,
    filled: false,
  }
}

const objects = reactive<DemoObject[]>([staticRect()])
const selectedId = ref<number | null>(null)
const selected = computed<DemoObject | null>(
  () => objects.find((item) => item.id === selectedId.value) ?? null,
)
const selectedBox = computed(() => (selected.value && isBox(selected.value) ? selected.value : null))
const selectedArrow = computed<ArrowObject | null>(() =>
  selected.value?.kind === 'arrow' ? selected.value : null,
)
const selectedNumber = computed<NumberObject | null>(() =>
  selected.value?.kind === 'number' ? selected.value : null,
)

/** 新建对象时沿用的默认值（滚轮在空白处滚动会改它） */
const defaults = reactive({
  stroke: demo.stroke.defaultWidth,
  blur: demo.blur.default,
  textSize: demo.text.defaultSize,
  numberSize: demo.number.defaultFontSize,
})

/** 矩形 / 椭圆的填充开关（软件里就是工具栏那个「填充」） */
const filled = ref(false)

/** 当前选中的工具，存图标名（'move' / 'rect' / ...） */
const activeTool = ref('rect')
/** 用户已经完成的那一步引导：初始不显示，自动演示结束后才开始指路 */
type GuideStep = 'radius' | 'width' | 'done'
const guide = ref<GuideStep>('done')
/** 自动演示的步骤字幕，播完清空 */
const caption = ref('')

/** 演示的软件主题：默认深色（覆盖层现行风格，也是 hero 截图的样子） */
type ThemeName = 'dark' | 'light'
const theme = ref<ThemeName>('dark')
const palette = computed(() => demo.palettes[theme.value])

/* ---------- 尺寸补偿：手柄在屏幕上保持固定像素，不随舞台缩放变小 ---------- */

const stageWidthPx = ref(stage.width)
const coarsePointer = ref(false)

/** 1 个 viewBox 单位对应多少 CSS 像素的倒数 */
const ui = computed(() => stage.width / stageWidthPx.value)
const handlePx = computed(() => (coarsePointer.value ? demo.frame.handle * 2 : demo.frame.handle))
const handleSize = computed(() => handlePx.value * ui.value)
const roundSize = computed(() => (handlePx.value / 2) * ui.value)
const pickSize = computed(() => (coarsePointer.value ? 12 : demo.pickRadius) * ui.value)

/* ---------- 对象几何 ---------- */

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function snapDirection(anchor: Point, point: Point): Point {
  const dx = point.x - anchor.x
  const dy = point.y - anchor.y
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax >= ay * 2) return { x: point.x, y: anchor.y }
  if (ay >= ax * 2) return { x: anchor.x, y: point.y }
  const t = (ax + ay) * 0.5
  return { x: anchor.x + t * Math.sign(dx), y: anchor.y + t * Math.sign(dy) }
}

function squareCorner(origin: Point, point: Point): Point {
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  const side = Math.max(Math.abs(dx), Math.abs(dy))
  return { x: origin.x + side * Math.sign(dx), y: origin.y + side * Math.sign(dy) }
}

function cubicPoint(o: ArrowObject, t: number): Point {
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

function arrowPolyline(o: ArrowObject): Point[] {
  const segments = 24
  const points: Point[] = []
  for (let i = 0; i <= segments; i += 1) {
    points.push(cubicPoint(o, i / segments))
  }
  return points
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function distToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  const t = len2 > 1e-6 ? Math.min(Math.max(((point.x - a.x) * dx + (point.y - a.y) * dy) / len2, 0), 1) : 0
  return dist(point, { x: a.x + dx * t, y: a.y + dy * t })
}

function distToPolyline(points: Point[], point: Point): number {
  let best = Infinity
  for (let i = 1; i < points.length; i += 1) {
    best = Math.min(best, distToSegment(point, points[i - 1], points[i]))
  }
  return best
}

function polylineLength(points: Point[]): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) total += dist(points[i - 1], points[i])
  return total
}

function unit(to: Point, from: Point): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  return len > 1e-6 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 }
}

/** 终点切线：P3 − P2，退化时回退 P3 − P1（editor/curve.rs 的 end_tangent） */
function endDirection(o: ArrowObject): Point {
  const main = { x: o.to.x - o.c2.x, y: o.to.y - o.c2.y }
  if (Math.hypot(main.x, main.y) > 1e-3) return unit(o.to, o.c2)
  return unit(o.to, o.c1)
}

/** de Casteljau 在 t 处分割，返回左段控制点（editor/curve.rs 的 split_left） */
function splitCubic(o: ArrowObject, t: number): [Point, Point, Point, Point] {
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
function arrowBodyPath(o: ArrowObject): string {
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

function arrowHead(o: ArrowObject): string {
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
function freehandPath(points: Point[]): string {
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

function textWidth(o: TextObject): number {
  let units = 0
  for (const ch of o.text) units += /[\u2e80-\uffff]/.test(ch) ? 1 : 0.6
  return Math.max(units, 1) * o.fontSize
}

function textBox(o: TextObject): BoxObject {
  return { x: o.x, y: o.y, width: textWidth(o), height: o.fontSize * 1.25 }
}

function pointsBounds(points: Point[]): BoxObject {
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

function boxOf(o: DemoObject): BoxObject | null {
  if (isBox(o)) return o
  if (o.kind === 'text') return textBox(o)
  if (o.kind === 'freehand') return pointsBounds(o.points)
  return null
}

/** 对象包围盒（舞台坐标，供拖动夹取与自由笔画命中用） */
function boundsOf(o: DemoObject): { x0: number; y0: number; x1: number; y1: number } {
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

function numberRadius(o: NumberObject): number {
  const fs = o.fontSize
  const contentWidth = o.mark === 'num' ? String(o.value).length * fs * 0.6 : fs * 0.6
  return Math.max(contentWidth / 2 + fs * demo.number.radiusK, fs * demo.number.minRadiusK)
}

function numberArrowStart(o: NumberObject): Point {
  const dx = o.tip.x - o.center.x
  const dy = o.tip.y - o.center.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-3) return o.center
  const radius = numberRadius(o)
  return { x: o.center.x + (dx / len) * radius, y: o.center.y + (dy / len) * radius }
}

/** 徽标内容按底色亮度取反色（render/badge.rs 的 contrast_ink） */
function badgeInk(o: NumberObject): string {
  const hex = o.color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const lum = (r * 299 + g * 587 + b * 114) / 1000
  return lum >= 150 ? '#000' : '#fff'
}

function badgeCheckPath(o: NumberObject): string {
  const radius = numberRadius(o)
  return demo.number.check
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${o.center.x + x * radius} ${o.center.y + y * radius}`)
    .join(' ')
}

function badgeCrossPath(o: NumberObject): string {
  const radius = numberRadius(o)
  return demo.number.cross
    .map(([a, b]) => {
      return `M ${o.center.x + a[0] * radius} ${o.center.y + a[1] * radius} L ${o.center.x + b[0] * radius} ${o.center.y + b[1] * radius}`
    })
    .join(' ')
}

/** 引线箭头：头部尺寸与普通箭头一致（render/badge.rs 复用 draw_arrow） */
function numberHead(o: NumberObject): string {
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
function numberLeaderPath(o: NumberObject): string {
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

function nextNumber(): number {
  const numbers = objects
    .filter((item): item is NumberObject => item.kind === 'number')
    .map((item) => (item.mark === 'num' ? item.value : 0))
  return Math.max(0, ...numbers) + 1
}

const highlightOpacity = demo.highlight.alpha / demo.highlight.alphaMax
const glowObjects = computed(() => objects.filter((item): item is GlowObject => item.kind === 'glow'))
const blurObjects = computed(() => objects.filter((item): item is BlurObject => item.kind === 'blur'))
/** 画了聚光灯才把覆盖层压暗到软件实际程度（dimmer 0.08 时看不出聚光） */
const dimFill = computed(() => (glowObjects.value.length > 0 ? demo.glow.dimmer : demo.dimmer))

/* ---------- 选中框、手柄与圆角柄 ---------- */

interface HandleInfo {
  id: HandleKey
  x: number
  y: number
  cursor: string
}

const handleCursors: Record<HandleId, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  w: 'ew-resize',
  e: 'ew-resize',
  sw: 'nesw-resize',
  s: 'ns-resize',
  se: 'nwse-resize',
}

const handles = computed<HandleInfo[]>(() => {
  const o = selected.value
  if (!o || playing.value) return []
  if (isBox(o)) {
    const { x, y, width, height } = o
    const midX = x + width / 2
    const midY = y + height / 2
    return [
      { id: 'nw', x, y, cursor: handleCursors.nw },
      { id: 'n', x: midX, y, cursor: handleCursors.n },
      { id: 'ne', x: x + width, y, cursor: handleCursors.ne },
      { id: 'w', x, y: midY, cursor: handleCursors.w },
      { id: 'e', x: x + width, y: midY, cursor: handleCursors.e },
      { id: 'sw', x, y: y + height, cursor: handleCursors.sw },
      { id: 's', x: midX, y: y + height, cursor: handleCursors.s },
      { id: 'se', x: x + width, y: y + height, cursor: handleCursors.se },
    ]
  }
  if (o.kind === 'arrow') {
    return [
      { id: 'from', x: o.from.x, y: o.from.y, cursor: 'move' },
      { id: 'to', x: o.to.x, y: o.to.y, cursor: 'move' },
      { id: 'c1', x: o.c1.x, y: o.c1.y, cursor: 'move' },
      { id: 'c2', x: o.c2.x, y: o.c2.y, cursor: 'move' },
    ]
  }
  if (o.kind === 'line') {
    return [
      { id: 'from', x: o.from.x, y: o.from.y, cursor: 'move' },
      { id: 'to', x: o.to.x, y: o.to.y, cursor: 'move' },
    ]
  }
  return []
})

const squareHandles = computed(() => handles.value.filter((item) => item.id !== 'c1' && item.id !== 'c2'))
const controlHandles = computed(() => handles.value.filter((item) => item.id === 'c1' || item.id === 'c2'))

/** 圆角控制柄：矩形用 radius，高亮 / 模糊 / 聚光用 corner（同一套内缩规则） */
function hasCorner(o: DemoObject): o is RectObject | HighlightObject | BlurObject | GlowObject {
  return o.kind === 'rect' || o.kind === 'highlight' || o.kind === 'blur' || o.kind === 'glow'
}

function cornerValue(o: RectObject | HighlightObject | BlurObject | GlowObject): number {
  return o.kind === 'rect' ? o.radius : o.corner
}

function setCornerValue(o: RectObject | HighlightObject | BlurObject | GlowObject, value: number): void {
  if (o.kind === 'rect') o.radius = value
  else o.corner = value
}

/** 圆角控制柄贴弧走：内缩 14 + 0.293 × r，最多到短边的 45% */
const grip = computed(() => {
  const o = selected.value
  if (!o || !hasCorner(o) || playing.value) return null
  const value = cornerValue(o)
  const inset = Math.min(
    demo.radiusGrip.baseInset + demo.radiusGrip.arcToCorner * value,
    o.width * 0.45,
    o.height * 0.45,
  )
  return {
    x: o.x + o.width - inset,
    y: o.y + inset,
    value,
    max: Math.min(o.width, o.height) / 2,
  }
})

/** 引导脉冲跟着演示矩形走，与「当前选中谁」无关 */
const demoRect = computed(() => objects.find((item): item is RectObject => item.kind === 'rect') ?? null)

const guidePoint = computed<Point | null>(() => {
  const o = demoRect.value
  if (!o) return null
  if (guide.value === 'width') return { x: o.x + o.width, y: o.y + o.height / 2 }
  const inset = Math.min(
    demo.radiusGrip.baseInset + demo.radiusGrip.arcToCorner * o.radius,
    o.width * 0.45,
    o.height * 0.45,
  )
  return { x: o.x + o.width - inset, y: o.y + inset }
})

/* ---------- 命中测试 ---------- */

function pointInBox(box: BoxObject, point: Point, slop: number): boolean {
  return (
    point.x >= box.x - slop &&
    point.x <= box.x + box.width + slop &&
    point.y >= box.y - slop &&
    point.y <= box.y + box.height + slop
  )
}

function hitObject(o: DemoObject, point: Point): boolean {
  const slop = demo.stroke.hitSlop * ui.value
  switch (o.kind) {
    case 'rect':
      return pointInBox(o, point, slop + o.stroke / 2)
    case 'ellipse': {
      const rx = o.width / 2 + slop
      const ry = o.height / 2 + slop
      if (rx <= 0 || ry <= 0) return false
      const dx = (point.x - (o.x + o.width / 2)) / rx
      const dy = (point.y - (o.y + o.height / 2)) / ry
      return dx * dx + dy * dy <= 1
    }
    case 'highlight':
    case 'blur':
    case 'glow':
      return pointInBox(o, point, slop)
    case 'arrow':
      return distToPolyline(arrowPolyline(o), point) <= slop + o.stroke / 2
    case 'line':
      return distToSegment(point, o.from, o.to) <= slop + o.stroke / 2
    case 'freehand':
      return distToPolyline(o.points, point) <= slop + o.stroke / 2
    case 'text':
      return pointInBox(textBox(o), point, slop)
    case 'number': {
      const radius = numberRadius(o)
      if (dist(point, o.center) <= radius + slop) return true
      return distToSegment(point, o.center, o.tip) <= slop + o.stroke / 2
    }
  }
}

type Hit =
  | { type: 'radius' }
  | { type: 'handle'; id: HandleKey }
  | { type: 'object'; object: DemoObject }
  | { type: 'empty' }

/** 命中顺序与真实软件一致：圆角柄 → 选中对象的手柄 → 最上层对象 */
function hitTest(point: Point): Hit {
  const o = selected.value
  if (o && !playing.value) {
    const pad = pickSize.value + handleSize.value / 2
    const gripPoint = grip.value
    if (gripPoint && Math.abs(point.x - gripPoint.x) <= pad && Math.abs(point.y - gripPoint.y) <= pad) {
      return { type: 'radius' }
    }
    for (const handle of handles.value) {
      if (Math.abs(point.x - handle.x) <= pad && Math.abs(point.y - handle.y) <= pad) {
        return { type: 'handle', id: handle.id }
      }
    }
  }
  for (let i = objects.length - 1; i >= 0; i -= 1) {
    if (hitObject(objects[i], point)) return { type: 'object', object: objects[i] }
  }
  return { type: 'empty' }
}

function topmostObject(point: Point): DemoObject | null {
  for (let i = objects.length - 1; i >= 0; i -= 1) {
    if (hitObject(objects[i], point)) return objects[i]
  }
  return null
}

/* ---------- 拖拽 ---------- */

type DragMode = 'radius' | 'move' | 'handle' | 'draft' | 'tip'

/** 移动开始时的几何快照：每次 pointermove 都从它 + 位移重新算，不能累加 */
type MoveStart =
  | { kind: 'box'; x: number; y: number }
  | { kind: 'arrow'; from: Point; to: Point; c1: Point; c2: Point }
  | { kind: 'line'; from: Point; to: Point }
  | { kind: 'freehand'; points: Point[] }
  | { kind: 'text'; x: number; y: number }
  | { kind: 'number'; center: Point; tip: Point }

interface DragState {
  mode: DragMode
  handle: HandleKey | null
  object: DemoObject
  origin: Point
  box: DOMRect
  startBox: { x: number; y: number; width: number; height: number; radius: number } | null
  startBounds: { x0: number; y0: number; x1: number; y1: number }
  moveStart: MoveStart | null
}

let drag: DragState | null = null
/** 自动演示被用户打断后不再继续 */
let aborted = false
let played = false
let resizeObserver: ResizeObserver | null = null

const draggingMode = ref<DragMode | null>(null)
const hoverCursor = ref<string | null>(null)

const cursor = computed(() => {
  // 窄屏是静态展示，别给「可以拖」的光标暗示
  if (narrow.value) return 'default'
  if (draggingMode.value === 'move') return 'grabbing'
  if (hoverCursor.value) return hoverCursor.value
  return activeTool.value === 'move' ? 'default' : 'crosshair'
})

function measure(): DOMRect | null {
  return stageEl.value ? stageEl.value.getBoundingClientRect() : null
}

/** 屏幕坐标 → 舞台坐标（viewBox 与舞台同比例，缩放只是线性换算） */
function stagePoint(ev: MouseEvent, box: DOMRect | null): Point | null {
  if (!box || box.width === 0 || box.height === 0) return null
  return {
    x: ((ev.clientX - box.left) / box.width) * stage.width,
    y: ((ev.clientY - box.top) / box.height) * stage.height,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function clampPoint(point: Point): Point {
  return { x: clamp(point.x, 0, stage.width), y: clamp(point.y, 0, stage.height) }
}

function beginDrag(state: Omit<DragState, 'box'> & { box: DOMRect | null }, ev: PointerEvent): void {
  drag = { ...state, box: state.box ?? (measure() as DOMRect) }
  draggingMode.value = state.mode
  // 不靠 setPointerCapture：Vue 重建节点时捕获会立刻丢掉，改用 window 监听拖到舞台外也接得住
  window.addEventListener('pointermove', onDragPointerMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
  ev.preventDefault()
}

function onPointerDown(ev: PointerEvent): void {
  if (narrow.value) return
  if (
    (ev.target as Element | null)?.closest?.(
      '.as-demo__toolbar, .as-demo__controls, .as-demo__badge-toggle, .as-demo__badge-menu, .as-demo__editor',
    )
  ) {
    return
  }
  if (ev.pointerType === 'mouse' && ev.button !== 0) return
  const box = measure()
  const raw = stagePoint(ev, box)
  if (!raw || !box) return
  const point = clampPoint(raw)
  // 用户一动手就接管：停掉自动演示，但引导要留下（以前这里设成 done，用户一碰画布就再也看不到引导）
  if (playing.value) {
    clearTimers()
    playing.value = false
    caption.value = ''
    guide.value = 'radius'
    // 还没画完就被接管：剩一个 0 尺寸矩形没有意义，直接收走
    const leftover = demoRect.value
    if (leftover && isDegenerate(leftover)) removeObject(leftover)
  }
  aborted = true
  badgeMenuId.value = null

  const hit = hitTest(point)
  if (hit.type === 'radius') {
    const o = selected.value
    if (!o || !hasCorner(o)) return
    if (guide.value === 'radius') guide.value = 'width'
    beginDrag(
      {
        mode: 'radius',
        handle: null,
        object: o,
        origin: point,
        box,
        startBox: { x: o.x, y: o.y, width: o.width, height: o.height, radius: cornerValue(o) },
        startBounds: boundsOf(o),
        moveStart: null,
      },
      ev,
    )
    return
  }

  if (hit.type === 'handle') {
    const o = selected.value
    if (!o) return
    beginDrag(
      {
        mode: 'handle',
        handle: hit.id,
        object: o,
        origin: point,
        box,
        startBox: isBox(o)
          ? { x: o.x, y: o.y, width: o.width, height: o.height, radius: o.kind === 'rect' ? o.radius : 0 }
          : null,
        startBounds: boundsOf(o),
        moveStart: null,
      },
      ev,
    )
    return
  }

  if (hit.type === 'object') {
    const o = hit.object
    // 文本工具点已有文字就改它（双击仍可进编辑），不另开一个新对象
    if (o.kind === 'text' && activeTool.value === 'text') {
      selectedId.value = o.id
      ev.preventDefault()
      editText(o)
      return
    }
    const selectsOnly = activeTool.value === 'move' || o.kind === 'number'
    if (selectsOnly) {
      selectedId.value = o.id
      if (activeTool.value === 'move') {
        beginDrag(
          {
            mode: 'move',
            handle: null,
            object: o,
            origin: point,
            box,
            startBox: null,
            startBounds: boundsOf(o),
            moveStart: snapshotForMove(o),
          },
          ev,
        )
      }
      return
    }
  } else if (activeTool.value === 'move') {
    selectedId.value = null
    return
  }

  startDraft(point, box, ev)
}

function onHoverMove(ev: PointerEvent): void {
  if (!drag) updateHover(ev)
}

function onDragPointerMove(ev: PointerEvent): void {
  if (!drag) return
  const raw = stagePoint(ev, drag.box)
  if (!raw) return
  const point = clampPoint(raw)
  const shift = ev.shiftKey

  if (drag.mode === 'radius') {
    const o = drag.object
    const start = drag.startBox
    if (!hasCorner(o) || !start) return
    const dx = point.x - drag.origin.x
    const dy = point.y - drag.origin.y
    // 朝中心（左下）拖增大、朝角（右上）拖减小：radius_delta = (dy - dx) / 2
    setCornerValue(o, clamp(start.radius + (dy - dx) * 0.5, 0, Math.min(o.width, o.height) / 2))
    return
  }

  if (drag.mode === 'move' && drag.moveStart) {
    const dx = point.x - drag.origin.x
    const dy = point.y - drag.origin.y
    const bounds = drag.startBounds
    const moveX = clamp(dx, -bounds.x0, Math.max(stage.width - bounds.x1, -bounds.x0))
    const moveY = clamp(dy, -bounds.y0, Math.max(stage.height - bounds.y1, -bounds.y0))
    applyMove(drag.object, drag.moveStart, moveX, moveY)
    return
  }

  if (drag.mode === 'handle') {
    updateHandle(drag, point, shift)
    return
  }

  if (drag.mode === 'draft') {
    updateDraft(drag, point, shift)
    return
  }

  if (drag.mode === 'tip') {
    const o = drag.object
    if (o.kind !== 'number') return
    o.tip = shift ? snapDirection(o.center, point) : point
  }
}

function snapshotForMove(o: DemoObject): MoveStart {
  if (isBox(o)) return { kind: 'box', x: o.x, y: o.y }
  switch (o.kind) {
    case 'arrow':
      return { kind: 'arrow', from: { ...o.from }, to: { ...o.to }, c1: { ...o.c1 }, c2: { ...o.c2 } }
    case 'line':
      return { kind: 'line', from: { ...o.from }, to: { ...o.to } }
    case 'freehand':
      return { kind: 'freehand', points: o.points.map((point) => ({ ...point })) }
    case 'text':
      return { kind: 'text', x: o.x, y: o.y }
    case 'number':
      return { kind: 'number', center: { ...o.center }, tip: { ...o.tip } }
  }
}

/** 从快照 + 位移算出位置（不是叠在当前位置上，否则每次 pointermove 都会重复累加） */
function applyMove(o: DemoObject, start: MoveStart, dx: number, dy: number): void {
  if (start.kind === 'box' && isBox(o)) {
    o.x = start.x + dx
    o.y = start.y + dy
    return
  }
  if (start.kind === 'arrow' && o.kind === 'arrow') {
    o.from = { x: start.from.x + dx, y: start.from.y + dy }
    o.to = { x: start.to.x + dx, y: start.to.y + dy }
    o.c1 = { x: start.c1.x + dx, y: start.c1.y + dy }
    o.c2 = { x: start.c2.x + dx, y: start.c2.y + dy }
    return
  }
  if (start.kind === 'line' && o.kind === 'line') {
    o.from = { x: start.from.x + dx, y: start.from.y + dy }
    o.to = { x: start.to.x + dx, y: start.to.y + dy }
    return
  }
  if (start.kind === 'freehand' && o.kind === 'freehand') {
    o.points = start.points.map((point) => ({ x: point.x + dx, y: point.y + dy }))
    return
  }
  if (start.kind === 'text' && o.kind === 'text') {
    o.x = start.x + dx
    o.y = start.y + dy
    return
  }
  if (start.kind === 'number' && o.kind === 'number') {
    o.center = { x: start.center.x + dx, y: start.center.y + dy }
    o.tip = { x: start.tip.x + dx, y: start.tip.y + dy }
  }
}

function updateHandle(state: DragState, point: Point, shift: boolean): void {
  const o = state.object
  if (isBox(o) && state.startBox && state.handle) {
    const start = state.startBox
    const dx = point.x - state.origin.x
    const dy = point.y - state.origin.y
    const minSide = demo.minSide * ui.value
    let { x, y, width, height } = start
    if (state.handle.includes('w')) {
      const left = Math.min(start.x + dx, start.x + start.width - minSide)
      x = left
      width = start.x + start.width - left
    }
    if (state.handle.includes('n')) {
      const top = Math.min(start.y + dy, start.y + start.height - minSide)
      y = top
      height = start.y + start.height - top
    }
    if (state.handle.includes('e')) width = Math.max(start.width + dx, minSide)
    if (state.handle.includes('s')) height = Math.max(start.height + dy, minSide)
    o.x = x
    o.y = y
    o.width = width
    o.height = height
    // 缩小时圆角可能超过新的短边一半，跟着收回
    if (hasCorner(o)) setCornerValue(o, Math.min(cornerValue(o), Math.min(width, height) / 2))
    return
  }

  if (o.kind === 'arrow' || o.kind === 'line') {
    if (state.handle === 'from') {
      o.from = shift ? snapDirection(o.to, point) : point
    } else if (state.handle === 'to') {
      o.to = shift ? snapDirection(o.from, point) : point
    } else if (o.kind === 'arrow' && state.handle === 'c1') {
      o.c1 = point
    } else if (o.kind === 'arrow' && state.handle === 'c2') {
      o.c2 = point
    }
  }
}

function updateDraft(state: DragState, point: Point, shift: boolean): void {
  const o = state.object
  const origin = state.origin

  if (isBox(o)) {
    const square = shift && (o.kind === 'rect' || o.kind === 'ellipse')
    const end = square ? squareCorner(origin, point) : point
    o.x = Math.min(origin.x, end.x)
    o.y = Math.min(origin.y, end.y)
    o.width = Math.abs(end.x - origin.x)
    o.height = Math.abs(end.y - origin.y)
    return
  }

  if (o.kind === 'arrow') {
    const end = shift ? snapDirection(origin, point) : point
    o.to = end
    // 拖动中重建箭头：控制点保持在 1/3、2/3 处（EDT-3 从直线开始）
    o.c1 = lerp(origin, end, 1 / 3)
    o.c2 = lerp(origin, end, 2 / 3)
    return
  }

  if (o.kind === 'line') {
    o.to = shift ? snapDirection(origin, point) : point
    return
  }

  if (o.kind === 'number') {
    o.tip = shift ? snapDirection(o.center, point) : point
    return
  }

  if (o.kind === 'freehand') {
    const last = o.points[o.points.length - 1]
    const step = demo.freehand.minStep * ui.value
    if (dist(last, point) >= step) o.points.push(point)
  }
}

function endDrag(): void {
  if (drag?.mode === 'draft') finishDraft(drag.object)
  drag = null
  draggingMode.value = null
  window.removeEventListener('pointermove', onDragPointerMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
}

function isDegenerate(o: DemoObject): boolean {
  const limit = demo.degenerate * ui.value
  switch (o.kind) {
    case 'rect':
    case 'highlight':
    case 'blur':
    case 'glow':
      return Math.abs(o.width) < limit && Math.abs(o.height) < limit
    case 'ellipse':
      return Math.abs(o.width) < limit || Math.abs(o.height) < limit
    case 'arrow':
    case 'line':
      return dist(o.from, o.to) < limit
    case 'freehand':
      return o.points.length < 2 || polylineLength(o.points) < limit
    default:
      return false
  }
}

function finishDraft(o: DemoObject): void {
  if (isDegenerate(o)) {
    removeObject(o)
    return
  }
  // 真的画出了新对象，圆角引导就收起来
  if (guide.value !== 'done') guide.value = 'done'
}

function removeObject(o: DemoObject): void {
  const index = objects.findIndex((item) => item.id === o.id)
  if (index >= 0) objects.splice(index, 1)
  if (selectedId.value === o.id) selectedId.value = null
  if (badgeMenuId.value === o.id) badgeMenuId.value = null
}

/** 新建对象：按下点即起点，几何在拖动中长出来 */
function createObject(tool: string, point: Point): DemoObject | null {
  const base = { id: nextId++, color: swatch }
  switch (tool) {
    case 'rect':
      return { ...base, kind: 'rect', x: point.x, y: point.y, width: 0, height: 0, radius: 0, stroke: defaults.stroke, filled: filled.value }
    case 'ellipse':
      return { ...base, kind: 'ellipse', x: point.x, y: point.y, width: 0, height: 0, stroke: defaults.stroke, filled: filled.value }
    case 'highlight':
      return { ...base, kind: 'highlight', x: point.x, y: point.y, width: 0, height: 0, corner: 0 }
    case 'blur':
      return { ...base, kind: 'blur', x: point.x, y: point.y, width: 0, height: 0, radius: defaults.blur, corner: 0 }
    case 'glow':
      return { id: base.id, kind: 'glow', x: point.x, y: point.y, width: 0, height: 0, corner: 0 }
    case 'arrow': {
      const end = { ...point }
      return {
        ...base,
        kind: 'arrow',
        from: { ...point },
        to: end,
        c1: lerp(point, end, 1 / 3),
        c2: lerp(point, end, 2 / 3),
        stroke: defaults.stroke,
      }
    }
    case 'line':
      return { ...base, kind: 'line', from: { ...point }, to: { ...point }, stroke: defaults.stroke }
    case 'freehand':
      return { ...base, kind: 'freehand', points: [point], stroke: defaults.stroke }
    case 'text':
      return {
        id: base.id,
        kind: 'text',
        x: point.x,
        y: point.y,
        text: '',
        fontSize: defaults.textSize,
        color: base.color,
      }
    case 'number':
      return {
        id: base.id,
        kind: 'number',
        center: { ...point },
        tip: { ...point },
        mark: 'num',
        value: nextNumber(),
        fontSize: defaults.numberSize,
        stroke: defaults.stroke,
        color: base.color,
      }
    default:
      return null
  }
}

function startDraft(point: Point, box: DOMRect, ev: PointerEvent): void {
  const draft = createObject(activeTool.value, point)
  if (!draft) return
  objects.push(draft)
  // 数组里存的是响应式代理：后续拖拽必须改代理，改原始对象不会触发重绘与手柄重算
  const o = objects[objects.length - 1]
  selectedId.value = o.id

  // 文本工具是点击放置：落点即输入框，不需要拖动草稿
  if (o.kind === 'text') {
    ev.preventDefault()
    void nextTick(() => editText(o))
    return
  }

  beginDrag(
    {
      mode: o.kind === 'number' ? 'tip' : 'draft',
      handle: null,
      object: o,
      origin: point,
      box,
      startBox: null,
      startBounds: boundsOf(o),
      moveStart: null,
    },
    ev,
  )
}

/* ---------- 文本编辑 ---------- */

const editingText = ref<TextObject | null>(null)
const textInput = ref<HTMLInputElement | null>(null)
let editingBackup = ''

function editText(o: TextObject): void {
  editingBackup = o.text
  editingText.value = o
  void nextTick(() => {
    textInput.value?.focus()
    textInput.value?.select()
  })
}

function commitText(): void {
  const o = editingText.value
  if (!o) return
  editingText.value = null
  o.text = o.text.trim()
  if (!o.text) removeObject(o)
}

function cancelText(): void {
  const o = editingText.value
  if (!o) return
  editingText.value = null
  o.text = editingBackup
  if (!o.text) removeObject(o)
}

function onDoubleClick(ev: MouseEvent): void {
  if (
    (ev.target as Element | null)?.closest?.(
      '.as-demo__editor, .as-demo__toolbar, .as-demo__controls, .as-demo__badge-toggle, .as-demo__badge-menu',
    )
  ) {
    return
  }
  const point = stagePoint(ev, measure())
  if (!point) return
  const o = selected.value
  if (o?.kind === 'arrow' && !playing.value) {
    const pad = pickSize.value + handleSize.value / 2
    for (const id of ['c1', 'c2'] as const) {
      const handle = o[id]
      if (Math.abs(point.x - handle.x) <= pad && Math.abs(point.y - handle.y) <= pad) {
        // 双击控制柄恢复直线（EDT-3）
        o.c1 = lerp(o.from, o.to, 1 / 3)
        o.c2 = lerp(o.from, o.to, 2 / 3)
        return
      }
    }
  }
  const hit = topmostObject(point)
  if (!hit) return
  if (hit.kind === 'text') {
    editText(hit)
    return
  }
  if (hit.kind === 'number' && hit.mark !== 'num') {
    // 符号徽标双击直接在对勾 / 叉号之间切换（EDT-20）
    hit.mark = hit.mark === 'check' ? 'cross' : 'check'
  }
}

/* ---------- 徽标形态菜单 ---------- */

const badgeMenuId = ref<number | null>(null)

const badgeToggleStyle = computed(() => {
  const o = selectedNumber.value
  if (!o) return {}
  const radius = numberRadius(o)
  return {
    left: `${((o.center.x + radius * 0.72) / stage.width) * 100}%`,
    top: `${((o.center.y + radius * 0.72) / stage.height) * 100}%`,
  }
})

const badgeMenuStyle = computed(() => {
  const o = selectedNumber.value
  if (!o) return {}
  const left = ((o.center.x - numberRadius(o)) / stage.width) * 100
  return {
    // 贴边时往回收：菜单约 78 × 92，不夹会被舞台的 overflow: hidden 裁掉
    left: `clamp(0px, ${left}%, calc(100% - 78px))`,
    top: `min(calc(${badgeToggleStyle.value.top} + 22px), calc(100% - 92px))`,
  }
})

function toggleBadgeMenu(): void {
  const o = selectedNumber.value
  if (!o) return
  badgeMenuId.value = badgeMenuId.value === o.id ? null : o.id
}

function setBadgeMark(o: NumberObject, next: BadgeMark): void {
  const wasSymbol = o.mark !== 'num'
  o.mark = next
  if (next === 'num' && wasSymbol) o.value = nextNumber()
  badgeMenuId.value = null
}

/* ---------- 滚轮 / 键盘 ---------- */

function adjustObject(o: DemoObject, delta: number): boolean {
  switch (o.kind) {
    case 'highlight':
    case 'glow':
      return false
    case 'blur': {
      const next = clamp(o.radius + delta, demo.blur.min, demo.blur.max)
      if (next === o.radius) return false
      o.radius = next
      defaults.blur = next
      return true
    }
    case 'text': {
      const next = clamp(o.fontSize + delta, demo.fontSize.min, demo.fontSize.max)
      if (next === o.fontSize) return false
      o.fontSize = next
      defaults.textSize = next
      return true
    }
    case 'number': {
      const next = clamp(o.fontSize + delta, demo.fontSize.min, demo.fontSize.max)
      if (next === o.fontSize) return false
      o.fontSize = next
      defaults.numberSize = next
      return true
    }
    default: {
      const next = clamp(o.stroke + delta, demo.stroke.minWidth, demo.stroke.maxWidth)
      if (next === o.stroke) return false
      o.stroke = next
      defaults.stroke = next
      return true
    }
  }
}

function adjustDefault(tool: string, delta: number): boolean {
  if (tool === 'highlight' || tool === 'glow' || tool === 'move') return false
  if (tool === 'blur') {
    const next = clamp(defaults.blur + delta, demo.blur.min, demo.blur.max)
    if (next === defaults.blur) return false
    defaults.blur = next
    return true
  }
  if (tool === 'text') {
    const next = clamp(defaults.textSize + delta, demo.fontSize.min, demo.fontSize.max)
    if (next === defaults.textSize) return false
    defaults.textSize = next
    return true
  }
  if (tool === 'number') {
    const next = clamp(defaults.numberSize + delta, demo.fontSize.min, demo.fontSize.max)
    if (next === defaults.numberSize) return false
    defaults.numberSize = next
    return true
  }
  const next = clamp(defaults.stroke + delta, demo.stroke.minWidth, demo.stroke.maxWidth)
  if (next === defaults.stroke) return false
  defaults.stroke = next
  return true
}

/** 滚轮：悬停在对象上改它，空白处只改下一次绘制的默认值（wheel.rs） */
function onWheel(ev: WheelEvent): void {
  if (narrow.value) return
  if (ev.deltaY === 0) return
  const point = stagePoint(ev, measure())
  if (!point) return
  const hit = hitTest(point)
  const target = hit.type === 'object' ? hit.object : hit.type === 'empty' ? null : selected.value
  const step = demo.stroke.wheelStep * (ev.ctrlKey ? demo.stroke.ctrlStep : 1)
  const delta = ev.deltaY < 0 ? step : -step
  const changed = target ? adjustObject(target, delta) : adjustDefault(activeTool.value, delta)
  if (!changed) return
  ev.preventDefault()
  // 只有已经完成第一步（拖过圆角柄）时，滚轮才算完成第二步
  if (guide.value === 'width') guide.value = 'done'
}

/** 键盘也能改圆角：圆点可以 Tab 到，方向键增减 */
function onGripKey(ev: KeyboardEvent): void {
  if (narrow.value) return
  const o = selected.value
  if (!o || !hasCorner(o)) return
  const value = cornerValue(o)
  const max = Math.min(o.width, o.height) / 2
  const step = ev.shiftKey ? 5 : 1
  if (ev.key === 'ArrowUp' || ev.key === 'ArrowRight') {
    setCornerValue(o, Math.min(value + step, max))
  } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowLeft') {
    setCornerValue(o, Math.max(value - step, 0))
  } else {
    return
  }
  if (guide.value === 'radius') guide.value = 'width'
  aborted = true
  ev.preventDefault()
}

/** 工具栏数字键：与软件一致（1–9 / 0 切工具、V 回移动、Esc 取消选中），只在舞台于视口内时接管 */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.tagName !== 'string') return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true
}

function onWindowKey(ev: KeyboardEvent): void {
  if (narrow.value || !stageVisible.value) return
  if (ev.ctrlKey || ev.altKey || ev.metaKey || isTypingTarget(ev.target)) return

  if (ev.key === 'Escape') {
    // 文字编辑框与徽标菜单各自处理 Esc，不在这里重复
    if (editingText.value || badgeMenuId.value !== null) return
    if (selectedId.value !== null) {
      selectedId.value = null
      ev.preventDefault()
    }
    return
  }

  if (ev.key === 'v' || ev.key === 'V') {
    setTool('move')
    ev.preventDefault()
    return
  }

  const tool = tools.find((item) => item.key === ev.key)
  if (!tool) return
  setTool(tool.icon)
  ev.preventDefault()
}

function setTool(icon: string): void {
  activeTool.value = icon
  editingText.value = null
  badgeMenuId.value = null
  // 绘制工具下点对象是「画新的」，保留选中会让人以为能直接编辑
  selectedId.value = null
}

function toggleFill(): void {
  filled.value = !filled.value
  const o = selected.value
  if (o && (o.kind === 'rect' || o.kind === 'ellipse')) o.filled = filled.value
}

function updateHover(ev: PointerEvent): void {
  if (playing.value || narrow.value) {
    hoverCursor.value = null
    return
  }
  const point = stagePoint(ev, measure())
  if (!point) {
    hoverCursor.value = null
    return
  }
  const hit = hitTest(point)
  if (hit.type === 'radius') {
    hoverCursor.value = 'nesw-resize'
    return
  }
  if (hit.type === 'handle') {
    const handle = handles.value.find((item) => item.id === hit.id)
    hoverCursor.value = handle?.cursor ?? 'move'
    return
  }
  if (hit.type === 'object') {
    hoverCursor.value = activeTool.value === 'move' || hit.object.kind === 'number' ? 'grab' : 'crosshair'
    return
  }
  hoverCursor.value = null
}

/* ---------- 自动演示：进视口演一遍，只播一次 ---------- */

const { inView } = useInView(stageEl)
/** 舞台在不在视口内：在视口内才接管键盘，用户在页面别处按键时不受影响 */
const { inView: stageVisible } = useInView(stageEl, { once: false })
const { reduced: reducedMotion } = useReducedMotion()
/** 正在自动演示：此时才给矩形加过渡，平时拖拽是即时的 */
const playing = ref(false)
/** 水化前不渲染手柄 / 圆角柄，否则无 JS 的首屏是「看着能玩、其实不能」的假界面 */
const hydrated = ref(false)
/** 窄屏只做静态展示：画布只有约 200px 高，拖着看不清，滚轮也会跟页面滚动打架 */
const narrow = ref(false)
const NARROW_QUERY = '(max-width: 767px)'
let narrowMql: MediaQueryList | null = null
let timers: number[] = []

/** 窄屏拉宽后补播一次（窄屏期间 played 没置位，所以能播） */
function onNarrowChange(ev: MediaQueryListEvent): void {
  narrow.value = ev.matches
  if (!ev.matches) void autoplay()
}

function clearTimers(): void {
  timers.forEach((id) => window.clearTimeout(id))
  timers = []
}

function makeDemoRect(): RectObject {
  return {
    id: nextId++,
    kind: 'rect',
    x: demo.initialRect.x,
    y: demo.initialRect.y,
    width: 0,
    height: 0,
    radius: 0,
    stroke: 2,
    color: swatch,
    filled: false,
  }
}

async function autoplay(): Promise<void> {
  if (played) return
  // 窄屏不演：首帧那张成品就是最终效果，不置 played，拉宽窗口时还能补播
  if (narrow.value) return
  played = true
  // 系统开了「减少动态效果」：不演，直接用手上的成品帧，把手柄和引导亮出来
  if (reducedMotion.value) {
    const rect = objects.find((item): item is RectObject => item.kind === 'rect')
    if (!rect) return
    rect.width = demo.initialRect.width
    rect.height = demo.initialRect.height
    rect.radius = Math.min(demo.staticFrame.radius, Math.min(rect.width, rect.height) / 2)
    rect.stroke = demo.staticFrame.stroke
    selectedId.value = rect.id
    guide.value = 'radius'
    return
  }
  aborted = false

  objects.splice(0, objects.length)
  objects.push(makeDemoRect())
  // 取数组里的响应式代理，接下来改的属性才会驱动过渡
  const rect = objects[0] as RectObject
  selectedId.value = rect.id
  guide.value = 'done'

  // 先把「还没画」的状态落定，再加过渡。
  // 否则 620 → 0 与 0 → 620 两段过渡会叠在一起，看起来是先缩后放。
  await nextTick()
  void stageEl.value?.offsetWidth

  playing.value = true
  caption.value = '① 拖出一个矩形'

  // 1) 画出来：1 秒，手拖的节奏
  timers.push(
    window.setTimeout(() => {
      if (aborted) return
      rect.width = demo.initialRect.width
      rect.height = demo.initialRect.height
    }, 300),
  )

  // 2) 拖圆角（0.9s），先给字幕 2 秒的时间读
  timers.push(
    window.setTimeout(() => {
      if (aborted) return
      caption.value = '② 按住右上角的小圆点往里拖 → 圆角变大'
    }, 1500),
  )
  timers.push(
    window.setTimeout(() => {
      if (aborted) return
      rect.radius = Math.min(demo.staticFrame.radius, Math.min(rect.width, rect.height) / 2)
    }, 2000),
  )

  // 3) 滚轮变粗（0.7s）
  timers.push(
    window.setTimeout(() => {
      if (aborted) return
      caption.value = '③ 在这条边上滚滚轮 → 边框变粗'
    }, 3300),
  )
  timers.push(
    window.setTimeout(() => {
      if (aborted) return
      rect.stroke = demo.staticFrame.stroke
    }, 3800),
  )

  // 演完交出：字幕退场，脉冲引导接管
  timers.push(
    window.setTimeout(() => {
      playing.value = false
      caption.value = ''
      guide.value = 'radius'
    }, 4900),
  )
}

watch(inView, (value) => {
  if (value) void autoplay()
})

/** 重置并重新演一遍：按钮叫「重播演示」，点了就该看得到东西发生 */
function resetDemo(): void {
  clearTimers()
  aborted = true
  played = false
  playing.value = false
  caption.value = ''
  guide.value = 'done'
  editingText.value = null
  badgeMenuId.value = null
  selectedId.value = null
  defaults.stroke = demo.stroke.defaultWidth
  defaults.blur = demo.blur.default
  defaults.textSize = demo.text.defaultSize
  defaults.numberSize = demo.number.defaultFontSize
  filled.value = false
  void autoplay()
}

/** 清空：只清画布，不重播（与「重播演示」分开） */
function clearAll(): void {
  clearTimers()
  aborted = true
  played = true
  playing.value = false
  caption.value = ''
  guide.value = 'done'
  editingText.value = null
  badgeMenuId.value = null
  selectedId.value = null
  objects.splice(0, objects.length)
}

onMounted(() => {
  hydrated.value = true
  coarsePointer.value = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  if (typeof matchMedia === 'function') {
    narrowMql = matchMedia(NARROW_QUERY)
    narrow.value = narrowMql.matches
    narrowMql.addEventListener('change', onNarrowChange)
  }
  const el = stageEl.value
  if (!el) return
  window.addEventListener('keydown', onWindowKey)
  stageWidthPx.value = el.clientWidth || stage.width
  if (typeof ResizeObserver === 'undefined') return
  const observer = new ResizeObserver(() => {
    stageWidthPx.value = el.clientWidth || stage.width
  })
  observer.observe(el)
  resizeObserver = observer
})

onBeforeUnmount(() => {
  clearTimers()
  endDrag()
  window.removeEventListener('keydown', onWindowKey)
  narrowMql?.removeEventListener('change', onNarrowChange)
  narrowMql = null
  resizeObserver?.disconnect()
  resizeObserver = null
})

/* ---------- 样式注入 ---------- */

const paletteStyle = computed(() => ({
  '--as-demo-bg': palette.value.bg,
  '--as-demo-border': palette.value.border,
  '--as-demo-icon': palette.value.icon,
  '--as-demo-divider': palette.value.divider,
  '--as-demo-accent': palette.value.accent,
  '--as-demo-accent-soft': palette.value.accentSoft,
  '--as-demo-swatch-border': palette.value.swatchBorder,
  '--as-demo-row-hover': palette.value.rowHover,
  '--as-demo-shadow': palette.value.shadow,
}))

function iconStyle(icon: string): Record<string, string> {
  return { '--as-demo-mask': `url(/demo/icons/${icon}.svg)` }
}

const guideStyle = computed(() => {
  const point = guidePoint.value
  if (!point) return {}
  return {
    '--as-demo-x': `${(point.x / stage.width) * 100}%`,
    '--as-demo-y': `${(point.y / stage.height) * 100}%`,
  }
})

/** 卡片按 viewBox 百分比定位，与矩形共用同一坐标系，才不会错位 */
const cardStyle = computed(() => ({
  left: `${(demo.docCard.x / stage.width) * 100}%`,
  top: `${(demo.docCard.y / stage.height) * 100}%`,
  width: `${(demo.docCard.width / stage.width) * 100}%`,
  height: `${(demo.docCard.height / stage.height) * 100}%`,
}))

/** 自动演示期间由字幕接管，演完后才出脉冲 */
const showHint = computed(
  () => !playing.value && guide.value !== 'done' && activeTool.value === 'rect' && guidePoint.value !== null,
)

/** 模糊层：铺在区域上的 backdrop-filter，位置尺寸直接按 viewBox 百分比摆 */
function blurStyle(o: BlurObject): Record<string, string> {
  return {
    left: `${(o.x / stage.width) * 100}%`,
    top: `${(o.y / stage.height) * 100}%`,
    width: `${(o.width / stage.width) * 100}%`,
    height: `${(o.height / stage.height) * 100}%`,
    borderRadius: `${o.corner / ui.value}px`,
    '--as-demo-blur': `${o.radius / ui.value}px`,
  }
}

const editorStyle = computed(() => {
  const o = editingText.value
  if (!o) return {}
  return {
    left: `${(o.x / stage.width) * 100}%`,
    top: `${(o.y / stage.height) * 100}%`,
    width: `${(280 / stage.width) * 100}%`,
    fontSize: `${o.fontSize / ui.value}px`,
    color: o.color,
  }
})

/** 状态行：显示当前选中对象的可调参数，没选中就什么都不显示 */
const statusText = computed(() => {
  const o = selected.value
  if (!o) return ''
  switch (o.kind) {
    case 'rect':
      return `圆角 ${Math.round(o.radius)}px · 线宽 ${Math.round(o.stroke)}px`
    case 'ellipse':
    case 'arrow':
    case 'line':
    case 'freehand':
      return `线宽 ${Math.round(o.stroke)}px`
    case 'blur':
      return `模糊 ${Math.round(o.radius)}px · 圆角 ${Math.round(o.corner)}px`
    case 'text':
      return `字号 ${Math.round(o.fontSize)}px`
    case 'number':
      return o.mark === 'num' ? `编号 ${o.value}` : o.mark === 'check' ? '对勾徽标' : '叉号徽标'
    case 'highlight':
    case 'glow':
      return `圆角 ${Math.round(o.corner)}px`
    default:
      return ''
  }
})
</script>

<template>
  <div id="as-demo" class="as-demo" :style="paletteStyle">
    <p class="as-demo__notice">
      软件里按 <kbd>1</kbd>–<kbd>9</kbd> / <kbd>0</kbd> 就能直接切换这十个工具（快捷键可在设置里改）；这里也能按，只是简化演示，不代表全部功能。
    </p>

    <div
      ref="stageEl"
      class="as-demo__stage"
      :class="{ 'is-playing': playing }"
      :style="{ cursor }"
      tabindex="0"
      role="group"
      aria-label="标注演示台：按 1–9 或 0 切换工具，V 切回移动，Esc 取消选中"
      @wheel="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onHoverMove"
      @pointerup="endDrag"
      @pointerleave="hoverCursor = null"
      @dblclick="onDoubleClick"
    >
      <div class="as-demo__doc" aria-hidden="true">
        <div class="as-demo__panel" :style="cardStyle">
          <p class="as-demo__doc-title">deploy.log <span>site · main</span></p>
          <ul class="as-demo__log">
            <li><span class="as-demo__ok">✓</span> install <em>3.1s</em></li>
            <li><span class="as-demo__ok">✓</span> build <em>12.4s</em></li>
            <li><span class="as-demo__ok">✓</span> upload <em>4.7s</em></li>
            <li><span class="as-demo__fail">✕</span> health check <em>503</em></li>
          </ul>
          <p class="as-demo__doc-url">→ https://airsnip.pages.dev</p>
        </div>
      </div>

      <!-- 模糊层在底图之上、标注之下：backdrop-filter 糊的是真实底图 -->
      <div
        v-for="blur in blurObjects"
        :key="`blur-${blur.id}`"
        class="as-demo__blur"
        :style="blurStyle(blur)"
        aria-hidden="true"
      />

      <svg class="as-demo__ink" :viewBox="`0 0 ${stage.width} ${stage.height}`" role="group" aria-label="标注演示区">
        <defs>
          <mask
            id="as-demo-glow-mask"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            :width="stage.width"
            :height="stage.height"
          >
            <rect x="0" y="0" :width="stage.width" :height="stage.height" fill="#fff" />
            <rect
              v-for="glow in glowObjects"
              :key="`glow-${glow.id}`"
              :x="glow.x"
              :y="glow.y"
              :width="glow.width"
              :height="glow.height"
              :rx="glow.corner"
              fill="#000"
            />
          </mask>
        </defs>

        <rect
          class="as-demo__dim"
          x="0"
          y="0"
          :width="stage.width"
          :height="stage.height"
          :fill="dimFill"
          :mask="glowObjects.length ? 'url(#as-demo-glow-mask)' : undefined"
        />

        <template v-for="obj in objects" :key="obj.id">
          <rect
            v-if="obj.kind === 'rect'"
            class="as-demo__object"
            :x="obj.x"
            :y="obj.y"
            :width="obj.width"
            :height="obj.height"
            :rx="obj.radius"
            :ry="obj.radius"
            :stroke-width="obj.stroke"
            :stroke="obj.color"
            :fill="obj.filled ? obj.color : 'none'"
          />
          <ellipse
            v-else-if="obj.kind === 'ellipse'"
            :cx="obj.x + obj.width / 2"
            :cy="obj.y + obj.height / 2"
            :rx="obj.width / 2"
            :ry="obj.height / 2"
            :stroke-width="obj.stroke"
            :stroke="obj.color"
            :fill="obj.filled ? obj.color : 'none'"
          />
          <rect
            v-else-if="obj.kind === 'highlight'"
            :x="obj.x"
            :y="obj.y"
            :width="obj.width"
            :height="obj.height"
            :rx="obj.corner"
            :fill="obj.color"
            :fill-opacity="highlightOpacity"
            style="mix-blend-mode: multiply"
          />
          <g v-else-if="obj.kind === 'arrow'">
            <path
              :d="arrowBodyPath(obj)"
              :stroke="obj.color"
              :stroke-width="obj.stroke"
              fill="none"
              stroke-linecap="butt"
              stroke-linejoin="miter"
            />
            <polygon :points="arrowHead(obj)" :fill="obj.color" />
          </g>
          <line
            v-else-if="obj.kind === 'line'"
            :x1="obj.from.x"
            :y1="obj.from.y"
            :x2="obj.to.x"
            :y2="obj.to.y"
            :stroke="obj.color"
            :stroke-width="obj.stroke"
            stroke-linecap="round"
          />
          <path
            v-else-if="obj.kind === 'freehand'"
            :d="freehandPath(obj.points)"
            :stroke="obj.color"
            :stroke-width="obj.stroke"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <text
            v-else-if="obj.kind === 'text'"
            class="as-demo__text"
            :class="{ 'is-editing': editingText?.id === obj.id }"
            :x="obj.x"
            :y="obj.y + obj.fontSize"
            :font-size="obj.fontSize"
            :fill="obj.color"
          >
            {{ obj.text }}
          </text>
          <g v-else-if="obj.kind === 'number'">
            <template v-if="dist(obj.center, obj.tip) >= 1">
              <path
                :d="numberLeaderPath(obj)"
                :stroke="obj.color"
                :stroke-width="obj.stroke"
                fill="none"
                stroke-linecap="butt"
              />
              <polygon :points="numberHead(obj)" :fill="obj.color" />
            </template>
            <circle :cx="obj.center.x" :cy="obj.center.y" :r="numberRadius(obj)" :fill="obj.color" />
            <text
              v-if="obj.mark === 'num'"
              class="as-demo__badge-text"
              :x="obj.center.x"
              :y="obj.center.y"
              :font-size="obj.fontSize"
              :fill="badgeInk(obj)"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="700"
            >
              {{ obj.value }}
            </text>
            <path
              v-else-if="obj.mark === 'check'"
              :d="badgeCheckPath(obj)"
              :stroke="badgeInk(obj)"
              :stroke-width="numberRadius(obj) * demo.number.markStrokeK"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              v-else
              :d="badgeCrossPath(obj)"
              :stroke="badgeInk(obj)"
              :stroke-width="numberRadius(obj) * demo.number.markStrokeK"
              fill="none"
              stroke-linecap="round"
            />
          </g>
        </template>

        <g
          v-if="hydrated && handles.length && !playing"
          class="as-demo__frame"
          :stroke="demo.frame.accent"
          :stroke-width="demo.frame.lineWidth"
          fill="none"
        >
          <rect
            v-if="selectedBox"
            :x="selectedBox.x"
            :y="selectedBox.y"
            :width="selectedBox.width"
            :height="selectedBox.height"
          />
          <template v-if="selectedArrow">
            <path
              :d="`M ${selectedArrow.from.x} ${selectedArrow.from.y} L ${selectedArrow.c1.x} ${selectedArrow.c1.y} M ${selectedArrow.c2.x} ${selectedArrow.c2.y} L ${selectedArrow.to.x} ${selectedArrow.to.y}`"
              stroke-dasharray="4 3"
              :stroke="demo.frame.accent"
            />
          </template>
          <rect
            v-for="handle in squareHandles"
            :key="handle.id"
            class="as-demo__handle"
            :x="handle.x - handleSize / 2"
            :y="handle.y - handleSize / 2"
            :width="handleSize"
            :height="handleSize"
            fill="#fff"
            :style="{ cursor: handle.cursor }"
          />
          <circle
            v-for="handle in controlHandles"
            :key="handle.id"
            class="as-demo__control"
            :cx="handle.x"
            :cy="handle.y"
            :r="roundSize"
            fill="#fff"
            :stroke="demo.frame.accent"
            stroke-width="1.5"
            :style="{ cursor: handle.cursor }"
          />
        </g>

        <circle
          v-if="hydrated && grip && !playing"
          :class="['as-demo__grip', { 'is-dragging': draggingMode === 'radius' }]"
          :cx="grip.x"
          :cy="grip.y"
          :r="roundSize"
          fill="#fff"
          :stroke="demo.frame.accent"
          stroke-width="1.5"
          tabindex="0"
          role="slider"
          aria-label="圆角半径"
          :aria-valuenow="Math.round(grip.value)"
          aria-valuemin="0"
          :aria-valuemax="grip.max"
          @keydown="onGripKey"
        />

        <circle
          v-if="showHint && guidePoint"
          class="as-demo__pulse"
          :cx="guidePoint.x"
          :cy="guidePoint.y"
          :r="roundSize * 1.8"
          :stroke="demo.frame.accent"
          stroke-width="1.5"
          fill="none"
          aria-hidden="true"
        />

        <!-- 脉冲只跳三次，停下来的间隙留一圈虚线，免得用户错过引导 -->
        <circle
          v-if="showHint && guide === 'radius' && guidePoint"
          class="as-demo__hint-ring"
          :cx="guidePoint.x"
          :cy="guidePoint.y"
          :r="roundSize * 2.6"
          :stroke="demo.frame.accent"
          stroke-width="1.5"
          stroke-dasharray="3 3"
          fill="none"
          aria-hidden="true"
        />

        <circle
          v-if="selectedNumber && !playing"
          :cx="selectedNumber.center.x"
          :cy="selectedNumber.center.y"
          :r="numberRadius(selectedNumber) + 3"
          :stroke="demo.frame.accent"
          stroke-width="1"
          fill="none"
        />
      </svg>

      <button
        v-if="selectedNumber"
        type="button"
        class="as-demo__badge-toggle"
        :style="badgeToggleStyle"
        aria-label="切换徽标形态"
        :aria-expanded="badgeMenuId === selectedNumber.id"
        @click="toggleBadgeMenu"
      >
        ▾
      </button>
      <div
        v-if="selectedNumber && badgeMenuId === selectedNumber.id"
        class="as-demo__badge-menu"
        :style="badgeMenuStyle"
        role="menu"
      >
        <button type="button" role="menuitem" @click="setBadgeMark(selectedNumber, 'num')">数字</button>
        <button type="button" role="menuitem" @click="setBadgeMark(selectedNumber, 'check')">对勾</button>
        <button type="button" role="menuitem" @click="setBadgeMark(selectedNumber, 'cross')">叉号</button>
      </div>

      <div v-if="editingText" class="as-demo__editor" :style="editorStyle">
        <input
          ref="textInput"
          v-model="editingText.text"
          type="text"
          maxlength="24"
          aria-label="标注文字"
          @keydown.enter.prevent="commitText"
          @keydown.esc.prevent="cancelText"
          @blur="commitText"
        />
      </div>

      <p v-if="caption" class="as-demo__caption" aria-hidden="true">{{ caption }}</p>

      <p
        v-if="showHint && guidePoint"
        class="as-demo__pointer"
        :class="guide === 'width' ? 'as-demo__pointer--right' : 'as-demo__pointer--left'"
        :style="guideStyle"
        aria-hidden="true"
      >
        <strong>{{ guide === 'width' ? '在这条边上滚滚轮' : '按住往里拖' }}</strong>
        <span>{{ guide === 'width' ? '边框会变粗' : '圆角会变大' }}</span>
      </p>

      <div class="as-demo__controls">
        <div class="as-demo__theme" role="group" aria-label="演示软件主题">
          <button
            type="button"
            :class="{ 'is-active': theme === 'light' }"
            :aria-pressed="theme === 'light'"
            @click="theme = 'light'"
          >
            浅色
          </button>
          <button
            type="button"
            :class="{ 'is-active': theme === 'dark' }"
            :aria-pressed="theme === 'dark'"
            @click="theme = 'dark'"
          >
            深色
          </button>
        </div>
        <button type="button" class="as-demo__reset as-demo__only-wide" @click="resetDemo">重播演示</button>
        <button type="button" class="as-demo__reset as-demo__only-wide" @click="clearAll">清空</button>
      </div>

      <div class="as-demo__toolbar" role="toolbar" aria-label="标注工具栏（演示）">
        <button
          type="button"
          class="as-demo__btn"
          :class="{ 'is-active': activeTool === 'move' }"
          :title="`${demo.actions.move.name} ${demo.actions.move.hint}`"
          @click="setTool('move')"
        >
          <span class="as-demo__icon" :style="iconStyle(demo.actions.move.icon)" />
        </button>

        <span class="as-demo__sep" aria-hidden="true" />

        <button
          v-for="tool in tools"
          :key="tool.key"
          type="button"
          class="as-demo__btn"
          :class="{ 'is-active': activeTool === tool.icon }"
          :title="`${tool.name} ${tool.key}`"
          @click="setTool(tool.icon)"
        >
          <span class="as-demo__icon" :style="iconStyle(tool.icon)" />
        </button>

        <span class="as-demo__sep" aria-hidden="true" />

        <div class="as-demo__extra">
          <button
            v-for="(color, index) in demo.swatches.solid"
            :key="color"
            type="button"
            class="as-demo__swatch"
            :class="{ 'is-active': index === 0 }"
            :style="{ '--as-demo-swatch': color }"
            :aria-label="`色块 ${index + 1}`"
          />
          <button
            type="button"
            class="as-demo__swatch as-demo__swatch--gradient"
            :style="{
              '--as-demo-swatch-from': demo.swatches.gradient[0],
              '--as-demo-swatch-to': demo.swatches.gradient[1],
            }"
            aria-label="渐变色块"
          />

          <span class="as-demo__sep" aria-hidden="true" />

          <button
            type="button"
            class="as-demo__btn"
            :class="{ 'is-active': filled }"
            :title="demo.actions.fill.name"
            :aria-pressed="filled"
            @click="toggleFill"
          >
            <span class="as-demo__icon" :style="iconStyle(demo.actions.fill.icon)" />
          </button>
          <button type="button" class="as-demo__btn as-demo__btn--wide" :title="demo.actions.line.name">
            <svg class="as-demo__linestyle" viewBox="0 0 46 20" aria-hidden="true">
              <line x1="8" y1="10" x2="38" y2="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="as-demo__btn" :title="`${demo.actions.undo.name} ${demo.actions.undo.hint}`">
            <span class="as-demo__icon" :style="iconStyle(demo.actions.undo.icon)" />
          </button>
          <button type="button" class="as-demo__btn" :title="`${demo.actions.redo.name} ${demo.actions.redo.hint}`">
            <span class="as-demo__icon" :style="iconStyle(demo.actions.redo.icon)" />
          </button>

          <span class="as-demo__sep" aria-hidden="true" />

          <button type="button" class="as-demo__btn" :title="`${demo.actions.pin.name} ${demo.actions.pin.hint}`">
            <span class="as-demo__icon" :style="iconStyle(demo.actions.pin.icon)" />
          </button>
          <button type="button" class="as-demo__btn" :title="`${demo.actions.longshot.name} ${demo.actions.longshot.hint}`">
            <span class="as-demo__icon" :style="iconStyle(demo.actions.longshot.icon)" />
          </button>

          <span class="as-demo__sep" aria-hidden="true" />

          <button type="button" class="as-demo__btn" :title="`${demo.actions.copy.name} ${demo.actions.copy.hint}`">
            <span class="as-demo__icon" :style="iconStyle(demo.actions.copy.icon)" />
          </button>
          <button type="button" class="as-demo__btn" :title="`${demo.actions.quickSave.name} ${demo.actions.quickSave.hint}`">
            <span class="as-demo__icon" :style="iconStyle(demo.actions.quickSave.icon)" />
          </button>
          <button type="button" class="as-demo__btn" :title="`${demo.actions.save.name} ${demo.actions.save.hint}`">
            <span class="as-demo__icon" :style="iconStyle(demo.actions.save.icon)" />
          </button>
        </div>
      </div>
    </div>

    <p class="as-demo__hint">
      <span class="as-demo__only-wide">
        <template v-if="activeTool === 'rect'">
          拖右上角的小圆点改圆角、拖八个白方块缩放；想移动就先点最左边的「移动」再拖，在矩形上滚滚轮调线宽（按住 Ctrl 三倍步进）。
          右上角还能切软件的浅色 / 深色主题（软件里另有「跟随系统」）。
        </template>
        <template v-else-if="activeTool === 'move'">
          点任意标注选中它，拖一下整体移动；换工具继续画，画完还能拖控制点改。
        </template>
        <template v-else> {{ demo.toolHints[activeTool] }}，在舞台上试一试。 </template>
      </span>
      <span class="as-demo__only-narrow">
        窄屏只展示效果；在电脑上用鼠标打开，就能亲手拖圆角、滚滚轮调线宽。
      </span>
      <a class="as-demo__doc-link" href="/guide/features">全部标注工具 →</a>
      <span v-if="statusText" class="as-demo__state">{{ statusText }}</span>
    </p>
  </div>
</template>
