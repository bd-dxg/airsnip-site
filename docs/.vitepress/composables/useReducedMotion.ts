import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * 读取系统「减少动态效果」偏好，并跟随其变化。
 * SSR 阶段返回 false，客户端挂载后立即同步为真实值。
 */
export function useReducedMotion(): { reduced: Ref<boolean> } {
  const reduced = ref(false)
  let mql: MediaQueryList | null = null

  const update = (event: MediaQueryList | MediaQueryListEvent): void => {
    reduced.value = event.matches
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    mql = window.matchMedia(QUERY)
    update(mql)
    mql.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    mql?.removeEventListener('change', update)
    mql = null
  })

  return { reduced }
}
