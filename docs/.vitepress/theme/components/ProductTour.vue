<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance } from 'vue'
import { screenshots } from '../../data/site'
import Reveal from './Reveal.vue'

const activeIndex = ref(0)
const active = computed(() => screenshots[activeIndex.value])

const tabRefs = ref<Array<HTMLButtonElement | null>>([])

function setTabRef(el: Element | ComponentPublicInstance | null, index: number): void {
  tabRefs.value[index] = el instanceof HTMLButtonElement ? el : null
}

function select(index: number): void {
  activeIndex.value = index
}

function onKeydown(event: KeyboardEvent, index: number): void {
  const last = screenshots.length - 1
  let next = index
  if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
  else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = last
  else return
  event.preventDefault()
  activeIndex.value = next
  tabRefs.value[next]?.focus()
}
</script>

<template>
  <section class="as-section" aria-labelledby="as-tour-title">
    <Reveal as="h2" id="as-tour-title" class="as-section__title">产品界面</Reveal>
    <Reveal as="p" class="as-section__lead" :delay="60">
      软件设置是自绘面板，跟随系统深浅色；下面是六个设置页的实际样子。
    </Reveal>

    <div class="as-tour">
      <div class="as-tour__tabs" role="tablist" aria-label="产品界面截图">
        <button
          v-for="(shot, index) in screenshots"
          :id="`as-tab-${shot.id}`"
          :key="shot.id"
          :ref="(el) => setTabRef(el, index)"
          type="button"
          role="tab"
          class="as-tour__tab"
          :aria-selected="index === activeIndex"
          :aria-controls="`as-panel-${shot.id}`"
          :tabindex="index === activeIndex ? 0 : -1"
          @click="select(index)"
          @keydown="onKeydown($event, index)"
        >
          {{ shot.title }}
        </button>
      </div>

      <div
        class="as-tour__stage as-window"
        :style="{ aspectRatio: `${active.width} / ${active.height}` }"
      >
        <Transition name="as-fade-shift" mode="out-in">
          <div
            :id="`as-panel-${active.id}`"
            :key="active.id"
            class="as-tour__panel"
            role="tabpanel"
            :aria-labelledby="`as-tab-${active.id}`"
            tabindex="0"
          >
            <img
              :src="active.src"
              :alt="active.alt"
              :width="active.width"
              :height="active.height"
              :loading="activeIndex === 0 ? 'eager' : 'lazy'"
              decoding="async"
            />
          </div>
        </Transition>
      </div>

      <p class="as-tour__caption">{{ active.caption }}</p>
    </div>
  </section>
</template>
