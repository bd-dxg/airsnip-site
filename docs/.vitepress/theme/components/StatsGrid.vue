<script setup lang="ts">
import { stats, statsFootnote } from '../../data/site'
import CountUp from './CountUp.vue'
import Reveal from './Reveal.vue'
</script>

<template>
  <section class="as-section" aria-labelledby="as-stats-title">
    <Reveal as="h2" id="as-stats-title" class="as-section__title">实测数字</Reveal>
    <Reveal as="p" class="as-section__lead" :delay="60">
      以下为作者在目标机型（2560×1440、无独显）上的实测值，不同环境会有差异。
    </Reveal>
    <div class="as-stats">
      <Reveal
        v-for="(stat, index) in stats"
        :key="stat.label"
        :delay="index * 70"
        class="as-card as-stat"
      >
        <p class="as-stat__value">
          <CountUp :value="stat.value" />
          <span class="as-stat__unit">{{ stat.unit }}</span>
        </p>
        <p class="as-stat__label">{{ stat.label }}</p>
        <p class="as-stat__note">{{ stat.note }}</p>
      </Reveal>
    </div>
    <Reveal as="p" class="as-footnote" :delay="80">
      {{ statsFootnote }}
      <a href="/about/performance">查看实测方法</a>
    </Reveal>
  </section>
</template>
