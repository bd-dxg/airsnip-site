<script setup lang="ts">
/**
 * 首页演示台：按真实覆盖层 1:1 重绘的工具栏 + 一个可操作的矩形。
 * 阶段 1 只做矩形（拖右上角圆点改圆角、在矩形上滚滚轮调线宽），其余工具随后补。
 * 所有数字与配色都来自 data/site.ts 的 `demo`，不在这里另写一份。
 */
import { computed, reactive, ref } from 'vue'
import { demo, tools } from '../../data/site'

const stage = demo.stage

const rect = reactive({ ...demo.initialRect })
const radius = ref(0)
const lineWidth = ref(demo.stroke.defaultWidth)
/** 当前选中的工具，存图标名（'move' / 'rect' / ...） */
const activeTool = ref('rect')
const dragging = ref(false)

/** 圆角上限是短边一半，不是固定值（render/mask.rs 的 clamp_radius） */
const maxRadius = computed(() => Math.min(rect.width, rect.height) / 2)

const radiusValue = computed(() => Math.round(radius.value))

/** 圆角控制柄贴弧走：内缩 14 + 0.293 × r，最多到短边的 45% */
const gripInset = computed(() =>
  Math.min(
    demo.radiusGrip.baseInset + demo.radiusGrip.arcToCorner * radius.value,
    rect.width * 0.45,
    rect.height * 0.45,
  ),
)

const grip = computed(() => ({
  x: rect.x + rect.width - gripInset.value,
  y: rect.y + gripInset.value,
}))

/** 八向缩放手柄：四角 + 四边中点 */
const handles = computed(() => {
  const { x, y, width, height } = rect
  const midX = x + width / 2
  const midY = y + height / 2
  return [
    { x, y },
    { x: midX, y },
    { x: x + width, y },
    { x, y: midY },
    { x: x + width, y: midY },
    { x, y: y + height },
    { x: midX, y: y + height },
    { x: x + width, y: y + height },
  ]
})

interface RadiusDrag {
  pointerX: number
  pointerY: number
  radius: number
}

let dragStart: RadiusDrag | null = null

const inkEl = ref<SVGSVGElement | null>(null)
/** 拖拽期间缓存舞台矩形：避免每帧 getBoundingClientRect 触发重排 */
let cachedBox: DOMRect | null = null

function measure(): DOMRect | null {
  const el = inkEl.value
  return el ? el.getBoundingClientRect() : null
}

/** 屏幕坐标 → 舞台坐标（viewBox 与舞台同比例，缩放只是线性换算） */
function stagePoint(ev: MouseEvent, box = measure()): { x: number; y: number } | null {
  if (!box || box.width === 0 || box.height === 0) return null
  return {
    x: ((ev.clientX - box.left) / box.width) * stage.width,
    y: ((ev.clientY - box.top) / box.height) * stage.height,
  }
}

function startRadiusDrag(ev: PointerEvent): void {
  const box = measure()
  const point = stagePoint(ev, box)
  if (!point) return
  cachedBox = box
  dragStart = { pointerX: point.x, pointerY: point.y, radius: radius.value }
  dragging.value = true
  if (ev.currentTarget instanceof Element) ev.currentTarget.setPointerCapture(ev.pointerId)
}

function onGripMove(ev: PointerEvent): void {
  if (!dragStart) return
  const point = stagePoint(ev, cachedBox ?? measure())
  if (!point) return
  // 朝矩形中心（左下）拖增大、朝角（右上）拖减小：radius_delta = (dy - dx) / 2
  const delta = (point.y - dragStart.pointerY - (point.x - dragStart.pointerX)) * 0.5
  radius.value = Math.min(Math.max(dragStart.radius + delta, 0), maxRadius.value)
}

function endRadiusDrag(): void {
  dragStart = null
  cachedBox = null
  dragging.value = false
}

/** 滚轮调线宽：悬停在矩形上才接管，到边界就交还页面滚动 */
function onWheel(ev: WheelEvent): void {
  if (ev.deltaY === 0) return
  const point = stagePoint(ev)
  if (!point) return
  const slop = demo.stroke.hitSlop
  const inside =
    point.x >= rect.x - slop &&
    point.x <= rect.x + rect.width + slop &&
    point.y >= rect.y - slop &&
    point.y <= rect.y + rect.height + slop
  if (!inside) return
  const step = demo.stroke.wheelStep * (ev.ctrlKey ? demo.stroke.ctrlStep : 1)
  const next = lineWidth.value + (ev.deltaY < 0 ? step : -step)
  if (next < demo.stroke.minWidth || next > demo.stroke.maxWidth) return
  ev.preventDefault()
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
  ev.preventDefault()
}

/** 工具栏内按数字键切工具：与软件一致，但不抢页面其他位置的按键 */
function onToolbarKey(ev: KeyboardEvent): void {
  const tool = tools.find((item) => item.key === ev.key)
  if (!tool) return
  activeTool.value = tool.icon
  ev.preventDefault()
}

/** 调色板与图标都通过 CSS 变量注入，数值仍只在 site.ts 里 */
const paletteStyle = computed(() => ({
  '--as-demo-bg': demo.palette.bg,
  '--as-demo-border': demo.palette.border,
  '--as-demo-icon': demo.palette.icon,
  '--as-demo-icon-dim': demo.palette.iconDim,
  '--as-demo-divider': demo.palette.divider,
  '--as-demo-accent': demo.palette.accent,
  '--as-demo-accent-soft': demo.palette.accentSoft,
  '--as-demo-swatch-border': demo.palette.swatchBorder,
  '--as-demo-row-hover': demo.palette.rowHover,
}))

