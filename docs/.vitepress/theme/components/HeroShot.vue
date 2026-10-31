<script setup lang="ts">
import { heroShot } from '../../data/site'
</script>

<template>
  <div class="as-hero-shot">
    <figure class="as-shot as-hero-shot__figure">
      <div class="as-window">
        <img
          :src="heroShot.src"
          :alt="heroShot.alt"
          :width="heroShot.width"
          :height="heroShot.height"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
      </div>
      <figcaption>{{ heroShot.caption }}</figcaption>
    </figure>
  </div>
</template>
