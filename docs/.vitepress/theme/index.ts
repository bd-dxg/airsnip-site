import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import DownloadCard from './components/DownloadCard.vue'
import Reveal from './components/Reveal.vue'
import ShortcutTable from './components/ShortcutTable.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // 仅多页复用的组件全局注册，其余在 Markdown / 组件中局部引入
    app.component('Reveal', Reveal)
    app.component('ShortcutTable', ShortcutTable)
    app.component('DownloadCard', DownloadCard)
  },
} satisfies Theme
