# AirSnip（轻截）产品官网 · 生成说明（v3）

> 给执行本文档的 AI：请严格按本文档从零生成一个 VitePress 站点。所有产品事实以「第 2 节」为唯一来源，**不得自行编造数据、功能、对比数字或用户评价**。文档没写、仓库里也查不到的信息，用 `TODO:` 注释标出，不要猜。

---

## 1. 目标

为开源 Windows 截图标注工具 **AirSnip（轻截）** 做一个单语言（简体中文）产品官网：

1. **首页**：10 秒内讲清卖点（1 MB、待机 0% CPU、热键 0.12 秒出画面、免安装、不联网），展示真实产品截图，引导下载。
2. **文档**：快速上手、功能详解、快捷键、常见问题。
3. **可信度**：展示实测数据与来源、开源许可、第三方组件。
4. **质感**：有克制、流畅的动效（见第 8 节），但不拖慢页面。

产品仓库：https://github.com/bd-dxg/airsnip （GPL-3.0-only）。产品仍处于开发阶段，尚无存量用户。

## 2. 产品事实（唯一信息来源）

### 2.1 基本信息

| 项 | 值 |
|---|---|
| 中文名 / 英文名 | 轻截 / AirSnip |
| 一句话 | 1 MB 的 Windows 截图标注工具（Rust，纯 CPU 渲染，待机 0% CPU） |
| 平台 | Windows（x64），绿色单文件，无需安装 |
| 版本 | v0.5.0（放在 `site.ts` 的 `VERSION` 常量，由作者维护） |
| 许可 | GPL-3.0-only，依赖均为宽松许可证（MIT / Apache-2.0 / BSD / Zlib / IJG 等） |
| 技术栈 | Rust（edition 2024）、windows-rs、tiny-skia（矢量栅格化）、DirectWrite（文字）、GDI BitBlt（抓屏） |

### 2.2 关键数字（作者实测，来源 `docs/perf-m5.md`，目标机型无独显）

| 指标 | 数值 | 说明 |
|---|---|---|
| 单文件体积 | 1.08 MB | 一个 exe 就是全部 |
| 下载包 | 0.62 MB | zip，含文档与许可证 |
| 待机内存 | 1.2 MB | 常驻托盘时 Private Working Set |
| 待机 CPU | 0.00% | 事件驱动，无定时轮询 |
| 热键 → 可用画面 | 124 ms | 2560×1440：全屏抓取 + 暗化 + 覆盖层就绪 |
| 拖框重绘 | 4.6 ms / 帧 | 60 FPS 红线 16.7 ms，约 3 倍余量 |

必须附带的脚注：截图会话期间按屏幕大小临时分配位图（1440p 约 15 MB），退出覆盖层立即释放。

### 2.3 卖点叙述

- 没有 Electron / WebView / .NET 运行时；界面与标注由 Rust 直接绘制；常驻部分只做「等热键」。
- 同类工具常见自带运行时或基于 Electron，安装包数十至上百 MB、常驻内存数百 MB 量级（**仅作泛化描述，不点名任何具体产品，不画对比图**）。
- 不靠 GPU：核显迷你主机、虚拟机、远程桌面里同样流畅。
- 隐私：本地处理，不联网、不上传、无遥测。
- 卸载：删除 exe 即可，不写注册表（开机自启走任务计划）。

### 2.4 适合谁（4 张卡片）

1. 经常截图写文档 / 提 bug 的人 —— 热键即出、标完直接粘
2. 老机器 / 迷你主机 / 虚拟机 / 远程桌面 —— 不靠 GPU、不吃内存、自启无感
3. 不喜欢装东西的人 —— 一个 exe，删了就卸载干净
4. 在意隐私的人 —— 本地处理，不联网、不上传、无遥测

### 2.5 功能清单

**截图**
- `F1` 触发：全屏冻结 → 框选（八向缩放、按住空格整体拖动、方向键 1px 微调 / `Shift` 5px）
- 选区内空白处双击 = 复制完成
- 多显示器与负坐标布局正确（Per-Monitor V2）

