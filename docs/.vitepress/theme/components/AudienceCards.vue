<script setup lang="ts">
import { audiences } from '../../data/site'
import Reveal from './Reveal.vue'
</script>

<template>
  <section class="as-section" aria-labelledby="as-audience-title">
    <Reveal as="h2" id="as-audience-title" class="as-section__title">适合谁</Reveal>
    <div class="as-audiences">
      <Reveal
        v-for="(item, index) in audiences"
        :key="item.title"
        :delay="index * 70"
        class="as-card as-audience"
      >
        <h3 class="as-audience__title">{{ item.title }}</h3>
        <p class="as-audience__desc">{{ item.description }}</p>
      </Reveal>
    </div>
  </section>
</template>
