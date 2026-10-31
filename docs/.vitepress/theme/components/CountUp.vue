<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useInView } from '../../composables/useInView'
import { useReducedMotion } from '../../composables/useReducedMotion'

const props = withDefaults(
  defineProps<{
    /** 终值字符串，保留原始小数位，如 '1.08' */
    value: string
    duration?: number
  }>(),
  { duration: 900 },
)

const el = ref<HTMLElement | null>(null)
/** SSR 与无动画场景直接渲染终值 */
const display = ref(props.value)
const played = ref(false)
const { reduced } = useReducedMotion()
const { inView } = useInView(el, { once: true })

let frame = 0

const decimals = computed(() => {
  const dot = props.value.indexOf('.')
  return dot === -1 ? 0 : props.value.length - dot - 1
})

const target = computed(() => Number(props.value))

function format(value: number): string {
  return value.toFixed(decimals.value)
}

function play(): void {
  if (played.value) return
  played.value = true
  if (
    reduced.value ||
    !Number.isFinite(target.value) ||
    typeof requestAnimationFrame !== 'function'
  ) {
    display.value = props.value
    return
  }
  const startedAt = performance.now()
  const tick = (now: number): void => {
    const progress = Math.min(1, (now - startedAt) / props.duration)
    if (progress >= 1) {
      // 动画结束必须精确等于原文
      display.value = props.value
      return
    }
    const eased = 1 - Math.pow(1 - progress, 3)
    display.value = format(target.value * eased)
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  const node = el.value
  if (!node) return
  if (reduced.value || typeof IntersectionObserver === 'undefined') return
  // 只有位于视口下方时才从 0 起滚，首屏元素保持终值
  if (node.getBoundingClientRect().top > window.innerHeight) display.value = format(0)
})

watch(inView, (value) => {
  if (value) play()
})

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <span ref="el" class="as-count-up" :aria-label="value">
    <span aria-hidden="true">{{ display }}</span>
  </span>
</template>
