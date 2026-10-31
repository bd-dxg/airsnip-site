<script setup lang="ts">
import { computed } from 'vue'
import { shortcutScopeTitles, shortcuts, type Shortcut } from '../../data/site'

const props = defineProps<{ scope?: Shortcut['scope'] }>()

const rows = computed<Shortcut[]>(() =>
  props.scope ? shortcuts.filter((item) => item.scope === props.scope) : shortcuts,
)

const caption = computed(() => (props.scope ? shortcutScopeTitles[props.scope] : '快捷键'))
</script>

<template>
  <div class="as-table-wrap">
    <table>
      <caption class="as-sr-only">
        {{ caption }}
      </caption>
      <thead>
        <tr>
          <th scope="col">按键</th>
          <th scope="col">动作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="`${row.scope}-${index}`">
          <td class="as-table-wrap__keys">
            <template v-for="(key, keyIndex) in row.keys" :key="key">
              <span v-if="keyIndex > 0" class="as-key-join" aria-hidden="true">+</span>
              <kbd>{{ key }}</kbd>
            </template>
          </td>
          <td>{{ row.action }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
