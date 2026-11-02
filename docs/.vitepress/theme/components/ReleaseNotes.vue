<script setup lang="ts">
import { RELEASE_URL, VERSION, releaseUpdate, type ReleaseChange } from '../../data/site'
import Reveal from './Reveal.vue'

/** 卡片图标：组件只管排版，图标在这里映射成内联 svg */
const icons: Record<ReleaseChange['icon'], string> = {
  update:
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  keyboard:
    '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/>',
  longshot:
    '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h6"/><path d="M9 19h3"/>',
  mirror:
    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  toggle:
    '<rect width="20" height="12" x="2" y="6" rx="6"/><circle cx="8" cy="12" r="2"/>',
  size: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
}
</script>

<template>
  <section class="as-section as-section--wide" aria-labelledby="as-release-title">
    <Reveal as="header" class="as-release__head">
      <span class="as-release__badge">
        <span class="as-release__dot" aria-hidden="true" />
        最新 <strong>{{ VERSION }}</strong>
      </span>
      <h2 id="as-release-title" class="as-section__title">{{ releaseUpdate.title }}</h2>
      <p class="as-release__lead">{{ releaseUpdate.lead }}</p>
    </Reveal>

    <div class="as-release__grid">
      <Reveal
        v-for="(item, index) in releaseUpdate.changes"
        :key="item.title"
        as="article"
        :delay="index * 60"
        class="as-card as-release__item"
      >
        <span class="as-release__icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            v-html="icons[item.icon]"
          />
        </span>
        <h3 class="as-release__item-title">{{ item.title }}</h3>
        <p class="as-release__item-text">{{ item.body }}</p>
      </Reveal>
    </div>

    <Reveal as="p" class="as-footnote as-release__more" :delay="160">
      <a :href="RELEASE_URL" target="_blank" rel="noopener">完整更新日志</a>
      （含 SHA256 校验值）
    </Reveal>
  </section>
</template>
