# AirSnip 官网

开源 Windows 截图标注工具 **AirSnip（轻截）** 的产品官网与文档站，基于 VitePress + Vue 3，纯静态、简体中文、仅浅色主题。

- 产品仓库：<https://github.com/bd-dxg/airsnip>（GPL-3.0-only）
- 产品事实的唯一来源：`docs/.vitepress/data/site.ts`（组件与页面都从这里取数）

## 环境要求

- Node.js ≥ 18
- pnpm

```bash
pnpm install
```

> pnpm 10+ 默认不执行依赖的构建脚本。仓库里的 `pnpm-workspace.yaml` 已把 `esbuild` 加入 `allowBuilds` 白名单；若你删掉了这个文件，安装时需改用 `pnpm install --allow-build=esbuild`。

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发（<http://localhost:5173>） |
| `pnpm build` | 构建静态站点，产物在 `docs/.vitepress/dist` |
| `pnpm preview` | 预览构建产物 |

> `pnpm preview` 启动时会缓存产物目录清单，**重新 `pnpm build` 后需要重启 preview**，否则新的带哈希资源会 404。

## 环境变量

| 变量 | 作用 | 默认值 |
| --- | --- | --- |
| `SITE_URL` | 站点完整域名（如 `https://airsnip.example.com`）。设置后才会生成 `sitemap.xml`、`og:url`，以及 `robots.txt` 里的 sitemap 行 | 未设置（不生成上述内容） |
| `BASE` | 部署子路径，如 `/airsnip/` | `/` |

```bash
# 部署在根路径
pnpm build

# 部署在子路径 + 指定域名
BASE=/airsnip/ SITE_URL=https://example.com pnpm build
```

## 目录结构

```
docs/
├─ index.md                  # 首页（layout: home）
├─ download.md               # 下载
├─ guide/                    # 快速上手 / 功能详解 / 快捷键 / 常见问题
├─ about/                    # 性能数据与口径 / 隐私说明 / 开源与许可
├─ public/                   # images/、favicon.svg、robots.txt
└─ .vitepress/
   ├─ config.mts             # 站点与主题配置
   ├─ env.d.ts               # *.vue 类型声明
   ├─ data/site.ts           # 所有产品事实（数字、工具、快捷键、截图元数据）
   ├─ composables/           # useInView / useReducedMotion
   └─ theme/                 # Layout、custom.css、components/
```

## 如何更换版本号与下载线路

只改 `docs/.vitepress/data/site.ts`：

```ts
export const VERSION = 'v0.10.0'                   // 版本号
export const MIRROR_PREFIX = 'https://v4.gh-proxy.org/' // 国内加速站前缀
```

下载地址不是写死的，而是由版本号拼出来：

```
https://github.com/bd-dxg/airsnip/releases/download/<VERSION>/airsnip-<VERSION>-win-x64.zip
```

- 官方地址：`DOWNLOAD_URL`
- 加速地址：`MIRROR_PREFIX + DOWNLOAD_URL`（`DOWNLOAD_MIRROR_URL`）

换版本号后两条线路一起更新；要换加速站只改 `MIRROR_PREFIX`（换成任意「前缀 + 完整 GitHub 地址」形式的镜像站即可）。站点不请求 GitHub API，也不做「自动取最新版本」。

发版时还有三处要跟手改（它们不会随 `VERSION` 自动变）：

1. `stats` 里的「单文件体积」「下载包」，以及 `downloadInfo.packageSize`
2. `releaseNotes`——首页「本次更新」区块的四张卡片，内容照当次 Release 说明写
3. `docs/about/performance.md` 表格里的同一组数字

## 部署

`pnpm build` 后把 `docs/.vitepress/dist` 整个目录交给任意静态托管或 Nginx / OpenResty 站点目录即可。产物中不含任何第三方请求（无统计、无网络字体、无 CDN、无 API 调用）。

`node_modules/` 与 `docs/.vitepress/dist`、`.vitepress/cache` 属于生成物，无需提交。

## TODO（待作者 / 人工确认）

1. **下载包体积口径**：`v0.10.0` 的 `airsnip-v0.10.0-win-x64.zip` 实测为 842,706 字节（约 0.80 MiB / 0.84 MB 十进制），页面写的是「约 0.80 MB」，与 Release 说明一致。如需精确，改 `downloadInfo.packageSize`。
2. **截图为 WebP**：作者提供的原图为 `.webp`（文档示例写的是 `.jpg`）。为避免引入图片处理依赖，站点直接引用 webp，未做转码；`og:image` 同样是 webp，个别社交平台预览支持有限，如需要可另出一张 png。
3. **图片体积**：7 张截图当前均小于 450 KB（最大为 `hero.webp` 约 417 KB），暂不需要压缩。
4. **`about.webp` 中的赞助信息**：按文档要求原样展示，站点不新增任何赞助页或收款码。
5. **已按作者指示偏离文档的 3 处**（仅记录，无需处理）：
   - 版本号取 `v0.8.1`（文档写的是 `v0.5.0`）。
   - 标注工具键序按「快捷键」页截图：`4 = 高斯模糊`、`5 = 荧光笔`（文档 2.5 / 2.6 写的是荧光笔 4、模糊 5）。
   - 下载卡片主按钮指向国内加速线路（文档要求主按钮指向 `DOWNLOAD_URL` 官方地址），官方地址作为副按钮并列展示。