**标注（6 个工具）**

| 工具 | 键 | 能做什么 |
|---|---|---|
| 矩形 | 1 | 描边颜色、线宽、填充、圆角 |
| 箭头 | 2 | 直线或曲线（三次贝塞尔），头部随线宽缩放；`Shift` 吸附水平 / 垂直 / 45° |
| 文本 | 3 | 中文输入法、系统全部字体、粗体 / 斜体、字号，双击再编辑 |
| 荧光笔 | 4 | 正片叠底半透明色块，不遮挡底图文字 |
| 高斯模糊 | 5 | 拖动区域即模糊，强度滚轮可调 |
| 聚光灯 | 6 | 选区内整体暗化、绘制区域恢复原亮，可叠加多块 |

补充：曲线箭头选中后 1/3、2/3 处出现控制柄，可拖出 S 形，双击恢复直线；矩形、荧光笔、模糊、聚光灯都支持圆角（拖包围框内侧角的小圆柄）。

**二次编辑**
- 选中对象显示包围框 + 八向手柄：拖动移动、拖角缩放（`Shift` 等比）
- 颜色与填充实时作用于选中对象；线宽 / 模糊强度 / 字号用滚轮调
- 撤销 / 重做 100 步，一次拖拽 = 一步

**输出**
- 剪贴板：`CF_DIB` + 延迟渲染 PNG，粘到微信 / 文档 / 聊天框不失真
- 另存为：PNG / JPEG / WebP（无损）
- 文件名模板：`airsnip-20241231-235959` / 时间戳 / 仅日期；记住上次目录与格式

**长截图**
- 以当前选区为视口，自己滚动页面，`Enter` 收尾，`Ctrl+Z` 撤销最后一段
- 全重叠区一致性校验拼接，自动识别固定页眉 / 页脚不重复
- 拼接过程实时缩略预览

**贴图（Pin）**
- `F3` 把选区（含标注）钉在屏幕上
- 拖动、滚轮缩放、`Ctrl`+滚轮调透明度、1px 蓝框、右键菜单
- 最多 20 张，可一键全部关闭

**设置**
- 自绘面板，跟随系统深浅色
- 「外观」设置：调整软件主题，支持跟随系统切换、自适应
- 开机自启、全部快捷键可改（含冲突检测与输入法兼容）
- 贴图默认位置、文件名模板、主题
- 「关于」页：版本、许可、第三方组件清单、项目地址

### 2.6 快捷键

**覆盖层**

| 按键 | 动作 |
|---|---|
| `Enter` / `Ctrl+C` / 选区内双击 | 复制到剪贴板并退出 |
| `Ctrl+S` | 另存为（PNG / JPEG / WebP） |
| `F3` | 把选区贴到屏幕 |
| `S` | 长截图（当前选区为视口） |
| `1`–`6` | 切换工具（矩形 / 箭头 / 文本 / 荧光笔 / 模糊 / 聚光灯，可改） |
| `Ctrl+Z` / `Ctrl+Y` · `Ctrl+Shift+Z` | 撤销 / 重做 |
| 方向键（`Shift` ×5） | 微调选中对象；无选中时移动选区框 |
| `Shift` + 拖动 | 正方形 / 箭头方向吸附 / 轴向锁定 / 等比缩放 |
| 按住空格 + 拖动 | 移动整个选区 |
| 滚轮 | 调线宽 / 模糊强度 / 字号（悬停对象或空白处） |
| `Esc` | 取消截图 |

**贴图窗口**：左键拖动、滚轮缩放、`Ctrl`+滚轮透明度、双击 / `Esc` 关闭、右键菜单、`Ctrl+F3` 边框开关、方向键移动。

**全局热键**：默认 `F1` 截图、`F3` 贴图，可在设置修改；无修饰键会抢占其他程序按键，建议用 `Ctrl` / `Alt` 组合。

### 2.7 下载与使用

