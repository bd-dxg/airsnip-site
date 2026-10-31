<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import AudienceCards from './components/AudienceCards.vue'
import DownloadCard from './components/DownloadCard.vue'
import HeroShot from './components/HeroShot.vue'
import ProductTour from './components/ProductTour.vue'
import Reveal from './components/Reveal.vue'
import StatsGrid from './components/StatsGrid.vue'
import ToolShowcase from './components/ToolShowcase.vue'
import { ISSUES_URL, LICENSE_URL, REPO_URL, THIRD_PARTY_URL } from '../data/site'

const { Layout } = DefaultTheme

const reasons = [
  {
    title: '没有运行时',
    text: '没有 Electron / WebView / .NET 运行时；界面与标注由 Rust 直接绘制；常驻部分只做「等热键」。',
  },
  {
    title: '体积与常驻的量级',
    text: '同类工具常见自带运行时或基于 Electron，安装包数十至上百 MB、常驻内存数百 MB 量级。',
  },
  {
    title: '不靠 GPU',
    text: '纯 CPU 渲染：核显迷你主机、虚拟机、远程桌面里同样流畅。',
  },
  {
    title: '本地处理',
    text: '不联网、不上传、无遥测，截图只在你的机器上处理。',
  },
  {
    title: '删除即卸载',
    text: '删除 exe 即可，不写注册表；开机自启走任务计划。',
  },
]
</script>

<template>
  <Layout>
    <template #home-hero-after>
      <HeroShot />
    </template>

    <template #home-features-after>
      <StatsGrid />

      <section class="as-section" aria-labelledby="as-reasons-title">
        <Reveal as="h2" id="as-reasons-title" class="as-section__title">为什么能这么小</Reveal>
        <ul class="as-reasons">
          <Reveal
            v-for="(reason, index) in reasons"
            :key="reason.title"
            as="li"
            :delay="index * 70"
            class="as-reason"
          >
            <h3 class="as-reason__title">{{ reason.title }}</h3>
            <p class="as-reason__text">{{ reason.text }}</p>
          </Reveal>
        </ul>
      </section>

      <ProductTour />
      <ToolShowcase />
      <AudienceCards />

      <section class="as-section" aria-labelledby="as-open-source-title">
        <Reveal as="h2" id="as-open-source-title" class="as-section__title">开源</Reveal>
        <Reveal as="div" class="as-open-source" :delay="60">
          <p>
            AirSnip 以
            <a :href="LICENSE_URL" target="_blank" rel="noopener">GPL-3.0-only</a>
            开源，源码与问题反馈都在
            <a :href="REPO_URL" target="_blank" rel="noopener">GitHub</a>。第三方依赖均为宽松许可证（MIT /
            Apache-2.0 / BSD / Zlib / IJG 等），完整清单见
            <a :href="THIRD_PARTY_URL" target="_blank" rel="noopener">第三方组件声明</a>。
          </p>
          <p>
            技术栈：Rust（edition 2024）、windows-rs、tiny-skia（矢量栅格化）、DirectWrite（文字）、GDI
            BitBlt（抓屏）。遇到问题可以到
            <a :href="ISSUES_URL" target="_blank" rel="noopener">Issues</a> 反馈。
          </p>
        </Reveal>
      </section>

      <section class="as-section as-section--last" aria-labelledby="as-download-title">
        <Reveal as="h2" id="as-download-title" class="as-section__title">下载</Reveal>
        <Reveal as="div" :delay="60">
          <DownloadCard />
          <p class="as-footnote">
            解压即用，无需安装。启动步骤与配置位置见
            <a href="/guide/getting-started">快速上手</a>。
          </p>
        </Reveal>
      </section>
    </template>
  </Layout>
</template>
