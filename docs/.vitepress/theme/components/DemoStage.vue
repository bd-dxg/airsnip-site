<script setup lang="ts">
/**
 * 首页演示台：按真实覆盖层 1:1 重绘的工具栏 + 一个完整可编辑的矩形。
 * 阶段 2a 范围：拖动移动、八向手柄缩放、圆角柄改半径、滚轮调线宽、重置、进视口自动演一遍。
 * 所有数字与配色都来自 data/site.ts 的 `demo`，不在这里另写一份。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useInView } from '../../composables/useInView'
import { demo, tools } from '../../data/site'

const stage = demo.stage

const stageEl = ref<HTMLElement | null>(null)
const inkEl = ref<SVGSVGElement | null>(null)

const object = reactive({ ...demo.initialRect })
const radius = ref(0)
const lineWidth = ref(demo.stroke.defaultWidth)
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

/** 圆角上限是短边一半，不是固定值（render/mask.rs 的 clamp_radius） */
const maxRadius = computed(() => Math.min(object.width, object.height) / 2)
const radiusValue = computed(() => Math.round(radius.value))

/** 圆角控制柄贴弧走：内缩 14 + 0.293 × r，最多到短边的 45% */
const gripInset = computed(() =>
  Math.min(
    demo.radiusGrip.baseInset + demo.radiusGrip.arcToCorner * radius.value,
    object.width * 0.45,
    object.height * 0.45,
  ),
)

const grip = computed(() => ({
  x: object.x + object.width - gripInset.value,
  y: object.y + gripInset.value,
}))

type HandleId = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'

/** 八向缩放手柄：四角 + 四边中点 */
const handles = computed<{ id: HandleId; x: number; y: number }[]>(() => {
  const { x, y, width, height } = object
  const midX = x + width / 2
  const midY = y + height / 2
  return [
    { id: 'nw', x, y },
    { id: 'n', x: midX, y },
    { id: 'ne', x: x + width, y },
    { id: 'w', x, y: midY },
    { id: 'e', x: x + width, y: midY },
    { id: 'sw', x, y: y + height },
    { id: 's', x: midX, y: y + height },
    { id: 'se', x: x + width, y: y + height },
  ]
})

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

/* ---------- 拖拽 ---------- */

type DragMode = 'radius' | 'move' | HandleId

interface Drag {
  mode: DragMode
  pointerX: number
  pointerY: number
  box: DOMRect
  start: { x: number; y: number; width: number; height: number }
  radius: number
}

let drag: Drag | null = null
/** 自动演示被用户打断后不再继续 */
let aborted = false
let played = false
let resizeObserver: ResizeObserver | null = null

const draggingMode = ref<DragMode | null>(null)

function measure(): DOMRect | null {
  return stageEl.value ? stageEl.value.getBoundingClientRect() : null
}

