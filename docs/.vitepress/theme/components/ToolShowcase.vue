<script setup lang="ts">
import { tools } from '../../data/site'
import Reveal from './Reveal.vue'

const props = withDefaults(
  defineProps<{
    /** 首页带标题；文档页内嵌时关掉，避免与页面小标题重复 */
    showHeading?: boolean
  }>(),
  { showHeading: true },
)
</script>

<template>
  <section
    :class="props.showHeading ? 'as-section' : 'as-tools-block'"
    :aria-labelledby="props.showHeading ? 'as-tools-title' : undefined"
  >
    <Reveal v-if="props.showHeading" as="h2" id="as-tools-title" class="as-section__title">
      十个标注工具
    </Reveal>
    <Reveal v-if="props.showHeading" as="p" class="as-section__lead" :delay="60">
      覆盖层里按数字键 1–9、0 即切换，按键可改；选中对象后可继续移动、缩放、改色。
    </Reveal>
    <div class="as-tools">
      <Reveal
        v-for="(tool, index) in tools"
        :key="tool.key"
        :delay="index * 60"
        class="as-card as-tool"
      >
        <div class="as-tool__head">
          <kbd class="as-tool__key">{{ tool.key }}</kbd>
          <h3 class="as-tool__name">{{ tool.name }}</h3>
        </div>
        <p class="as-tool__desc">{{ tool.description }}</p>
      </Reveal>
    </div>
    <Reveal as="p" class="as-footnote" :delay="80">
      曲线箭头选中后 1/3、2/3 处出现控制柄，可拖出 S 形，双击恢复直线；矩形、荧光笔、模糊、聚光灯都支持圆角。
    </Reveal>
  </section>
</template>