1. 点击下载按钮获取 zip，解压到任意目录（绿色单文件，无需安装）
2. 双击 `airsnip.exe`：程序需要管理员权限（否则无法覆盖管理员权限的窗口），首次运行弹 UAC，选「是」
3. 启动后托盘常驻（无主窗口），`F1` 截图 / `F3` 贴图
4. 托盘左键打开设置，右键为「设置 / 退出」
5. 配置文件：`%APPDATA%\airsnip\config.toml`

首次运行如遇 Windows SmartScreen 提示，点「更多信息」→「仍要运行」。（此条只放在「快速上手」页，一句话带过，不在其他页面强调。）

**下载链接**：由作者提供，写在 `site.ts` 的 `DOWNLOAD_URL` 常量里。作者尚未给出时，默认值先用 `RELEASES_URL`，并留 `TODO:` 注释。**站点不请求 GitHub API，不做自动取最新版本。**

### 2.8 开发者备忘（⚠ 不得出现在站点的任何页面、组件、meta 或注释的用户可见文本中）

以下是产品的已知限制，仅供开发者了解。官网不展示、不提及、不做「限制说明」组件：

- 发布版以管理员权限运行；开机自启走任务计划
- 独占全屏游戏、DRM 内容可能黑屏
- 界面仅简体中文
- 多屏混合 DPI 未实机验证
- exe 未代码签名
- 产品由旧名 jietu 改名而来（站点不提旧名，不写升级迁移内容）

### 2.9 相关链接

- 仓库：https://github.com/bd-dxg/airsnip
- Releases：https://github.com/bd-dxg/airsnip/releases
- Issues：https://github.com/bd-dxg/airsnip/issues
- 许可证：https://github.com/bd-dxg/airsnip/blob/main/LICENSE
- 第三方声明：https://github.com/bd-dxg/airsnip/blob/main/THIRD-PARTY.md
- 性能实测：https://github.com/bd-dxg/airsnip/blob/main/docs/perf-m5.md

### 2.10 产品截图（作者已提供）

作者会把截图放进 `docs/public/images/`。**中文文件名一律改为英文文件名后再引用**（URL 里避免中文）：

| 作者的文件 | 目标文件名 | 用途 |
|---|---|---|
| 主图.jpg | `hero.jpg` | 首页 `HeroShot`；`og:image` |
| 通用界面.jpg | `general.jpg` | `ProductTour` 标签页 1；功能页「截图 / 标注」 |
| 快捷键界面.jpg | `shortcuts.jpg` | `ProductTour` 标签页 2；快捷键页顶部 |
| 保存界面.jpg | `save.jpg` | `ProductTour` 标签页 3；功能页「输出」 |
| 关于界面.jpg | `about.jpg` | `ProductTour` 标签页 5；「开源与许可」页（图中含仓库地址和赞助信息，原样展示） |
| 外观界面.jpg | `appearance.jpg` | `ProductTour` 标签页 4；功能页「设置」（软件设置里的「外观」页：调整软件主题，支持跟随系统） |

处理规则：
- **先逐张查看图片**，读取真实宽高写进 `<img width height>`；`alt` 与图注只描述图中**可见**的内容，看不清的写 `TODO:`，不要臆测界面细节。
- 不裁剪、不加水印、不改内容；不生成任何假截图。
- 单张超过约 400 KB 时，只在 `README.md` 的 TODO 里提示作者压缩，**不要为此引入图片处理依赖**。
- 不新增赞助页、收款码或赞助文案；赞助信息仅以 `about.jpg` 原图形式出现。

---

## 3. 技术约束

