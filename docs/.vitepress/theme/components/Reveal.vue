<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useInView } from '../../composables/useInView'
import { useReducedMotion } from '../../composables/useReducedMotion'

const props = withDefaults(
  defineProps<{
    /** 错峰延迟（ms），同一区块内按序号递增 */
    delay?: number
    /** 渲染标签，默认 div */
    as?: string
  }>(),
  { delay: 0, as: 'div' },
)

const el = ref<HTMLElement | null>(null)
/** 待入场：仅当挂载时元素位于视口下方才置为 true */
const armed = ref(false)
const { reduced } = useReducedMotion()
const { inView } = useInView(el, { once: true, rootMargin: '0px 0px -10% 0px' })

onMounted(() => {
  const node = el.value
  if (!node) return
  if (reduced.value || typeof IntersectionObserver === 'undefined') return
  if (node.getBoundingClientRect().top > window.innerHeight) armed.value = true
})

watch(inView, (value) => {
  if (value) armed.value = false
})

const state = computed(() => (armed.value ? 'armed' : 'shown'))
const style = computed(() => ({ transitionDelay: `${props.delay}ms` }))
</script>

<template>
  <component :is="as" ref="el" :data-state="state" :style="style">
    <slot />
  </component>
</template>
