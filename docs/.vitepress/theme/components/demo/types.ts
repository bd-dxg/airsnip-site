/** 演示台的对象模型与拖拽状态：只描述结构，不含逻辑 */
export interface Point {
  x: number
  y: number
}

export type BadgeMark = 'num' | 'check' | 'cross'

/**
 * 可涂色的对象：`color` 是纯色；用渐变时 `gradient` 记第几套，`color` 存代表色（stops[0]，
 * 软件里文本、徽标数字等只能上单色的地方就用它）。
 */
export interface Painted {
  color: string
  gradient?: number | null
}

export interface BoxObject {
  x: number
  y: number
  width: number
  height: number
}

export interface RectObject extends BoxObject, Painted {
  id: number
  kind: 'rect'
  radius: number
  stroke: number
  filled: boolean
}

export interface EllipseObject extends BoxObject, Painted {
  id: number
  kind: 'ellipse'
  stroke: number
  filled: boolean
}

export interface HighlightObject extends BoxObject, Painted {
  id: number
  kind: 'highlight'
  corner: number
}

export interface BlurObject extends BoxObject {
  id: number
  kind: 'blur'
  radius: number
  corner: number
}

export interface GlowObject extends BoxObject {
  id: number
  kind: 'glow'
  corner: number
}

export interface ArrowObject extends Painted {
  id: number
  kind: 'arrow'
  from: Point
  to: Point
  c1: Point
  c2: Point
  stroke: number
}

export interface LineObject extends Painted {
  id: number
  kind: 'line'
  from: Point
  to: Point
  stroke: number
}

export interface FreehandObject extends Painted {
  id: number
  kind: 'freehand'
  points: Point[]
  stroke: number
}

export interface TextObject extends Painted {
  id: number
  kind: 'text'
  x: number
  y: number
  text: string
  fontSize: number
}

export interface NumberObject extends Painted {
  id: number
  kind: 'number'
  center: Point
  tip: Point
  mark: BadgeMark
  value: number
  fontSize: number
  stroke: number
}

export type DemoObject =
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

export type HandleId = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'
export type HandleKey = HandleId | 'from' | 'to' | 'c1' | 'c2'

export function isBox(o: DemoObject): o is RectObject | EllipseObject | HighlightObject | BlurObject | GlowObject {
  return o.kind === 'rect' || o.kind === 'ellipse' || o.kind === 'highlight' || o.kind === 'blur' || o.kind === 'glow'
}

/** 软件里渐变只对这几类对象开放（overlay/annotate/style.rs 的 kind_supports_gradient） */
export type GradientedObject = RectObject | EllipseObject | ArrowObject | LineObject | FreehandObject | NumberObject

export function supportsGradient(o: DemoObject): o is GradientedObject {
  return (
    o.kind === 'rect' ||
    o.kind === 'ellipse' ||
    o.kind === 'arrow' ||
    o.kind === 'line' ||
    o.kind === 'freehand' ||
    o.kind === 'number'
  )
}
