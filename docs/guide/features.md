---
title: 功能详解
description: AirSnip 的截图、标注、二次编辑、输出、长截图、贴图与设置：六个标注工具、100 步撤销、三种保存格式与最多 20 张贴图。
---

<script setup lang="ts">
import ToolShowcase from '../.vitepress/theme/components/ToolShowcase.vue'
</script>

# 功能详解

## 截图 {#capture}

`F1` 触发：全屏冻结后进入框选。

- 八向缩放，按住空格整体拖动选区，方向键 1px 微调（按住 `Shift` 每次 5px）
- 选区内空白处双击 = 复制完成
- 多显示器与负坐标布局正确（Per-Monitor V2）

## 标注 {#annotate}

六个工具，覆盖层里按数字键切换，按键可改。

<ToolShowcase :show-heading="false" />

<figure class="as-shot">
  <div class="as-window">
    <img src="/images/general.webp" alt="AirSnip 设置窗口的「通用」页，左侧导航为通用、快捷键、保存、外观、关于" width="721" height="577" loading="lazy" decoding="async" />
  </div>
  <figcaption>设置面板「通用」页：开机自启、语言、贴图位置。</figcaption>
</figure>

## 二次编辑 {#edit}

- 选中对象显示包围框 + 八向手柄：拖动移动、拖角缩放（`Shift` 等比）
- 颜色与填充实时作用于选中对象；线宽 / 模糊强度 / 字号用滚轮调
- 撤销 / 重做 100 步，一次拖拽 = 一步

## 输出 {#output}

- 剪贴板：`CF_DIB` + 延迟渲染 PNG，粘到微信 / 文档 / 聊天框不失真
- 另存为：PNG / JPEG / WebP（无损）
- 文件名模板：`airsnip-20241231-235959` / 时间戳 / 仅日期；记住上次目录与格式

<figure class="as-shot">
  <div class="as-window">
    <img src="/images/save.webp" alt="AirSnip 设置窗口的「保存」页，三个文件名格式单选项" width="720" height="575" loading="lazy" decoding="async" />
  </div>
  <figcaption>设置面板「保存」页：文件名格式三选一。</figcaption>
</figure>

## 长截图 {#longshot}

- 以当前选区为视口，自己滚动页面，`Enter` 收尾，`Ctrl+Z` 撤销最后一段
- 全重叠区一致性校验拼接，自动识别固定页眉 / 页脚不重复
- 拼接过程实时缩略预览

## 贴图（Pin） {#pin}

- `F3` 把选区（含标注）钉在屏幕上
- 拖动、滚轮缩放、`Ctrl`+滚轮调透明度、1px 蓝框、右键菜单
- 最多 20 张，可一键全部关闭

## 设置 {#settings}

- 自绘面板，跟随系统深浅色
- 「外观」设置：调整软件主题，支持跟随系统切换、自适应
- 开机自启、全部快捷键可改（含冲突检测与输入法兼容）
- 贴图默认位置、文件名模板、主题
- 「关于」页：版本、许可、第三方组件清单、项目地址

<figure class="as-shot">
  <div class="as-window">
    <img src="/images/appearance.webp" alt="AirSnip 设置窗口的「外观」页，三个主题单选项" width="718" height="578" loading="lazy" decoding="async" />
  </div>
  <figcaption>设置面板「外观」页：跟随系统 / 浅色 / 深色。</figcaption>
</figure>
