<script setup lang="ts">
/**
 * 演示台工具栏：按软件 src/overlay/toolbar/mod.rs 的几何与分组 1:1 重绘。
 * 图标从软件仓库 assets/icons/ui/toolbar 原样复制，用 CSS mask 上色（不重画）。
 * 纯展示 + 事件上抛，所有状态由 DemoStage 持有。
 */
import { demo, tools } from '../../../data/site'

const props = defineProps<{
  /** 当前工具（存图标名） */
  activeTool: string
  /** 矩形 / 椭圆的填充开关 */
  filled: boolean
  /** 当前画笔：纯色 hex 或渐变套号 + 代表色 */
  paint: { color: string; gradient: number | null }
  /** 两个纯色块的当前颜色（双击可改） */
  solidColors: string[]
  /** 当前渐变套号 */
  gradientSet: number
  /** 渐变色块是否可点（文本 / 荧光笔 / 模糊 / 聚光不支持） */
  gradientAvailable: boolean
}>()

const emit = defineEmits<{
  setTool: [icon: string]
  toggleFill: []
  selectSolid: [color: string]
  selectGradient: []
  cycleGradient: []
  openPanel: [index: number]
}>()

function iconStyle(icon: string): Record<string, string> {
  return { '--as-demo-mask': `url(/demo/icons/${icon}.svg)` }
}
</script>

<template>
  <div class="as-demo__toolbar" role="toolbar" aria-label="标注工具栏（演示）">
    <button
      type="button"
      class="as-demo__btn"
      :class="{ 'is-active': props.activeTool === 'move' }"
      :title="`${demo.actions.move.name} ${demo.actions.move.hint}`"
      @click="emit('setTool', 'move')"
    >
      <span class="as-demo__icon" :style="iconStyle(demo.actions.move.icon)" />
    </button>

    <span class="as-demo__sep" aria-hidden="true" />

    <button
      v-for="tool in tools"
      :key="tool.key"
      type="button"
      class="as-demo__btn"
      :class="{ 'is-active': props.activeTool === tool.icon }"
      :title="`${tool.name} ${tool.key}`"
      @click="emit('setTool', tool.icon)"
    >
      <span class="as-demo__icon" :style="iconStyle(tool.icon)" />
    </button>

    <span class="as-demo__sep" aria-hidden="true" />

    <div class="as-demo__extra">
      <button
        v-for="(color, index) in props.solidColors"
        :key="index"
        type="button"
        class="as-demo__swatch"
        :class="{ 'is-active': props.paint.gradient === null && props.paint.color === color }"
        :style="{ '--as-demo-swatch': color }"
        :aria-label="`色块 ${index + 1}（双击换色）`"
        :aria-pressed="props.paint.gradient === null && props.paint.color === color"
        :title="`色块 ${index + 1}（双击换色）`"
        @click="emit('selectSolid', color)"
        @dblclick="emit('openPanel', index)"
      />
      <button
        type="button"
        class="as-demo__swatch as-demo__swatch--gradient"
        :class="{ 'is-active': props.paint.gradient !== null }"
        :style="{
          backgroundImage: `linear-gradient(135deg, ${demo.swatches.gradientSets[props.gradientSet].join(', ')})`,
        }"
        aria-label="渐变色块"
        :aria-pressed="props.paint.gradient !== null"
        :disabled="!props.gradientAvailable"
        title="渐变色块（双击换一套）"
        @click="emit('selectGradient')"
        @dblclick="emit('cycleGradient')"
      />

      <span class="as-demo__sep" aria-hidden="true" />

      <button
        type="button"
        class="as-demo__btn"
        :class="{ 'is-active': props.filled }"
        :title="demo.actions.fill.name"
        :aria-pressed="props.filled"
        @click="emit('toggleFill')"
      >
        <span class="as-demo__icon" :style="iconStyle(demo.actions.fill.icon)" />
      </button>
      <button type="button" class="as-demo__btn as-demo__btn--wide" :title="demo.actions.line.name">
        <svg class="as-demo__linestyle" viewBox="0 0 46 20" aria-hidden="true">
          <line x1="8" y1="10" x2="38" y2="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
      </button>
      <button type="button" class="as-demo__btn" :title="`${demo.actions.undo.name} ${demo.actions.undo.hint}`">
        <span class="as-demo__icon" :style="iconStyle(demo.actions.undo.icon)" />
      </button>
      <button type="button" class="as-demo__btn" :title="`${demo.actions.redo.name} ${demo.actions.redo.hint}`">
        <span class="as-demo__icon" :style="iconStyle(demo.actions.redo.icon)" />
      </button>

      <span class="as-demo__sep" aria-hidden="true" />

      <button type="button" class="as-demo__btn" :title="`${demo.actions.pin.name} ${demo.actions.pin.hint}`">
        <span class="as-demo__icon" :style="iconStyle(demo.actions.pin.icon)" />
      </button>
      <button type="button" class="as-demo__btn" :title="`${demo.actions.longshot.name} ${demo.actions.longshot.hint}`">
        <span class="as-demo__icon" :style="iconStyle(demo.actions.longshot.icon)" />
      </button>

      <span class="as-demo__sep" aria-hidden="true" />

      <button type="button" class="as-demo__btn" :title="`${demo.actions.copy.name} ${demo.actions.copy.hint}`">
        <span class="as-demo__icon" :style="iconStyle(demo.actions.copy.icon)" />
      </button>
      <button type="button" class="as-demo__btn" :title="`${demo.actions.quickSave.name} ${demo.actions.quickSave.hint}`">
        <span class="as-demo__icon" :style="iconStyle(demo.actions.quickSave.icon)" />
      </button>
      <button type="button" class="as-demo__btn" :title="`${demo.actions.save.name} ${demo.actions.save.hint}`">
        <span class="as-demo__icon" :style="iconStyle(demo.actions.save.icon)" />
      </button>
    </div>
  </div>
</template>
