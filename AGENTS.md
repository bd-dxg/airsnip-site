# airsnip-site 开发指南

## 项目概览

AirSnip（轻截）的产品官网与文档站：VitePress + Vue 3，纯静态、简体中文、仅浅色主题、零第三方请求。

产品本体在 <https://github.com/bd-dxg/airsnip>（GPL-3.0-only）。本站只做展示与文档，下载直连 GitHub Release 资产及其加速线路，站点不承载安装包。

需求与事实的唯一依据是 `airsnip-site-spec.md`；本文只补充**怎么改、怎么提交**，不重复产品事实。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发 |
| `pnpm build` | 构建，产物在 `docs/.vitepress/dist` |
| `pnpm preview` | 预览产物（**重新 build 后必须重启**，它启动时会缓存产物目录清单，否则新哈希资源 404） |
| `pnpm exec tsc --noEmit` | 类型检查（strict，必须零错误） |

## 数据流与目录

- **产品事实只在 `docs/.vitepress/data/site.ts` 写一次**：数字、工具、快捷键、人群、截图元数据、链接常量、`VERSION`。页面与组件一律从这里取数，禁止在 Markdown 或组件里另写一遍数字。
- 首页分区由 `theme/Layout.vue` 的 `home-hero-after` / `home-features-after` 插槽组装，文案里没有数据驱动的部分直接写在 `Layout.vue`。
- 文档页是纯 Markdown；需要数据驱动时用 `<script setup>` 局部引入组件（例如 `features.md` 里的 `ToolShowcase`）。只有多页复用的 `Reveal` / `ShortcutTable` / `DownloadCard` 在 `theme/index.ts` 全局注册。
- 动效：`Reveal` / `CountUp` + `custom.css` 的动效 token。**只动 `transform` / `opacity`**，颜色过渡仅用于悬停反馈。

## 文案与事实红线

来自 `airsnip-site-spec.md` 第 15 节，改文案前先过一遍：

- 不编造用户数、下载量、Star 数、评价、荣誉。
- 不点名对比竞品，不做竞品对比表 / 图。
- 不生成假截图、假界面 mock；图注只描述图中**可见**内容。
- 实测数据统一写「作者实测」，不写成保证。
- 不引入 UI 框架、动画库、统计脚本、网络字体；不做网站深色主题与主题切换开关。
- 不展示产品已知限制（spec 2.8），不提旧名 `jietu`，不写升级迁移内容。
- 截图文件名用英文，`<img>` 必须带真实 `width` / `height`，除 hero 外都 `loading="lazy"`。

## Git 工作流

### 分支

- **禁止在 `main` 上直接开发**。功能 / 修复 / 重构 / 文档一律先切分支：
  - `feature/<slug>` 新增功能、新页面、新组件
  - `fix/<slug>` 修复
  - `refactor/<slug>` 重构、拆文件
  - `docs/<slug>` 纯文案 / 文档
- 完成后开 PR、**squash 合并**回 `main`，再删掉本地分支。
- 例外：版本号提升、README / AGENTS.md 这类发布收尾可以直接提交 `main`。

```powershell
git switch -c feature/product-tour
# 改完、自检通过
git push -u origin feature/product-tour
gh pr create --fill
gh pr merge --squash --delete-branch
```

### commit 信息

- 一律**简体中文**，标题不加句号。
- 标题格式：`<emoji> <动词短语>`，必要时在括号里补一句范围，例如
  `🚀 应用版本号升至 v0.6.0（双下载线路）`、`🐛 修复文档页下载按钮文字不可见`。
- emoji 语义固定，别自创：

| emoji | 用在 |
| --- | --- |
| 🎉 | 仓库初始化 |
| ✨ | 新增功能 / 页面 / 组件 |
| 🐛 | 修复 |
| ♻️ | 重构、拆文件、不改行为 |
| 🔧 | 配置、构建、工具链 |
| 📝 | 文档、文案、注释 |
| 🚀 | 版本号提升、发布收尾 |
| 🔒 | 安全、隐私、依赖加固 |

- 正文写**为什么改**和**影响面**；涉及数字或事实的改动，要写清改了哪几处（`site.ts` / 页面 / README），方便回溯。
- PR 合并到 `main` 的 commit 由 GitHub 自动追加 `(#N)`；`gh pr merge --squash` **不要传 `--subject`**，否则这个后缀会丢。
- 仓库历史保持线性：一个 PR 一个 commit，不出现 merge commit。

## 版本号与发布

- 版本号只有一处：`site.ts` 的 `VERSION`。下载地址由它拼出来，改一处两条线路一起变：

```
官方：https://github.com/bd-dxg/airsnip/releases/download/<VERSION>/airsnip-<VERSION>-win-x64.zip
加速：MIRROR_PREFIX + 官方地址
```

- 发版流程：
  1. 改 `VERSION`；
  2. 确认 Release 资产名符合 `airsnip-<VERSION>-win-x64.zip`（不一致时 `releases/expanded_assets/<tag>` 页面能看到真实资产名）；
  3. 两条下载链接各 `curl -I -L` 一次，确认 200 且 `Content-Length` 一致；
  4. 提交 `🚀 应用版本号升至 vX.Y.Z（…）`，推 `main`；
  5. 需要部署时按 `SITE_URL` / `BASE` 环境变量构建，产物目录 `docs/.vitepress/dist` 直接交给静态托管。
- 站点**不请求 GitHub API**、不做「自动取最新版本」，版本号由人工维护。
- 首版不加 CI 工作流；要上 GitHub Pages 再单独加 `deploy.yml`（记得同时配 `SITE_URL` 与 `BASE`）。

## 提交前检查清单

```powershell
pnpm build                 # 零错误零警告，无死链
pnpm exec tsc --noEmit     # 零错误
```

再人工确认：

- 改动涉及的数字与 `site.ts` 一致，`CountUp` 终值等于原文。
- 新增文案不越红线（见上）；没有新增限制类内容、竞品名、编造数据。
- 375 / 768 / 1280 三档没有横向滚动；关闭 JS 后内容完整可见。
- 没有引入新的第三方请求、依赖、深色样式。

## 禁止提交

`.gitignore` 已覆盖，别手动 `git add -f`：

- `node_modules/`、`docs/.vitepress/dist/`、`docs/.vitepress/cache/`
- `*.log`（`dev.log` / `preview.log` 等）
- `.planning/`（AI 助手的规划与进度文件，含本机绝对路径）
- `.vscode/`、`.idea/`、`.DS_Store`、`Thumbs.db`
