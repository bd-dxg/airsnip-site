# 项目说明

airsnip-site：AirSnip（轻截）的产品官网 + 文档站。VitePress，产品事实集中在 `docs/.vitepress/data/site.ts`，组件与页面只取数、不写死数字。

需求与事实的唯一依据是 `airsnip-site-spec.md`；本文只写**怎么改、怎么发**。

## 常用命令

```powershell
pnpm dev              # 本地预览
pnpm build            # 构建到 docs/.vitepress/dist（推 main 由 CI 自动构建部署）
pnpm exec tsc --noEmit # 类型检查（strict）
```

没有测试，`pnpm build` 零错误零警告 + `tsc --noEmit` 零错误即视为验证通过。

> `pnpm preview` 启动时会缓存产物目录清单：重新 build 后必须重启 preview，否则新的带哈希资源会 404。

## 发版：必须改的地方

**核心坑：`.md` 文件顶部的 frontmatter 是 YAML，构建时不执行 JS。** 写 `link: ${VERSION}` 会原样输出成字符串。只有 `.vue` 文件和 `.md` 里的 `<script setup>` 能读变量——本项目已把版本号收在数据层，所以只有下面几处：

1. `docs/.vitepress/data/site.ts` 的 `VERSION`
   → 自动带动下载按钮文字、官方直链、加速直链，不用手改
2. 同文件的 `ASSET_NAME` 模板（`airsnip-${VERSION}-win-x64.zip`）：上游改了资产命名就要同步这一行
3. 体积有变化时：`downloadInfo.packageSize` 与 `stats` 里「下载包」那一项的 `value` / `unit`
4. 官网域名：`config.mts` 从环境变量读 `SITE_URL`（未设置时不生成 `sitemap.xml`、`og:url` 与 robots 的 sitemap 行），实际值写在 `.github/workflows/deploy.yml` 的 `SITE_URL` 与 `TARGET`

第 1 步改完，用下面这条各验一次，**两个都返回 200 且 `Content-Length` 一致**才算对：

```powershell
$asset = 'https://github.com/bd-dxg/airsnip/releases/download/v0.11.0/airsnip-v0.11.0-win-x64.zip'
curl.exe -sIL -o NUL -w "%{http_code} %{size_download}`n" $asset
curl.exe -sIL -o NUL -w "%{http_code} %{size_download}`n" "https://v4.gh-proxy.org/$asset"
```

### 下载直链格式

国内加速走 `v4.gh-proxy.org`（和 danmu-site 同一个镜像），原始 GitHub 链接直接拼在域名后面：

```text
https://v4.gh-proxy.org/https://github.com/bd-dxg/airsnip/releases/download/v0.11.0/airsnip-v0.11.0-win-x64.zip
```

注意这里的路径和文件名**都带 v**（`v0.11.0` / `airsnip-v0.11.0-win-x64.zip`），和 douyin-danmu 的 `0.2.1` 格式不一样，别照抄那边的。

`releases/latest` 只适合当「历史版本 / 所有版本」入口，不是直接下载——资产名里带版本号，`/releases/latest/download/<文件名>` 用不了。

资产名从 `https://github.com/bd-dxg/airsnip/releases/expanded_assets/<tag>` 页面能直接看到（GitHub REST API 未认证时限流，`curl -I -L` 才是验证可下载的手段）。

## 部署

- 推 `main` → Actions「部署官网」→ `pnpm build` → scp `docs/.vitepress/dist/` 到 `TARGET`
- 需要的 secrets：`PRIVATE_KEY`、`REMOTE_TXHOST`、`REMOTE_PORT`（和 danmu-site 同一台服务器，可复用同一套）
- 手动重跑：Actions 页面 Run workflow（`workflow_dispatch`）
- 回滚：revert 对应 commit 再推，CI 会用旧产物覆盖

## 约定

- 产品事实只进 `data/site.ts`：数字、工具、快捷键、人群、截图元数据、链接常量。组件和 Markdown 一律从这里取数。
- 文案红线（spec 第 15 节）：不编造用户数 / 下载量 / 评价，不点名对比竞品，不做假截图，「实测」不写成保证，不展示产品已知限制，不提旧名 `jietu`。
- 动效只动 `transform` / `opacity`；不做网站深色主题；不引入 UI 框架、动画库、统计脚本、网络字体。
- 截图用英文文件名，`<img>` 带真实 `width` / `height`，除 hero 外都 `loading="lazy"`。
- 首页分区由 `theme/Layout.vue` 的两个插槽组装；文档页需要数据驱动时用 `<script setup>` 局部引入组件。
- 直接提交 `main`（CI 自动部署），不开 PR。commit 标题 `<emoji> <中文短语>`：🎉 初始化、✨ 新增、🐛 修复、♻️ 重构、🔧 配置、📝 文档、🚀 版本号与发布、🔒 安全；正文写清为什么改、影响哪几处。
- 不提交 `node_modules/`、`docs/.vitepress/dist|cache/`、`*.log`、`.planning/`（`.gitignore` 已配）。
