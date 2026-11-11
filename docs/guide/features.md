---
title: 功能详解
description: AirSnip 的截图、标注、二次编辑、输出、长截图、OCR 取字、贴图与设置：多种标注工具、100 步撤销、三种保存格式与最多 20 张贴图。
---

<script setup lang="ts">
import ToolShowcase from '../.vitepress/theme/components/ToolShowcase.vue'
</script>

# 功能详解

## 截图 {#capture}

`F1` 触发：全屏冻结后进入框选。

- 八向缩放，按住空格整体拖动选区，方向键 1px 微调（按住 `Shift` 每次 5px）
- `Shift+F1` 再次截图：不退出覆盖层，重新冻结屏幕再框选；上一次的覆盖层控件也会被截进新图里
- 选区内空白处双击 = 复制完成
- 多显示器与负坐标布局正确（Per-Monitor V2）
- `F1` 被清空后，也可以从托盘菜单选「截图」触发

## 标注 {#annotate}

覆盖层里按数字键切换工具，按键可改。

<ToolShowcase :show-heading="false" />

<figure class="as-shot">
  <div class="as-window">
    <img src="/images/general.webp" alt="AirSnip 设置窗口的「通用」页，含开机自启、连按两次退出、语言与贴图位置" width="718" height="549" loading="lazy" decoding="async" />
  </div>
  <figcaption>设置面板「通用」页：开机自启、连按两次退出、语言、贴图位置。</figcaption>
</figure>

## 二次编辑 {#edit}

- 选中对象显示包围框 + 八向手柄：拖动移动、拖角缩放（`Shift` 等比）
- 选中后按 `Del` / `Backspace` 只删这一个标注，`Ctrl+Z` 一步恢复，不连带撤销其它标注
- 颜色与填充实时作用于选中对象；线宽 / 模糊强度 / 字号用滚轮调
- 撤销 / 重做 100 步，一次拖拽 = 一步

## 输出 {#output}

- 剪贴板：`CF_DIB` + 延迟渲染 PNG，粘到微信 / 文档 / 聊天框不失真
- 另存为：PNG / JPEG / WebP（无损）
- 文件名模板：`airsnip-20241231-235959` / 时间戳 / 仅日期；记住上次目录与格式

<figure class="as-shot">
  <div class="as-window">
    <img src="/images/save.webp" alt="AirSnip 设置窗口的「保存」页，三个文件名格式单选项" width="717" height="547" loading="lazy" decoding="async" />
  </div>
  <figcaption>设置面板「保存」页：文件名格式三选一。</figcaption>
</figure>

## 长截图 {#longshot}

- 以当前选区为视口，自己滚动页面，`Enter` 收尾，`Ctrl+Z` 撤销最后一段
- 全重叠区一致性校验拼接，自动识别固定页眉 / 页脚不重复
- 拼接过程实时缩略预览
- 完成后状态条有「另存为」按钮，也可以按 `Ctrl+S`：自选路径与格式（PNG / JPEG / WebP），命名模板与上次目录会预填；不另存时仍自动保存到默认目录

## OCR 文字识别 {#ocr}

- `F1` 框选后按 `T`（默认键，可改；或点工具栏「OCR」按钮）：覆盖层立即关闭，弹出文字卡片
- 卡片里的文字可以直接改错字、拖选、`Ctrl+A/C/V/X/Z`、右键菜单，输入法候选框跟随光标
- 左下「复制」一键写剪贴板，右下「自动复制」开关默认关闭；顶部图钉把卡片置顶，方便对照粘贴
- 卡片不自动关闭，`Esc` 或右上角 ✕ 关闭
- 识别走 Windows 自带的 `Windows.Media.Ocr`：图片不出本机，不需要 API key，不联网、不计费
- **不用先去开开关**：OCR 常开，工具栏的 OCR 按钮默认就在；首次识别才初始化引擎，不识别时不占资源。识别语言默认跟随系统首选语言，也可以在设置里指定；同一页的「识别后自动复制」可以让识别结果直接写进剪贴板
- 不想看到 OCR 按钮就在设置 → 「工具栏」里隐藏它，隐藏后 `T` 仍可用；彻底不用 OCR，到「快捷键」页把 OCR 键清空为「未设置」

<figure class="as-shot">
  <div class="as-window">
    <img src="/images/ocr.webp" alt="AirSnip 设置窗口的「OCR 翻译」页，含识别后自动复制、识别语言与本地识别说明" width="721" height="554" loading="lazy" decoding="async" />
  </div>
  <figcaption>设置面板「OCR 翻译」页：识别后自动复制、识别语言。</figcaption>
</figure>

## 贴图（Pin） {#pin}

- `F3` 把选区（含标注）钉在屏幕上
- 拖动、滚轮缩放、`Ctrl`+滚轮调透明度、1px 蓝框、右键菜单
- 最多 20 张，可一键全部关闭

## 设置 {#settings}

- 自绘面板，跟随系统深浅色
- 「外观」设置：调整软件主题，支持跟随系统切换、自适应；界面缩放可选自动或 100%–200% 固定档位，作用于全部界面（设置面板、覆盖层工具栏、贴图窗口）
- 「工具栏」页：24 个元素逐项显隐（10 个工具 / 5 个色块 / 填充·撤销·重做·字体行 / 贴图·长截图·OCR / 复制·保存），组头可整组全显或全隐；隐藏只影响绘制，快捷键与输出照旧——藏了保存按钮，`Ctrl+S` 照样能存
- 开机自启、「连按两次退出」、全部快捷键可改（含冲突检测与输入法兼容）；每一项都能清空为「未设置」，底部「恢复默认」一键还原全部快捷键
- 贴图默认位置、文件名模板、主题
- 自动更新：启动后静默检查新版本，发现后弹托盘气泡；可以在「关于」→ 版本更新里关掉「启动时自动检查」，也可以在那里手动更新
- 「关于」页：版本、许可、第三方组件清单、项目地址

<figure class="as-shot">
  <div class="as-window">
    <img src="/images/toolbar.webp" alt="AirSnip 设置窗口的「工具栏」页，24 个工具栏元素分成五组逐项开关，页脚提示隐藏后 Enter 仍复制、Ctrl+S 仍保存" width="721" height="552" loading="lazy" decoding="async" />
  </div>
  <figcaption>设置面板「工具栏」页：24 个元素逐项显隐，组头可整组全显或全隐。</figcaption>
</figure>

<figure class="as-shot">
  <div class="as-window">
    <img src="/images/appearance.webp" alt="AirSnip 设置窗口的「外观」页，三个主题单选项，以及界面缩放的自动、100%、125%、150%、175%、200% 六个档位" width="718" height="548" loading="lazy" decoding="async" />
  </div>
  <figcaption>设置面板「外观」页：跟随系统 / 浅色 / 深色，以及界面缩放的自动、100%、125%、150%、175%、200%。</figcaption>
</figure>