- **框架**：VitePress（最新稳定版）+ Vue 3，所有组件 `<script setup lang="ts">`，TS `strict: true`，禁止 `any`。
- **包管理器**：pnpm。脚本只保留 `dev` / `build` / `preview`。
- **依赖**：除 `vitepress`、`vue`、`typescript` 外**不引入任何 UI 库 / CSS 框架 / 动画库**。动效统一用「原生 CSS（transition / keyframes / scroll 相关）+ IntersectionObserver + Vue `<Transition>`」实现，这三样足以覆盖第 8 节全部效果，且零依赖。
- **配置**：极简，不写无用的可选项。
- **格式 / lint**：如项目已有 oxfmt / oxlint 则沿用，否则不额外添加。
- **网络**：纯静态站点，**不发起任何第三方请求**（无统计、无网络字体、无 CDN、无 GitHub API）。
- **语言**：`lang: 'zh-CN'`，界面文案、注释均中文；代码标识符英文。
- **主题**：网站只提供浅色，**不做深色适配**：`config.mts` 设 `appearance: false`（移除深色切换开关），样式只写浅色一套。（这里指网站；软件本身支持跟随系统切换主题，见 2.5。）

## 4. 目录结构

```
airsnip-site/
├─ package.json
├─ tsconfig.json
├─ README.md                      # 开发说明 + TODO 清单（缺失素材 / 待确认项）
└─ docs/
   ├─ index.md                    # 首页（layout: home）
   ├─ download.md                 # 下载页
   ├─ guide/
   │  ├─ getting-started.md       # 快速上手
   │  ├─ features.md              # 功能详解
   │  ├─ shortcuts.md             # 快捷键
   │  └─ faq.md                   # 常见问题
   ├─ about/
   │  ├─ performance.md           # 性能数据与口径
   │  ├─ privacy.md               # 隐私说明
   │  └─ license.md               # 开源与许可（含 about.jpg）
   ├─ public/
   │  ├─ images/                  # 第 2.10 节的 6 张截图
   │  ├─ favicon.svg
   │  └─ robots.txt
   └─ .vitepress/
      ├─ config.mts
      ├─ data/
      │  └─ site.ts               # 所有产品事实的结构化数据
      ├─ composables/
      │  ├─ useInView.ts          # IntersectionObserver 封装
      │  └─ useReducedMotion.ts   # prefers-reduced-motion 封装
      └─ theme/
         ├─ index.ts
         ├─ Layout.vue
         ├─ custom.css            # 含动效 token 与全局 keyframes
         └─ components/
            ├─ Reveal.vue
            ├─ CountUp.vue
            ├─ HeroShot.vue
            ├─ StatsGrid.vue
            ├─ ToolShowcase.vue
            ├─ ProductTour.vue
            ├─ AudienceCards.vue
            ├─ ShortcutTable.vue
            └─ DownloadCard.vue
```

**原则**：产品事实只在 `data/site.ts` 写一次，组件和页面都从这里取数。

## 5. 数据层 `docs/.vitepress/data/site.ts`

```ts
export interface Stat {
  label: string
  value: string        // 如 "1.08"，用于 CountUp，保留原始小数位
  unit: string         // 如 "MB"
  note: string
}

export interface Tool {
  key: string          // '1'..'6'
  name: string
  description: string
}

export interface Shortcut {
  keys: string[]       // 如 ['Ctrl', 'S']
  action: string
  scope: 'overlay' | 'pin' | 'global'
}

export interface Audience {
  title: string
  description: string
}

export interface Screenshot {
  id: 'general' | 'shortcuts' | 'save' | 'appearance' | 'about'
  title: string        // 标签页名：通用 / 快捷键 / 保存 / 外观 / 关于
  caption: string      // 只描述图中可见内容；看不清写 TODO
  src: string          // '/images/general.jpg'
  width: number        // 真实宽
  height: number       // 真实高
}

export const REPO_URL = 'https://github.com/bd-dxg/airsnip'
export const RELEASES_URL = `${REPO_URL}/releases`
export const DOWNLOAD_URL = RELEASES_URL // TODO: 作者提供下载直链后替换
export const VERSION = 'v0.5.0'          // 由作者维护

export const stats: Stat[] = [/* 第 2.2 节 6 项 */]
export const tools: Tool[] = [/* 第 2.5 节 6 个工具 */]
export const shortcuts: Shortcut[] = [/* 第 2.6 节 */]
export const audiences: Audience[] = [/* 第 2.4 节 4 项 */]
export const screenshots: Screenshot[] = [/* 第 2.10 节：general / shortcuts / save / appearance / about */]
```

