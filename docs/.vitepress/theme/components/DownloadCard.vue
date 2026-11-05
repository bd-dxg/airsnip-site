<script setup lang="ts">
import {
  DOWNLOAD_MIRROR_URL,
  DOWNLOAD_URL,
  IS_PRERELEASE,
  MIRROR_PREFIX,
  RELEASES_URL,
  STABLE_DOWNLOAD_MIRROR_URL,
  STABLE_DOWNLOAD_URL,
  STABLE_PACKAGE_SIZE,
  STABLE_VERSION,
  VERSION,
  downloadInfo,
} from '../../data/site'

const mirrorHost = new URL(MIRROR_PREFIX).host
const platformLine = `${downloadInfo.platform} · ${downloadInfo.portable}`
</script>

<template>
  <div class="as-download">
    <div class="as-download__grid">
      <div class="as-card as-download__col">
        <div class="as-download__head">
          <span class="as-download__channel">测试版</span>
          <span v-if="IS_PRERELEASE" class="as-release__tag">预发布</span>
        </div>
        <p class="as-download__version">{{ VERSION }}</p>
        <p class="as-download__desc">OCR 取字刚落地，先放出来验证。</p>
        <div class="as-download__actions">
          <a class="as-button" :href="DOWNLOAD_MIRROR_URL" target="_blank" rel="noopener">
            加速下载
          </a>
          <a class="as-button as-button--ghost" :href="DOWNLOAD_URL" target="_blank" rel="noopener">
            GitHub
          </a>
        </div>
        <p class="as-download__meta">{{ platformLine }} · 约 {{ downloadInfo.packageSize }}</p>
      </div>

      <div class="as-card as-download__col">
        <div class="as-download__head">
          <span class="as-download__channel">正式版</span>
        </div>
        <p class="as-download__version">{{ STABLE_VERSION }}</p>
        <p class="as-download__desc">稳定发布，还没有 OCR。</p>
        <div class="as-download__actions">
          <a
            class="as-button as-button--ghost"
            :href="STABLE_DOWNLOAD_MIRROR_URL"
            target="_blank"
            rel="noopener"
          >
            加速下载
          </a>
          <a
            class="as-button as-button--ghost"
            :href="STABLE_DOWNLOAD_URL"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
        </div>
        <p class="as-download__meta">{{ platformLine }} · 约 {{ STABLE_PACKAGE_SIZE }}</p>
      </div>
    </div>

    <p class="as-download__note">
      每栏的两条线路是同一个 zip：加速线路由 {{ mirrorHost }} 转发 GitHub 的文件，内容完全一致，国内直连
      GitHub 打不开时用它。
    </p>
    <a class="as-download__alt" :href="RELEASES_URL" target="_blank" rel="noopener">
      在 GitHub 查看全部版本
    </a>
  </div>
</template>
