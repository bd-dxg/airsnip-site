<script setup lang="ts">
import { capabilities } from '../../data/site'
import Reveal from './Reveal.vue'
</script>

<template>
  <section class="as-section" aria-labelledby="as-caps-title">
    <Reveal as="h2" id="as-caps-title" class="as-section__title">标注分三组</Reveal>
    <Reveal as="p" class="as-section__lead" :delay="60">
      十个标注工具按用途分三组；上面的演示台都能试，正式截图时按数字键直接切。
    </Reveal>
    <ol class="as-caps">
      <Reveal
        v-for="(cap, index) in capabilities"
        :key="cap.title"
        as="li"
        :delay="index * 70"
        class="as-cap"
      >
        <p class="as-cap__index" aria-hidden="true">{{ cap.index }}</p>
        <h3 class="as-cap__title">{{ cap.title }}</h3>
        <p class="as-cap__text">{{ cap.text }}</p>
        <a class="as-cap__link" href="#as-demo">在演示台按 {{ cap.keys }} 试试 →</a>
      </Reveal>
    </ol>
  </section>
</template>