**不要**在数据层放「已知限制」相关内容。

## 6. 站点配置

### 6.1 `config.mts`

- `title: 'AirSnip 轻截'`，`description` 取第 2.1 节一句话。
- `cleanUrls: true`、`lastUpdated: true`、`appearance: false`（仅浅色，无深色模式）。
- `head`：favicon、`theme-color`、Open Graph（`og:image` 用 hero.jpg）、`twitter:card`。域名用环境变量 `SITE_URL`，未设置时跳过 `og:url` 与 sitemap，**不要写死域名**。
- `sitemap: { hostname: process.env.SITE_URL }`（仅在设置时启用）。
- `themeConfig`：
  - `nav`：快速上手 / 功能 / 快捷键 / 常见问题 / 下载；`socialLinks` 放 GitHub。
  - `sidebar`：`/guide/` 与 `/about/` 两组。
  - `search: { provider: 'local' }`，搜索界面文案中文化。
  - `outline`、`docFooter`、`lastUpdated`、`returnToTopLabel`、`sidebarMenuLabel` 等全部中文化。
  - `footer`：`GPL-3.0-only 开源 · © AirSnip` + 第三方组件声明链接。

### 6.2 主题入口 `theme/index.ts`

```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme
```

组件优先在 Markdown 中局部引入；仅多页复用的（`ShortcutTable`、`DownloadCard`、`Reveal`）在 `enhanceApp` 全局注册。

### 6.3 `Layout.vue`

包裹 `DefaultTheme.Layout`，用插槽组装首页：

- `home-hero-after` → `<HeroShot />`
- `home-features-after` → 按 8.1 的顺序放置其余首页区块

## 7. 组件规格

通用要求：键盘可达；375px 宽度下无横向滚动；无 JS 时内容完整可见（动效只是增强）；所有图片带 `width` / `height`，除 hero 外 `loading="lazy"`、`decoding="async"`。

| 组件 | 职责 | 要点 |
|---|---|---|
| `Reveal` | 滚动进入视口时淡入上移的通用包裹 | props：`delay?: number`（ms）、`as?: string`。逻辑见 8.2 |
| `CountUp` | 数字滚动到目标值 | props：`value: string`、`duration?: number`。逻辑见 8.3 |
| `HeroShot` | 首页主图展示 | 用 `hero.jpg`；窗口式边框（圆角 + 细边框 + 柔和阴影）；入场动效见 8.1；图注取「按 F1 后的样子：屏幕冻结、框选任意区域，底部一行就是全部标注工具」 |
| `StatsGrid` | 6 个关键数字 | 桌面 3×2、平板 2×3、手机 1 列；数字用 `CountUp`；卡片用 `Reveal` 错峰；底部脚注 + 「查看实测方法」链接到 `/about/performance` |
| `ToolShowcase` | 6 个标注工具 | 卡片网格；每张含工具名、描述、对应数字键 `<kbd>`；悬停效果见 8.5 |
| `ProductTour` | 产品界面标签页 | 5 个标签（通用 / 快捷键 / 保存 / 外观 / 关于）；见 8.4 |
| `AudienceCards` | 4 张「适合谁」卡片 | 取 `audiences`；`Reveal` 错峰 |
| `ShortcutTable` | 快捷键表 | props：`scope?`；按键用 `<kbd>`；窄屏表格容器 `overflow-x: auto` |
| `DownloadCard` | 下载入口 | 主按钮链接 `DOWNLOAD_URL`（`rel="noopener"`）；旁边显示 `VERSION`、`Windows x64 · 绿色免安装 · 约 0.62 MB`；副链接「在 GitHub 查看全部版本」→ `RELEASES_URL`。**不请求任何接口，不展示任何限制类文案** |

## 8. 动效规格

目标：有质感，但克制、快、不掉帧。

### 8.0 全局规则

