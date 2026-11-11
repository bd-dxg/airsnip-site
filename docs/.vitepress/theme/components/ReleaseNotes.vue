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
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  ocr: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8h8"/><path d="M7 12h10"/><path d="M7 16h6"/>',
  mouse: '<rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/>',
  tooltip: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  hdr: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  number:
    '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
  palette:
    '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  clipboard:
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  shapes:
    '<path d="M3 20 9 8"/><circle cx="9" cy="8" r=".6" fill="currentColor"/><ellipse cx="16.5" cy="16" rx="4.5" ry="4"/>',
  layout:
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
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

    <div class="as-release__grid" :data-count="releaseUpdate.changes.length">
      <Reveal
        v-for="(item, index) in releaseUpdate.changes"
        :key="item.title"
        as="article"
        :delay="index * 60"
        class="as-card as-release__item"
      >
        <span class="as-release__item-head">
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
        </span>
        <p class="as-release__item-text">{{ item.body }}</p>
      </Reveal>
    </div>

    <Reveal as="p" class="as-footnote as-release__more" :delay="160">
      <a :href="RELEASE_URL" target="_blank" rel="noopener">完整更新日志</a>
      （含 SHA256 校验值）
    </Reveal>
  </section>
</template>