/** 屏幕坐标 → 舞台坐标（viewBox 与舞台同比例，缩放只是线性换算） */
function stagePoint(ev: MouseEvent, box: DOMRect | null): { x: number; y: number } | null {
  if (!box || box.width === 0 || box.height === 0) return null
  return {
    x: ((ev.clientX - box.left) / box.width) * stage.width,
    y: ((ev.clientY - box.top) / box.height) * stage.height,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function inObject(point: { x: number; y: number }): boolean {
  const slop = demo.stroke.hitSlop * ui.value
  return (
    point.x >= object.x - slop &&
    point.x <= object.x + object.width + slop &&
    point.y >= object.y - slop &&
    point.y <= object.y + object.height + slop
  )
}

/** 命中顺序与真实软件一致：圆角柄 → 八向手柄 → 对象本体 */
function hitTest(point: { x: number; y: number }): DragMode | null {
  const pick = pickSize.value
  if (Math.abs(point.x - grip.value.x) <= pick + roundSize.value && Math.abs(point.y - grip.value.y) <= pick + roundSize.value) {
    return 'radius'
  }
  for (const handle of handles.value) {
    if (Math.abs(point.x - handle.x) <= pick && Math.abs(point.y - handle.y) <= pick) return handle.id
  }
  return inObject(point) ? 'move' : null
}

function onPointerDown(ev: PointerEvent): void {
  if ((ev.target as Element | null)?.closest?.('.as-demo__toolbar, .as-demo__controls')) return
  if (ev.pointerType === 'mouse' && ev.button !== 0) return
  const box = measure()
  const point = stagePoint(ev, box)
  if (!point) return
  if (guide.value === 'radius') guide.value = 'width'
  aborted = true
  const mode = hitTest(point)
  if (!mode) return
  drag = {
    mode,
    pointerX: point.x,
    pointerY: point.y,
    box: box as DOMRect,
    start: { x: object.x, y: object.y, width: object.width, height: object.height },
    radius: radius.value,
  }
  draggingMode.value = mode
  try {
    stageEl.value?.setPointerCapture(ev.pointerId)
  } catch {
    // 合成事件或无效 pointerId 时捕获失败，不影响后续 pointermove
  }
  ev.preventDefault()
}

function onPointerMove(ev: PointerEvent): void {
  if (!drag) return
  const point = stagePoint(ev, drag.box)
  if (!point) return
  const dx = point.x - drag.pointerX
  const dy = point.y - drag.pointerY

  if (drag.mode === 'radius') {
    // 朝矩形中心（左下）拖增大、朝角（右上）拖减小：radius_delta = (dy - dx) / 2
    radius.value = clamp(drag.radius + (dy - dx) * 0.5, 0, maxRadius.value)
    return
  }

  if (drag.mode === 'move') {
    object.x = clamp(drag.start.x + dx, 0, stage.width - object.width)
    object.y = clamp(drag.start.y + dy, 0, stage.height - object.height)
    return
  }

  const start = drag.start
  const minSide = demo.minSide * ui.value
  let { x, y, width, height } = start
  if (drag.mode.includes('w')) {
    const left = Math.min(start.x + dx, start.x + start.width - minSide)
    x = left
    width = start.x + start.width - left
  }
  if (drag.mode.includes('n')) {
    const top = Math.min(start.y + dy, start.y + start.height - minSide)
    y = top
    height = start.y + start.height - top
  }
  if (drag.mode.includes('e')) width = Math.max(start.width + dx, minSide)
  if (drag.mode.includes('s')) height = Math.max(start.height + dy, minSide)
  object.x = x
  object.y = y
  object.width = width
  object.height = height
  // 缩小时圆角可能超过新的短边一半，跟着收回
  radius.value = Math.min(radius.value, maxRadius.value)
}

function endDrag(): void {
  drag = null
  draggingMode.value = null
}

/** 滚轮调线宽：悬停在矩形上才接管，到边界就交还页面滚动 */
function onWheel(ev: WheelEvent): void {
  if (ev.deltaY === 0) return
  const point = stagePoint(ev, measure())
  if (!point || !inObject(point)) return
  const step = demo.stroke.wheelStep * (ev.ctrlKey ? demo.stroke.ctrlStep : 1)
  const next = lineWidth.value + (ev.deltaY < 0 ? step : -step)
  if (next < demo.stroke.minWidth || next > demo.stroke.maxWidth) return
  ev.preventDefault()
  if (guide.value !== 'done') guide.value = 'done'
  lineWidth.value = next
}

/** 键盘也能改圆角：圆点可以 Tab 到，方向键增减 */
function onGripKey(ev: KeyboardEvent): void {
  const step = ev.shiftKey ? 5 : 1
  if (ev.key === 'ArrowUp' || ev.key === 'ArrowRight') {
    radius.value = Math.min(radius.value + step, maxRadius.value)
  } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowLeft') {
    radius.value = Math.max(radius.value - step, 0)
  } else {
    return
  }
  if (guide.value === 'radius') guide.value = 'width'
  aborted = true
  ev.preventDefault()
}

/** 工具栏内按数字键切工具：与软件一致，但不抢页面其他位置的按键 */
function onToolbarKey(ev: KeyboardEvent): void {
  const tool = tools.find((item) => item.key === ev.key)
  if (!tool) return
  activeTool.value = tool.icon
  ev.preventDefault()
}

/** 重置并重新演一遍：按钮叫「重播演示」，点了就该看得到东西发生 */
function resetDemo(): void {
  clearTimers()
  aborted = true
  played = false
  object.x = demo.initialRect.x
  object.y = demo.initialRect.y
  object.width = demo.initialRect.width
  object.height = demo.initialRect.height
  radius.value = 0
  lineWidth.value = demo.stroke.defaultWidth
  caption.value = ''
  playing.value = false
  guide.value = 'done'
  void autoplay()
}

/* ---------- 自动演示：进视口演一遍，只播一次 ---------- */

const { inView } = useInView(stageEl)
const reducedMotion = ref(false)
/** 正在自动演示：此时才给矩形加过渡，平时拖拽是即时的 */
const playing = ref(false)
let timers: number[] = []

function clearTimers(): void {
  timers.forEach((id) => window.clearTimeout(id))
  timers = []
}

async function autoplay(): Promise<void> {
  if (played) return
  played = true
  // 系统开了「减少动态效果」：不演，直接把提示放出来
  if (reducedMotion.value) {
    guide.value = 'radius'
    return
  }
  aborted = false

  // 先把「还没画」的状态落定，再加过渡。
  // 否则 620 → 0 与 0 → 620 两段过渡会叠在一起，看起来是先缩后放。
  object.width = 0
  object.height = 0
  radius.value = 0
  lineWidth.value = 2
  await nextTick()
  void stageEl.value?.offsetWidth

  playing.value = true
  caption.value = '① 拖出一个矩形'

  // 1) 画出来：1 秒，手拖的节奏
  timers.push(
    window.setTimeout(() => {
      if (aborted) return
      object.width = demo.initialRect.width
      object.height = demo.initialRect.height
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
      radius.value = Math.min(24, Math.min(object.width, object.height) / 2)
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
      lineWidth.value = 6
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

onMounted(() => {
  coarsePointer.value = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  reducedMotion.value =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const el = stageEl.value
  if (!el) return
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
  '--as-demo-dimmer': demo.dimmer,
}))

function iconStyle(icon: string): Record<string, string> {
  return { '--as-demo-mask': `url(/demo/icons/${icon}.svg)` }
}

/** 脉冲与提示跟着当前该学的那一步走 */
const guidePoint = computed(() =>
  guide.value === 'width'
    ? { x: object.x + object.width, y: object.y + object.height / 2 }
    : grip.value,
)

const guideStyle = computed(() => ({
  '--as-demo-x': `${(guidePoint.value.x / stage.width) * 100}%`,
  '--as-demo-y': `${(guidePoint.value.y / stage.height) * 100}%`,
}))

/** 卡片按 viewBox 百分比定位，与矩形共用同一坐标系，才不会错位 */
const cardStyle = computed(() => ({
  left: `${(demo.docCard.x / stage.width) * 100}%`,
  top: `${(demo.docCard.y / stage.height) * 100}%`,
  width: `${(demo.docCard.width / stage.width) * 100}%`,
  height: `${(demo.docCard.height / stage.height) * 100}%`,
}))

/** 自动演示期间由字幕接管，演完后才出脉冲 */
const showHint = computed(() => !playing.value && guide.value !== 'done')
</script>

<template>
  <div class="as-demo" :style="paletteStyle">    <div
      ref="stageEl"
      class="as-demo__stage"
      :class="{ 'is-dragging': draggingMode === 'move', 'is-playing': playing }"
      @wheel="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
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

      <svg
        ref="inkEl"
        class="as-demo__ink"
        :viewBox="`0 0 ${stage.width} ${stage.height}`"
        role="group"
        aria-label="标注演示区"
      >
        <rect
          class="as-demo__hit"
          :x="object.x"
          :y="object.y"
          :width="object.width"
          :height="object.height"
          fill="transparent"
        />
        <rect
          class="as-demo__object"
          :x="object.x"
          :y="object.y"
          :width="object.width"
          :height="object.height"
          :rx="radius"
          :ry="radius"
          :stroke-width="lineWidth"
          :stroke="demo.stroke.color"
          fill="none"
        />

        <g
          v-if="activeTool === 'rect' && !playing"
          class="as-demo__frame"
          :stroke="demo.frame.accent"
          :stroke-width="demo.frame.lineWidth"
          fill="none"
        >
          <rect :x="object.x" :y="object.y" :width="object.width" :height="object.height" />
          <rect
            v-for="handle in handles"
            :key="handle.id"
            class="as-demo__handle"
            :x="handle.x - handleSize / 2"
            :y="handle.y - handleSize / 2"
            :width="handleSize"
            :height="handleSize"
            fill="#fff"
            :style="{ cursor: handleCursors[handle.id] }"
          />
        </g>

        <circle
          v-if="activeTool === 'rect' && !playing"
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
          :aria-valuenow="radiusValue"
          aria-valuemin="0"
          :aria-valuemax="maxRadius"
          @keydown="onGripKey"
        />

        <circle
          v-if="showHint"
          class="as-demo__pulse"
          :cx="guidePoint.x"
          :cy="guidePoint.y"
          :r="roundSize * 1.8"
          :stroke="demo.frame.accent"
          stroke-width="1.5"
          fill="none"
          aria-hidden="true"
        />
      </svg>

      <p v-if="caption" class="as-demo__caption" aria-hidden="true">{{ caption }}</p>

      <p
        v-if="showHint"
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
        <button type="button" class="as-demo__reset" @click="resetDemo">重播演示</button>
      </div>

      <div class="as-demo__toolbar" role="toolbar" aria-label="标注工具栏（演示）" @keydown="onToolbarKey">
        <button
          type="button"
          class="as-demo__btn"
          :class="{ 'is-active': activeTool === 'move' }"
          :title="`${demo.actions.move.name} ${demo.actions.move.hint}`"
          @click="activeTool = 'move'"
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
          @click="activeTool = tool.icon"
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

          <button type="button" class="as-demo__btn" :title="demo.actions.fill.name">
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
      <template v-if="activeTool === 'rect'">
        拖右上角那个小圆点改圆角，拖八个白方块缩放，拖矩形本身移动，在矩形上滚滚轮调线宽（按住 Ctrl 三倍步进）。
        右上角还能切软件的浅色 / 深色主题（软件里另有「跟随系统」）。
        <span class="as-demo__state">圆角 {{ radiusValue }}px · 线宽 {{ lineWidth }}px</span>
      </template>
      <template v-else> 这个工具还在做，先点回工具栏里的矩形试试。 </template>
    </p>
  </div>
</template>