- **只动画 `transform` 与 `opacity`**；不动画 `width` / `height` / `top` / `left` / `box-shadow` 的大幅变化；`will-change` 只在动画进行中临时加，不常驻。
- 动效 token 写进 `custom.css` 的 `:root`：`--motion-fast: 160ms`、`--motion-base: 360ms`、`--motion-slow: 640ms`、`--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`。
- **`prefers-reduced-motion: reduce`**：全局关闭 transition / animation，`Reveal` 直接显示，`CountUp` 直接显示终值。CSS 里用媒体查询兜底，JS 里用 `useReducedMotion()` 判断。
- **不能出现「内容先消失再出现」的闪烁**：SSR 输出的 HTML 里内容必须是可见的；只有挂载后判断元素**在视口下方**时，才把它切换为「待入场」状态再观察（首屏内的元素保持可见，不重播）。无 JS 时内容完整可见。
- 单次页面所有动画总数克制，不做无限循环的炫技动画。

### 8.1 首页入场与整体节奏

- Hero 文案：`name` → `text` → `tagline` → `actions` 依次淡入上移（`translateY(12px) → 0`，间隔约 80ms，每项 ~600ms）。用**纯 CSS keyframes + `animation-fill-mode: both`** 实现，不依赖 JS，不会闪烁。
- `HeroShot`：淡入 + 轻微放大（`scale(0.98) → 1`）+ 上移，延迟约 240ms，同样用纯 CSS。
- 首页自上而下：Hero → HeroShot → features（VitePress 原生）→ `StatsGrid` → 「为什么能这么小」一段文字（第 2.3 节）→ `ProductTour` → `ToolShowcase` → `AudienceCards` → 「开源」简介（GPL-3.0、仓库链接、第三方声明，纯文字）→ `DownloadCard`。
- 每个区块标题与内容用 `Reveal` 包裹，同一区块内子项按 `--i`（序号）错峰 60–80ms。

### 8.2 `Reveal` 滚动入场

- `useInView(el, { once: true, rootMargin: '0px 0px -10% 0px' })` 包装 IntersectionObserver，进入后断开观察。
- 状态用 `data-state="armed" | "shown"` 控制：`armed` 时 `opacity: 0; transform: translateY(16px)`，`shown` 时过渡到 `opacity: 1; transform: none`，时长 `--motion-base`，缓动 `--ease-out`。
- 仅当元素挂载时位于视口下方才设为 `armed`；不支持 IntersectionObserver 或开启 reduced-motion 时保持可见。

### 8.3 `CountUp` 数字滚动

- 首次进入视口时，从 0 滚动到 `value`，时长约 900ms，easeOutCubic，用 `requestAnimationFrame`。
- **小数位与 `value` 字符串保持一致**（如 `1.08`、`0.62`、`1.2`、`0.00`、`124`、`4.6`），动画结束时文本必须**精确等于** `value`。
- SSR 与无动画场景直接渲染终值；动画只在客户端挂载后、且元素位于视口下方时启动；每个实例只播放一次。
- 给容器加 `aria-label` 为终值，避免读屏器读到中间值。

### 8.4 产品截图区

**`ProductTour`**
- 顶部是 5 个标签（`role="tablist"`，键盘左右键切换），下方是截图展示窗口（带窗口式边框）。
- 切换使用 Vue `<Transition mode="out-in">`：旧图淡出 + 轻微位移，新图淡入，总时长约 `--motion-base`；容器高度由 `aspect-ratio`（取该图 `width/height`）固定，**切换时不得产生布局跳动**。
- 每个标签下方显示该图 `caption`。
- 图片首个标签 `loading="eager"`，其余在首次进入视口后再加载。
- 「外观」标签：图为软件设置里的「外观」页，图注只说明图中可见内容及「支持跟随系统切换主题」这一事实，不添加其他未经确认的外观功能描述。


### 8.5 微交互

