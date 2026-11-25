---
title: 隐私政策
description: AirSnip（轻截）的隐私政策：不收集、不上传、不出售个人信息；截图、标注、长截图与贴图全部在本机完成；唯一的联网行为是检查新版本，可以关闭。
---

# 隐私政策

**生效日期：2026-11-25** · [English version ↓](#privacy-policy)

AirSnip（轻截）（以下简称"本软件"）是运行在 Windows 上的本地截图与标注工具，本政策的对象是本软件与本网站（airsnip.bddxg.top，以下简称"本网站"）。

## 一、我们的核心立场

- 本软件**不收集、不上传、不出售**任何个人信息，不需要注册或登录。
- 截图、标注、长截图拼接、贴图、快速保存，全部在你的设备上完成。
- 没有遥测，没有统计分析，没有广告，没有第三方 SDK。
- 唯一的联网行为是**检查新版本**（见第三节），而且可以关闭。

## 二、我们在什么情况下接触你的数据

| 你的操作 | 本软件接触到什么 | 之后怎么处理 |
| --- | --- | --- |
| 截图、长截图、贴图 | 屏幕像素（你框选的范围） | 只在内存里绘制与拼接，关掉覆盖层即释放 |
| 移动鼠标悬停窗口 | 其他窗口与控件的屏幕矩形（位置与尺寸） | 只用来画高亮框，不保存、不传输 |
| 复制截图 | 你框选范围内的图像 | 写进系统剪贴板，去向由你决定 |
| 快速保存、另存为 | 同一张图像 | 写进你指定的路径 |
| 按 `F3` 从剪贴板贴图 | 剪贴板里的图片 | 贴在屏幕上显示，不落盘 |
| 「我要反馈」 | 版本号、Windows 版本与 build、显示器与显卡型号、关键开关状态 | 只写进剪贴板，由你自己粘贴到反馈处 |
| 检查更新 | 无 | 见第三节 |

以上每一项都由你主动触发，本软件不会在后台读取屏幕、剪贴板或其它程序。

## 三、唯一的联网行为：检查新版本

- 时机：启动后约 3 秒检查一次；也可以在设置 →「关于」页手动检查。
- 可关闭：设置 →「关于」→ 版本更新 →「启动时自动检查」。关掉之后本软件不会再发起任何网络请求。
- 请求内容：一个 HTTP GET 请求，取回一份几百字节的版本清单（包含版本号、下载地址与签名）。User-Agent 固定为 `airsnip-updater`。
- **不发送**：设备标识、账号、许可证、截图内容、使用记录、任何可用于识别你的信息。
- 请求地址：GitHub Releases 的版本清单；为改善国内网络，会优先尝试第三方加速镜像（`gh-proxy.org`、`cdn.gh-proxy.org`、`v4.gh-proxy.org`），失败再直连 `github.com`。本软件遵循你系统的代理设置。
- 发现新版本后：把安装包下载到 `%TEMP%`，校验 SHA-256 与 Ed25519 签名，通过后由脚本替换旧版本、重启。
- 说明：GitHub 与镜像运营商作为第三方，会按其自身政策记录常规访问日志（如 IP、时间）。本软件不额外附加任何标识，我们也无法访问这些日志，不会据此识别任何用户。

## 四、保存在你设备上的数据

| 位置 | 内容 | 说明 |
| --- | --- | --- |
| `%APPDATA%\airsnip\config.toml` | 你改过的设置 | 删掉即恢复默认 |
| `%TEMP%\airsnip\` | 长截图日志（状态文本）与定位失败时的两帧画面 | 仅在你使用长截图时写入，进程内最多 6 对，超过 4 MB 自动轮转覆盖 |
| 你设置的保存目录（默认是「图片\airsnip」） | 你保存的截图 | 由你管理 |
| 计划任务 `airsnip` | 开机自启项（可选，默认关闭） | 在设置面板可随时取消 |

这些数据全部只在本机，本软件不上传、不备份、不同步。日志与配置随时可以整个删掉，不影响使用。

## 五、屏幕内容、窗口与控件信息

- 截图内容只存在于内存中，覆盖层关闭即释放；只有你主动复制或保存时才会写到剪贴板或文件。
- 窗口吸附与控件级捕捉使用 Windows UI Automation 读取当前窗口与其子控件的**屏幕矩形（位置与尺寸）**，用来画高亮框与决定"单击即选中哪个窗口"。本软件不读取控件里的文字、不读取窗口内容、不保存也不传输这些矩形。
- 图像最终发到哪里、给谁看，由你决定，本软件不参与。

## 六、剪贴板

- 读取：只有你按 `F3` 从剪贴板贴图时，才读取剪贴板里的图片。
- 写入：只有你复制截图或点「我要反馈」时，才写入剪贴板。
- 本软件不监听剪贴板的变化，不在后台读取剪贴板内容。

## 七、数据共享、转让与跨境传输

- 不共享、不转让、不出售任何个人信息，也不用于广告投放或用户画像。
- 我们没有服务器，也没有收集数据的数据库。
- 唯一的跨境访问是检查更新时向 GitHub 发起的请求（第三方平台，见第三节），请求里不含任何用户数据。

## 八、你的控制权

- **停止联网**：设置 →「关于」→ 关闭「启动时自动检查」。
- **删除设置**：删除 `%APPDATA%\airsnip\config.toml`。
- **删除日志**：删除 `%TEMP%\airsnip\` 目录（设置 →「通用」页底部有「打开日志文件夹」按钮）。
- **卸载**：绿色版删除 exe 即可；用的是安装包时按常规卸载。若开过开机自启，先在设置面板取消，或删除计划任务 `airsnip`。
- **联系我们删除**：本软件不保存你的任何数据，所以没有需要由我们删除的副本；如果你认为有，请按第十三节联系我们。

## 九、数据安全

- 本软件不存储、不传输个人信息，不存在"集中保存的用户数据被攻击"这一类风险面。
- 更新包使用 Ed25519 数字签名与 SHA-256 校验，校验不通过不会执行替换，以免更新通道被篡改。

## 十、儿童隐私

本软件不面向儿童，也不收集任何年龄段用户的个人信息（它本来就不收集）。

## 十一、本网站

本网站是纯静态页面：不使用统计脚本，不加载网络字体与 CDN 资源，也不会自动发起任何第三方请求，不设置用于追踪的 Cookie。

下载按钮是你主动点击的跳转：一个指向 GitHub，一个指向国内加速站（只转发 GitHub 的文件，内容一致）。

## 十二、本政策的变更

功能变化导致数据处理方式改变时，我们会更新本页并修改顶部的生效日期；影响较大的变化会同时在 [GitHub Releases](https://github.com/bd-dxg/airsnip/releases) 的说明里注明。

## 十三、联系我们

- 问题反馈与隐私相关询问：<https://github.com/bd-dxg/airsnip/issues>

提交 issue 时请勿粘贴含个人信息或敏感内容的截图；公开 issue 里的内容所有访问者都可见。我们会在合理时间内回复。

---

# Privacy Policy

**Effective date: 2026-11-25** · [中文简体 ↑](#隐私政策)

AirSnip（"the Software"）is a local screenshot and annotation tool for Windows. This policy covers the Software and this website (airsnip.bddxg.top, "the Site").

## 1. Our position

- The Software **does not collect, upload, or sell** any personal information. There is no account and no sign-in.
- Screenshots, annotations, long-screenshot stitching, pinned images, and quick saves all happen on your device.
- No telemetry, no analytics, no advertising, no third-party SDKs.
- The only network activity is a **version check** (section 3), and it can be turned off.

## 2. When the Software touches your data

| Your action | What is accessed | What happens to it |
| --- | --- | --- |
| Screenshot, long screenshot, pin | Screen pixels inside the area you select | Drawn and stitched in memory only, released when the overlay closes |
| Hovering over a window | Screen rectangles (position and size) of other windows and controls | Used only to draw the highlight; never stored or transmitted |
| Copy | The image inside your selection | Written to the system clipboard; you decide where it goes |
| Quick save / Save as | The same image | Written to the path you choose |
| `F3` paste from clipboard | The image currently on the clipboard | Shown on screen; not written to disk |
| "Send feedback" | Version, Windows build, display and GPU model, key toggle states | Written to the clipboard only; you paste it yourself |
| Version check | Nothing | See section 3 |

Every one of these is triggered by you. The Software never reads the screen, the clipboard, or other programs in the background.

## 3. The only network activity: version check

- **When**: about 3 seconds after launch, and on demand from Settings → About → Check for updates.
- **Can be disabled**: Settings → About → Updates → "Check automatically at startup". Once disabled, the Software makes no network requests at all.
- **What is sent**: an HTTP GET for a small version manifest (version number, download URL, signature). The User-Agent is the fixed string `airsnip-updater`.
- **What is never sent**: device identifiers, account data, license data, screenshot content, usage records, or anything else that could identify you.
- **Where to**: the manifest on GitHub Releases. To improve connectivity in mainland China, third-party mirrors (`gh-proxy.org`, `cdn.gh-proxy.org`, `v4.gh-proxy.org`) are tried first, then `github.com` directly. Your system proxy settings are respected.
- **If a new version is found**: the package is downloaded to `%TEMP%`, its SHA-256 and Ed25519 signature are verified, and only then is the old build replaced and restarted.
- **Third parties**: GitHub and the mirror operators keep their own standard access logs (IP address, timestamp) under their own policies. The Software adds no identifiers of any kind. We cannot access those logs and do not use them to identify anyone.

## 4. Data stored on your device

| Location | Content | Notes |
| --- | --- | --- |
| `%APPDATA%\airsnip\config.toml` | Your settings | Delete it to restore defaults |
| `%TEMP%\airsnip\` | Long-screenshot log (status text) plus two frames captured when stitching fails to locate an offset | Written only while you use long screenshot; at most 6 pairs per process; rotates out above 4 MB |
| Your save folder (default `Pictures\airsnip`) | Screenshots you saved | Managed by you |
| Scheduled task `airsnip` | Startup entry (optional, off by default) | Can be removed in Settings at any time |

All of it stays on your machine: no upload, no backup, no sync. You can delete the config file and the log folder whenever you like.

## 5. Screen content, windows, and controls

- Screenshot content exists in memory only and is released when the overlay closes. It reaches the clipboard or a file only when you choose to copy or save.
- Window snapping and control-level capture use Windows UI Automation to read the **screen rectangles (position and size)** of the window under the cursor and its child controls, in order to draw the highlight and to decide which window a single click selects. The Software does not read text or other content inside those controls, and does not store or transmit the rectangles.
- Where an image ends up, and who sees it, is entirely your decision.

## 6. Clipboard

- Read: only when you press `F3` to paste an image from the clipboard.
- Written: only when you copy a screenshot or press "Send feedback".
- The Software does not monitor clipboard changes and never reads the clipboard in the background.

## 7. Sharing, transfer, and cross-border transfer

- No personal information is shared, transferred, or sold, and none is used for advertising or profiling.
- We operate no server and hold no database of user data.
- The only cross-border traffic is the version check request to GitHub (a third party, see section 3), which carries no user data.

## 8. Your controls

- **Stop network access**: Settings → About → turn off "Check automatically at startup".
- **Delete settings**: remove `%APPDATA%\airsnip\config.toml`.
- **Delete logs**: remove the `%TEMP%\airsnip\` folder (Settings → General → "Open log folder").
- **Uninstall**: the portable build is a single executable — delete it. If you enabled start with Windows, disable it in Settings first, or delete the scheduled task `airsnip`.
- **Ask us to delete**: the Software stores none of your data, so there is no copy for us to delete. If you believe otherwise, contact us as described in section 13.

## 9. Security

- Because no personal information is stored or transmitted, there is no central store of user data to be compromised.
- Update packages are protected by an Ed25519 signature and a SHA-256 checksum; a package that fails verification is never installed, which keeps the update channel from being tampered with.

## 10. Children

The Software is not directed at children and collects no personal information from users of any age.

## 11. This website

The Site is fully static: no analytics scripts, no web fonts, no CDN resources, no automatic third-party requests, and no tracking cookies.

The download buttons are links you click yourself: one to GitHub, one to a mirror in mainland China that simply forwards the same file from GitHub.

## 12. Changes to this policy

If a change in functionality changes how data is handled, we will update this page and the effective date above. Significant changes are also noted in the release notes on [GitHub Releases](https://github.com/bd-dxg/airsnip/releases).

## 13. Contact

- Questions, including privacy questions: <https://github.com/bd-dxg/airsnip/issues>

Please do not attach screenshots containing personal or sensitive information to an issue; public issues are visible to everyone. We will respond within a reasonable time.
