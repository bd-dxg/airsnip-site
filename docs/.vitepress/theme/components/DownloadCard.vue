<script setup lang="ts">
import {
  DOWNLOAD_MIRROR_URL,
  DOWNLOAD_URL,
  MIRROR_PREFIX,
  RELEASES_URL,
  VERSION,
  downloadInfo,
} from '../../data/site'

const mirrorHost = new URL(MIRROR_PREFIX).host
</script>

<template>
  <div class="as-card as-download">
    <div class="as-download__actions">
      <a class="as-button" :href="DOWNLOAD_MIRROR_URL" target="_blank" rel="noopener">
        下载 AirSnip {{ VERSION }}（国内加速）
      </a>
      <a class="as-button as-button--ghost" :href="DOWNLOAD_URL" target="_blank" rel="noopener">
        GitHub 官方地址
      </a>
    </div>
    <p class="as-download__meta">
      {{ downloadInfo.platform }} · {{ downloadInfo.portable }} · 约
      {{ downloadInfo.packageSize }}
    </p>
    <p class="as-download__note">
      两条线路是同一个 zip：加速线路由 {{ mirrorHost }} 转发 GitHub 的文件，内容完全一致，国内直连 GitHub
      打不开时用它。
    </p>
    <a class="as-download__alt" :href="RELEASES_URL" target="_blank" rel="noopener">
      在 GitHub 查看全部版本
    </a>
  </div>
</template>