- 卡片（`ToolShowcase` / `AudienceCards` / `StatsGrid`）：悬停时上移 2–4px，边框色向主色过渡；可选加一层随指针移动的柔和光斑（`radial-gradient`，通过 CSS 变量 `--mx` / `--my` 在 `pointermove` 中更新，仅桌面端，`prefers-reduced-motion` 下关闭）。
- `<kbd>`：悬停 / 聚焦时有轻微「按下」位移（`translateY(1px)` + 阴影收缩）。
- 按钮：悬停轻微上移 + 阴影加深，按下回弹，`--motion-fast`。
- 路由切换：保持 VitePress 默认，不额外做页面转场。

## 9. 页面内容要点

文案取自第 2 节，语气克制、技术向、不夸大；**不使用「最强」「完美」「碾压」之类词，不写第 2 节之外的任何数字、对比或评价**。

### 首页 `index.md`（`layout: home`）

- `hero.name`: `AirSnip`；`hero.text`: `1 MB 的 Windows 截图标注工具`；`hero.tagline`: `常驻内存 1.2 MB、待机 0% CPU、按热键 0.12 秒出画面。标注、长截图、贴图，功能一样不少。`
- `hero.actions`：主按钮「下载」→ `/download`；次按钮「快速上手」→ `/guide/getting-started`；第三个「GitHub」→ 仓库。
- `features`（6 项，VitePress 原生）：截图 / 标注 / 二次编辑 / 长截图 / 贴图 / 输出，每项一句话取自第 2.5 节，链接到 `/guide/features#...`。

### 各文档页

- **getting-started**：第 2.7 节五步 + SmartScreen 一句话 + 配置文件位置；提醒「无修饰键的全局热键会抢占其他程序按键，建议用 Ctrl / Alt 组合」。页内可嵌 `general.jpg`。
- **features**：按 截图 / 标注 / 二次编辑 / 输出 / 长截图 / 贴图 / 设置 分节，内容取第 2.5 节；标注部分用 `tools` 数据渲染；「标注」处配 `general.jpg`，「输出」处配 `save.jpg`，「设置」处配 `appearance.jpg`。
- **shortcuts**：页顶 `shortcuts.jpg`，其下三张表（覆盖层 / 贴图窗口 / 全局热键），用 `<ShortcutTable scope="..." />`。
- **faq**：Q&A 限于：是否联网；怎么卸载；怎么改热键；配置文件在哪；为什么首次运行会弹 UAC（需要管理员权限才能覆盖管理员窗口）；截图保存成什么格式 / 文件名怎么定；贴图最多几张。每条答案都必须能在第 2 节找到出处。**不写**任何限制性、兼容性问题（见 2.8）。
- **performance**：第 2.2 节完整表 +「为什么能这么小」+ 测试口径（2560×1440、无独显目标机型）+ 指向 `perf-m5.md` 的链接；注明数据为作者在自己目标机型上的实测，不同环境会有差异。
- **privacy**：软件本地处理、不联网、不上传、无遥测；另加一句「本网站不使用统计脚本，不发起第三方请求」。
- **license**：GPL-3.0-only、依赖许可证类型、第三方声明链接、仓库地址，页中展示 `about.jpg`。
- **download**：`<DownloadCard />` + 安装步骤摘要（第 2.7 节 1–4 步）。

## 10. 视觉方向

- **气质**：工具型、轻、克制、偏技术。大留白，不用渐变光球、玻璃拟态、霓虹等泛滥元素。
- **配色**：从 `hero.jpg` 取一个强调色，覆盖 `--vp-c-brand-1/2/3` 与 `--vp-c-brand-soft`；核对对比度（正文 ≥ 4.5:1）。
- **字体**：系统字体栈，**不加载网络字体**；等宽用于按键与命令。
- **截图边框**：统一的「窗口框」样式（圆角、1px 边框、柔和阴影），抽成公共 class。
- **`<kbd>`**：统一样式（圆角、1px 边框、轻微底部阴影），在 `custom.css` 全局定义。

## 11. SEO、可访问性、性能

