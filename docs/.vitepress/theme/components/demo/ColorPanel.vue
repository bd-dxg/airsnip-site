<script setup lang="ts">
/**
 * 取色面板：双击工具栏纯色块弹出（软件里是 src/overlay/toolbar/colorpanel/）。
 * 只负责颜色交互，定位与「改哪个色块」由父组件给。
 * 尺寸基准照源码：宽 208、内边距 8、间距 8、色相条 14、SV 方块 104、快捷色 24 / 间距 8。
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { hsvToHex, rgbToHsv } from './paint'

const props = defineProps<{
  /** 打开时色块的颜色，用来初始化 HSV */
  color: string
  /** 12 个快捷色（palette.rs 的 QUICK） */
  quick: readonly string[]
  /** 父组件算好的定位与缩放（left / top / width / padding / gap / --panel-s） */
  panelStyle: Record<string, string>
}>()

const emit = defineEmits<{ change: [hex: string] }>()

const initial = rgbToHsv(props.color)
const hue = ref(initial.h)
const sat = ref(initial.s)
const val = ref(initial.v)
const dragging = ref<'hue' | 'sv' | null>(null)

const hueEl = ref<HTMLElement | null>(null)
const svEl = ref<HTMLElement | null>(null)

const current = computed(() => hsvToHex(hue.value, sat.value, val.value))

/** SV 方块：白→纯色相横向、透明→黑纵向叠在一起 */
const svStyle = computed(() => ({
  backgroundColor: hsvToHex(hue.value, 1, 1),
  backgroundImage:
    'linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))',
}))

const svMarkerStyle = computed(() => ({
  left: `${sat.value * 100}%`,
  top: `${(1 - val.value) * 100}%`,
}))

const hueMarkerStyle = computed(() => ({ left: `${(hue.value / 360) * 100}%` }))

function apply(): void {
  emit('change', hsvToHex(hue.value, sat.value, val.value))
}

function updateFromPointer(ev: PointerEvent): void {
  const el = dragging.value === 'hue' ? hueEl.value : svEl.value
  if (!el) return
  const box = el.getBoundingClientRect()
  const x = Math.min(Math.max((ev.clientX - box.left) / box.width, 0), 1)
  const y = Math.min(Math.max((ev.clientY - box.top) / box.height, 0), 1)
  if (dragging.value === 'hue') hue.value = x * 360
  else {
    sat.value = x
    val.value = 1 - y
  }
  apply()
}

function onMove(ev: PointerEvent): void {
  updateFromPointer(ev)
}

function endDrag(): void {
  dragging.value = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', endDrag)
}

function startDrag(mode: 'hue' | 'sv', ev: PointerEvent): void {
  dragging.value = mode
  updateFromPointer(ev)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', endDrag)
  ev.preventDefault()
  ev.stopPropagation()
}

function pickQuick(hex: string): void {
  const next = rgbToHsv(hex)
  hue.value = next.h
  sat.value = next.s
  val.value = next.v
  apply()
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', endDrag)
})
</script>

<template>
  <div class="as-demo__color-panel" :style="props.panelStyle" @pointerdown.stop>
    <div
      ref="hueEl"
      class="as-demo__cp-hue"
      role="slider"
      aria-label="色相"
      :aria-valuenow="Math.round(hue)"
      aria-valuemin="0"
      aria-valuemax="360"
      @pointerdown="startDrag('hue', $event)"
    >
      <span class="as-demo__cp-mark" :style="hueMarkerStyle" />
    </div>
    <div
      ref="svEl"
      class="as-demo__cp-sv"
      :style="svStyle"
      role="slider"
      aria-label="饱和度与明度"
      @pointerdown="startDrag('sv', $event)"
    >
      <span class="as-demo__cp-dot" :style="svMarkerStyle" />
    </div>
    <div class="as-demo__cp-quick">
      <button
        v-for="hex in props.quick"
        :key="hex"
        type="button"
        class="as-demo__cp-swatch"
        :style="{ '--as-demo-swatch': hex }"
        :aria-label="`快捷色 ${hex}`"
        :title="hex"
        @click="pickQuick(hex)"
      />
    </div>
    <p class="as-demo__cp-preview" aria-live="polite">
      <span class="as-demo__cp-chip" :style="{ '--as-demo-swatch': current }" aria-hidden="true" />
      {{ current.toUpperCase() }}
    </p>
  </div>
</template>