function iconStyle(icon: string): Record<string, string> {
  return { '--as-demo-mask': `url(/demo/icons/${icon}.svg)` }
}
</script>

<template>
  <div class="as-demo" :style="paletteStyle">
    <div class="as-demo__stage" @wheel="onWheel">
      <div class="as-demo__doc" aria-hidden="true">
        <p class="as-demo__doc-title">deploy.log <span>site · main</span></p>
        <ul class="as-demo__log">
          <li><span class="as-demo__ok">✓</span> install <em>3.1s</em></li>
          <li><span class="as-demo__ok">✓</span> build <em>12.4s</em></li>
          <li><span class="as-demo__ok">✓</span> upload <em>4.7s</em></li>
          <li><span class="as-demo__fail">✕</span> health check <em>503</em></li>
        </ul>
      </div>

      <svg
        ref="inkEl"
        class="as-demo__ink"
        :viewBox="`0 0 ${stage.width} ${stage.height}`"
        role="group"
        aria-label="标注演示区"
      >
        <rect
          :x="rect.x"
          :y="rect.y"
          :width="rect.width"
          :height="rect.height"
          :rx="radius"
          :ry="radius"
          :stroke-width="lineWidth"
          :stroke="demo.stroke.color"
          fill="none"
        />

        <g
          v-if="activeTool === 'rect'"
          class="as-demo__frame"
          :stroke="demo.frame.accent"
          :stroke-width="demo.frame.lineWidth"
          fill="none"
        >
          <rect :x="rect.x" :y="rect.y" :width="rect.width" :height="rect.height" />
          <rect
            v-for="(handle, index) in handles"
            :key="`handle-${index}`"
            :x="handle.x - demo.frame.handle / 2"
            :y="handle.y - demo.frame.handle / 2"
            :width="demo.frame.handle"
            :height="demo.frame.handle"
            fill="#fff"
          />
        </g>

        <circle
          v-if="activeTool === 'rect'"
          class="as-demo__grip"
          :class="{ 'is-dragging': dragging }"
          :cx="grip.x"
          :cy="grip.y"
          :r="demo.frame.round"
          fill="#fff"
          :stroke="demo.frame.accent"
          stroke-width="1.5"
          tabindex="0"
          role="slider"
          aria-label="圆角半径"
          :aria-valuenow="radiusValue"
          aria-valuemin="0"
          :aria-valuemax="maxRadius"
          @pointerdown="startRadiusDrag"
          @pointermove="onGripMove"
          @pointerup="endRadiusDrag"
          @pointercancel="endRadiusDrag"
          @lostpointercapture="endRadiusDrag"
          @keydown="onGripKey"
        />
      </svg>

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
          <button
            type="button"
            class="as-demo__btn as-demo__btn--wide"
            :title="demo.actions.line.name"
          >
            <svg class="as-demo__linestyle" viewBox="0 0 46 20" aria-hidden="true">
              <line
                x1="8"
                y1="10"
                x2="38"
                y2="10"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            class="as-demo__btn"
            :title="`${demo.actions.undo.name} ${demo.actions.undo.hint}`"
          >
            <span class="as-demo__icon" :style="iconStyle(demo.actions.undo.icon)" />
          </button>
          <button
            type="button"
            class="as-demo__btn"
            :title="`${demo.actions.redo.name} ${demo.actions.redo.hint}`"
          >
            <span class="as-demo__icon" :style="iconStyle(demo.actions.redo.icon)" />
          </button>

          <span class="as-demo__sep" aria-hidden="true" />

          <button
            type="button"
            class="as-demo__btn"
            :title="`${demo.actions.pin.name} ${demo.actions.pin.hint}`"
          >
            <span class="as-demo__icon" :style="iconStyle(demo.actions.pin.icon)" />
          </button>
          <button
            type="button"
            class="as-demo__btn"
            :title="`${demo.actions.longshot.name} ${demo.actions.longshot.hint}`"
          >
            <span class="as-demo__icon" :style="iconStyle(demo.actions.longshot.icon)" />
          </button>

          <span class="as-demo__sep" aria-hidden="true" />

          <button
            type="button"
            class="as-demo__btn"
            :title="`${demo.actions.copy.name} ${demo.actions.copy.hint}`"
          >
            <span class="as-demo__icon" :style="iconStyle(demo.actions.copy.icon)" />
          </button>
          <button
            type="button"
            class="as-demo__btn"
            :title="`${demo.actions.quickSave.name} ${demo.actions.quickSave.hint}`"
          >
            <span class="as-demo__icon" :style="iconStyle(demo.actions.quickSave.icon)" />
          </button>
          <button
            type="button"
            class="as-demo__btn"
            :title="`${demo.actions.save.name} ${demo.actions.save.hint}`"
          >
            <span class="as-demo__icon" :style="iconStyle(demo.actions.save.icon)" />
          </button>
        </div>
      </div>
    </div>

    <p class="as-demo__hint">
      <template v-if="activeTool === 'rect'">
        拖右上角那个小圆点改圆角，把指针放在矩形上滚滚轮调线宽（按住 Ctrl 三倍步进）。
        <span class="as-demo__state">圆角 {{ radiusValue }}px · 线宽 {{ lineWidth }}px</span>
      </template>
      <template v-else>
        这个工具还在做，先点回工具栏里的矩形试试：拖圆点改圆角，滚轮调线宽。
      </template>
    </p>
  </div>
</template>
