---
title: 快速上手
description: 下载、启动与基本配置：AirSnip 是绿色单文件，解压即用，无需安装，首次运行需要管理员权限。
---

# 快速上手

AirSnip 是绿色单文件，解压即用，不写注册表。下面是完整启动流程。

## 1. 下载并解压

点击下载按钮获取 zip（约 0.62 MB，含文档与许可证），解压到任意目录。

<DownloadCard />

## 2. 双击 airsnip.exe

程序需要管理员权限（否则无法覆盖管理员权限的窗口），首次运行会弹 UAC，选「是」。

::: tip 首次运行提示
如遇 Windows SmartScreen 提示，点「更多信息」→「仍要运行」。
:::

## 3. 托盘常驻

启动后没有主窗口，程序常驻托盘：按 `F1` 截图，按 `F3` 贴图。

## 4. 打开设置

托盘图标左键打开设置，右键是「设置 / 退出」。

<figure class="as-shot">
  <div class="as-window">
    <img src="/images/general.webp" alt="AirSnip 设置窗口的「通用」页，左侧导航为通用、快捷键、保存、外观、关于" width="721" height="577" loading="lazy" decoding="async" />
  </div>
  <figcaption>设置面板「通用」页：开机自启、语言、贴图位置。</figcaption>
</figure>

## 5. 配置文件

配置写在 `%APPDATA%\airsnip\config.toml`。

## 关于热键

默认 `F1` 截图、`F3` 贴图，可在设置里修改。没有修饰键的全局热键会抢占其他程序的按键，建议用 `Ctrl` / `Alt` 组合。

下一步：[功能详解](./features) · [快捷键](./shortcuts) · [常见问题](./faq)
