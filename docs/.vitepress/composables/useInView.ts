import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface UseInViewOptions {
  /** 进入视口后是否断开观察，默认 true */
  once?: boolean
  rootMargin?: string
  threshold?: number | number[]
}

/**
 * IntersectionObserver 封装。
 * 不支持 IntersectionObserver 时直接视为已进入视口，保证内容可见。
 */
export function useInView(
  target: Ref<HTMLElement | null>,
  options: UseInViewOptions = {},
): { inView: Ref<boolean> } {
  const { once = true, rootMargin = '0px 0px -10% 0px', threshold = 0 } = options
  const inView = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const el = target.value
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      inView.value = true
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            inView.value = true
            if (once) {
              observer?.disconnect()
              observer = null
            }
          } else if (!once) {
            inView.value = false
          }
        }
      },
      { rootMargin, threshold },
    )
    observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { inView }
}