- 每页有唯一 `title` / `description`（frontmatter）。
- 所有图片有 `alt`；按钮 / 链接有可见焦点样式；颜色不作为唯一信息载体；标签页遵循 WAI-ARIA tabs 模式。
- 首页 Lighthouse（移动端）目标：Performance ≥ 90、Accessibility ≥ 95、SEO ≥ 95（截图较多，Performance 略放宽）。
- 首屏只加载 `hero.jpg`；其余截图懒加载；JS 体积不额外引入依赖。
- `robots.txt` 允许全部抓取；设置了 `SITE_URL` 时附 sitemap 地址。

## 12. 部署（产出静态文件即可）

- `pnpm build` 产物在 `docs/.vitepress/dist`，纯静态，可放任意静态托管或 Nginx / OpenResty 站点目录。
- 默认部署在域名根路径，`base: '/'`；子路径部署通过环境变量 `BASE` 覆盖，不写死。
- `README.md` 写清：构建命令、环境变量（`SITE_URL`、`BASE`）、产物目录、「如何更换下载链接与版本号（改 `site.ts` 的 `DOWNLOAD_URL` / `VERSION`）」、TODO 清单。
- 首版不添加 CI 工作流。

## 13. 执行顺序

1. 初始化项目，装依赖，确认 `pnpm dev` 能跑。
2. 把作者截图放入 `docs/public/images/` 并按 2.10 重命名，读取真实宽高。
3. 写 `data/site.ts`，逐项对照第 2 节核对数字。
4. 写 `config.mts`、`theme/index.ts`、`Layout.vue`、`custom.css`（含动效 token 与 hero 入场 keyframes）。
5. 写 `useInView`、`useReducedMotion`、`Reveal`、`CountUp`，再写 `HeroShot`、`StatsGrid`，让首页先跑通。
6. 补齐 `ProductTour`、`ToolShowcase`、`AudienceCards`、`ShortcutTable`、`DownloadCard`。
7. 写所有 Markdown 页面。
8. 跑 `pnpm build` + `pnpm preview`，按第 14 节验收。
9. 写 `README.md`。

## 14. 验收清单

- [ ] `pnpm build` 零错误零警告，无死链
- [ ] 全站每个数字与第 2 节一致（1.08 MB、0.62 MB、1.2 MB、0.00%、124 ms、4.6 ms / 帧），`CountUp` 终值与原文完全一致
- [ ] 全站没有出现第 2 节之外的功能、数据、竞品名或评价
- [ ] **全站任何用户可见位置都没有 2.8 节的限制内容，也没有 jietu 旧名与升级迁移内容**
- [ ] 下载按钮指向 `DOWNLOAD_URL`，站点没有任何 GitHub API 请求
- [ ] 6 张截图均已使用，文件名为英文，带真实宽高；`alt` 与图注只描述可见内容
- [ ] 关闭 JS 后首页内容完整可见；刷新首屏无「先消失再出现」的闪烁
- [ ] 开启系统「减少动态效果」后：无入场动画、数字直接显示终值、无自动轮播
- [ ] 动画只使用 `transform` / `opacity`；Chrome Performance 面板下滚动与标签切换无明显掉帧；`ProductTour` 切换无布局跳动
- [ ] 375px / 768px / 1280px 三档无横向滚动
- [ ] 站点无深色模式：`appearance: false` 已设置，页面无主题切换开关，样式中无深色相关代码
- [ ] 键盘可完整操作导航、搜索、标签页、下载按钮
- [ ] 源码中没有 `any`、没有未使用的依赖、没有写死的域名
- [ ] 构建产物中没有任何第三方请求（统计 / 字体 / CDN / API）

## 15. 禁止事项

- 不编造用户数、下载量、Star 数、评价、荣誉。
- 不点名对比具体竞品，不放竞品对比表 / 图。
- 不生成假截图、假界面 mock，不臆测截图中看不清的内容。
- 不把「实测」数据写成保证；统一表述为「作者实测」。
- 不引入 UI 框架、动画库、统计脚本、网络字体；不做网站深色主题与主题切换开关。
- 不展示 2.8 节的限制内容；不新增升级迁移页、赞助页、收款码。
- 不修改第 2 节的任何事实；发现与仓库不一致时，在 `README.md` 的 TODO 里记录，由人工裁决。
