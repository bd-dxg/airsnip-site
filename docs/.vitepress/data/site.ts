/**
 * 产品事实的唯一来源。
 * 组件与页面一律从这里取数，不得在别处重复硬编码数字或链接。
 * 数据出处：airsnip-site-spec.md 第 2 节（作者实测，目标机型无独显）。
 */

export interface Stat {
  label: string
  /** 用于 CountUp 的原始字符串，保留原始小数位 */
  value: string
  unit: string
  note: string
}

export interface Tool {
  /** 默认按键 '1'..'6' */
  key: string
  name: string
  description: string
}

export interface Shortcut {
  keys: string[]
  action: string
  scope: 'overlay' | 'pin' | 'global'
}

export interface Audience {
  title: string
  description: string
}

export interface ReleaseChange {
  /** 卡片图标，由组件映射为内联 svg */
  icon:
    | 'update'
    | 'keyboard'
    | 'longshot'
    | 'mirror'
    | 'toggle'
    | 'size'
    | 'trash'
    | 'target'
    | 'window'
    | 'move'
    | 'undo'
    | 'mouse'
    | 'tooltip'
    | 'hdr'
    | 'number'
    | 'palette'
    | 'clipboard'
    | 'shapes'
    | 'layout'
  title: string
  body: string
}

export interface ReleaseUpdate {
  title: string
  /** 一句话总结这次更新 */
  lead: string
  changes: ReleaseChange[]
}

export interface Screenshot {
  id: 'general' | 'toolbar' | 'shortcuts' | 'save' | 'appearance' | 'about'
  /** 标签页名 */
  title: string
  /** 只描述图中可见内容 */
  caption: string
  src: string
  width: number
  height: number
  /** 图片替代文本，只描述图中可见内容 */
  alt: string
}

export const REPO_URL = 'https://github.com/bd-dxg/airsnip'
export const RELEASES_URL = `${REPO_URL}/releases`
export const ISSUES_URL = `${REPO_URL}/issues`
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`
export const THIRD_PARTY_URL = `${REPO_URL}/blob/main/THIRD-PARTY.md`
export const PERF_URL = `${REPO_URL}/blob/main/docs/perf-m5.md`

// 由作者维护：改这里即可让下载地址与页面上显示的版本号同步更新
export const VERSION = 'v0.12.0'

/** 当前版本的 Release 页面，用于「完整更新日志」 */
export const RELEASE_URL = `${RELEASES_URL}/tag/${VERSION}`

const ASSET_NAME = `airsnip-${VERSION}-win-x64.zip`

/** GitHub 官方下载地址 */
export const DOWNLOAD_URL = `${REPO_URL}/releases/download/${VERSION}/${ASSET_NAME}`

/** 国内加速站前缀（只做转发，文件与 GitHub 上的完全一致；与 danmu-site 用同一个镜像） */
export const MIRROR_PREFIX = 'https://v4.gh-proxy.org/'

/** 走加速站的下载地址 */
export const DOWNLOAD_MIRROR_URL = `${MIRROR_PREFIX}${DOWNLOAD_URL}`

/** 第 2.1 节一句话，用于站点 description / meta */
export const DESCRIPTION = '1 MB 的 Windows 截图标注工具（Rust，纯 CPU 渲染，待机 0% CPU）'

export const downloadInfo = {
  platform: 'Windows x64',
  portable: '绿色免安装',
  packageSize: '0.81 MB',
  license: 'GPL-3.0-only',
} as const

export const stats: Stat[] = [
  {
    label: '单文件体积',
    value: '1.45',
    unit: 'MB',
    note: '一个 exe 就是全部',
  },
  {
    label: '下载包',
    value: '0.81',
    unit: 'MB',
    note: 'zip，含文档与许可证',
  },
  {
    label: '待机内存',
    value: '1.2',
    unit: 'MB',
    note: '常驻托盘时 Private Working Set；任务管理器显示约 5–10 MB，差值来自共享页',
  },
  {
    label: '待机 CPU',
    value: '0.00',
    unit: '%',
    note: '事件驱动，无定时轮询',
  },
  {
    label: '热键 → 可用画面',
    value: '124',
    unit: 'ms',
    note: '2560×1440：全屏抓取 + 暗化 + 覆盖层就绪',
  },
  {
    label: '拖框重绘',
    value: '4.6',
    unit: 'ms / 帧',
    note: '60 FPS 红线 16.7 ms，约 3 倍余量',
  },
]

/** 必须随数据一同展示的脚注 */
export const statsFootnote =
  '截图会话期间按屏幕大小临时分配位图（1440p 约 15 MB），退出覆盖层立即释放。'

/** 首页「这次更新了什么」：只写当前版本 Release 说明里的事实 */
export const releaseUpdate: ReleaseUpdate = {
  title: '这次更新了什么',
  lead: '四个大字：框选完先摆好位置再画标注；鼠标停在哪，就选中哪个窗口、甚至哪个按钮。OCR 与翻译在这一版撤销了。',
  changes: [
    {
      icon: 'window',
      title: '窗口自动吸附，单击就选中整窗',
      body: '还没框选时，光标停在哪就在哪高亮：细边加半透明遮罩，左下角报出这个窗口的尺寸，单击直接把整个窗口定成选区，接着就能标注。按下就拖（超过 2px）仍是自由框选，两种用法不打架。窗口边界按系统给的真实外框取，不会把 Windows 那圈看不见的阴影算进去；任务栏和贴图窗口同样能选。',
    },
    {
      icon: 'target',
      title: '还能继续下钻到控件',
      body: '停在工具栏按钮、输入框、列表项上时，高亮的不是整个窗口而是那个控件。悬停先亮整窗，后台查到的子控件随后收紧；滚轮往上退到父级、往下钻得更细，最粗一档永远是整窗。查询在常驻后台线程里跑，目标程序假死也不会把覆盖层拖住。',
    },
    {
      icon: 'move',
      title: '框选完默认是移动态',
      body: '框选结束后不再自动进入画矩形的状态：选区内拖空白就是整体平移，拖已有标注就是移动那个标注，方向键微调照旧，要画标注得显式选工具（工具栏第一个「移动」按钮，或按 V 回到移动态）。平移选区时标注跟着一起走，不会被裁到框外。每次截图都从移动态开始，颜色、线宽、字号还是照旧记住。',
    },
    {
      icon: 'toggle',
      title: '两个开关变了样子',
      body: '「通用」页的贴图位置从两行单选收成一行开关（开 = 屏幕中间、关 = 原位置），双击选区空白的动作也能配：默认复制截图，可以改成直接贴到屏幕。开关点完立即生效并写盘，不用关掉面板。新增「窗口吸附」「控件级捕捉」两个开关，默认都开，关掉后行为与没有这两项功能时完全一致。',
    },
    {
      icon: 'undo',
      title: '撤销 OCR 与翻译',
      body: '识别精度再往上走就得加体积、走云端，和「轻量、常驻近乎零开销」的方向冲突，所以整块撤掉了。设置面板少一页（7 → 6），快捷键页少一行，T 键、[ocr] 配置段一并消失；不用 OCR 的人反而少了一层界面。需要取字或翻译请用其他软件。',
    },
    {
      icon: 'mirror',
      title: '多显示器三处修复',
      body: '原位贴图在主屏不在左上角时会整体偏出一整块屏；F3 贴剪贴板图原先按整个虚拟屏居中，双屏时正好骑在接缝上，现在按光标所在显示器居中；混合 HDR + SDR 多屏截图时，非 HDR 那块不再全黑。',
    },
  ],
}

export const tools: Tool[] = [
  {
    key: '1',
    name: '矩形',
    description: '描边颜色、线宽、填充、圆角。',
  },
  {
    key: '2',
    name: '箭头',
    description: '直线或曲线（三次贝塞尔），头部随线宽缩放；Shift 吸附水平 / 垂直 / 45°。',
  },
  {
    key: '3',
    name: '文本',
    description: '中文输入法、系统全部字体、粗体 / 斜体、字号，双击再编辑。',
  },
  {
    key: '4',
    name: '高斯模糊',
    description: '拖动区域即模糊，强度滚轮可调。',
  },
  {
    key: '5',
    name: '荧光笔',
    description: '正片叠底半透明色块，不遮挡底图文字。',
  },
  {
    key: '6',
    name: '聚光灯',
    description: '选区内整体暗化、绘制区域恢复原亮，可叠加多块。',
  },
  {
    key: '7',
    name: '序号',
    description: '点一下落下一个编号并自动 +1，双击可改数字，后续序号从改后的值继续 +1。',
  },
  {
    key: '8',
    name: '直线',
    description: '按住 Shift 吸附水平 / 垂直 / 45°，只有头尾两个端点手柄。',
  },
  {
    key: '9',
    name: '椭圆',
    description: '按住 Shift 画正圆，与矩形共用填充开关。',
  },
  {
    key: '0',
    name: '手绘',
    description: '按 2px 最小步距采样点列，二次贝塞尔平滑，命中按折线距离判定。',
  },
]

export const shortcuts: Shortcut[] = [
  // 覆盖层
  {
    keys: ['Enter'],
    action: '复制到剪贴板并退出（Ctrl+C、选区内双击同效；双击的动作可在设置里改成贴图）',
    scope: 'overlay',
  },
  { keys: ['Ctrl', 'S'], action: '另存为（PNG / JPEG / WebP）', scope: 'overlay' },
  { keys: ['F3'], action: '把选区贴到屏幕', scope: 'overlay' },
  { keys: ['S'], action: '长截图（当前选区为视口）', scope: 'overlay' },
  {
    keys: ['V'],
    action:
      '回到「移动选区」态（默认键，可改）：选区内拖动平移选区、标注跟随，拖对象移动该对象',
    scope: 'overlay',
  },
  {
    keys: ['1 – 9', '0'],
    action:
      '切换工具：矩形 / 箭头 / 文本 / 模糊 / 荧光笔 / 聚光灯 / 序号 / 直线 / 椭圆 / 手绘（可改）；框选完默认是移动态，选工具后才进绘制',
    scope: 'overlay',
  },
  { keys: ['Ctrl', 'Z'], action: '撤销（Ctrl+Y 或 Ctrl+Shift+Z 重做）', scope: 'overlay' },
  {
    keys: ['Del', 'Backspace'],
    action: '删除选中的那个标注，Ctrl+Z 一步恢复；没选中对象时不吞按键',
    scope: 'overlay',
  },
  {
    keys: ['方向键'],
    action: '微调选中对象；无选中时移动选区框（按住 Shift 每次 5px）',
    scope: 'overlay',
  },
  {
    keys: ['Shift', '拖动'],
    action: '正方形 / 箭头方向吸附 / 轴向锁定 / 等比缩放',
    scope: 'overlay',
  },
  { keys: ['空格', '拖动'], action: '移动整个选区', scope: 'overlay' },
  {
    keys: ['滚轮'],
    action: '调线宽 / 模糊强度 / 字号（悬停对象或空白处）',
    scope: 'overlay',
  },
  { keys: ['Esc'], action: '取消截图', scope: 'overlay' },

  // 贴图窗口
  { keys: ['左键拖动'], action: '移动贴图', scope: 'pin' },
  { keys: ['滚轮'], action: '缩放', scope: 'pin' },
  { keys: ['Ctrl', '滚轮'], action: '调整透明度', scope: 'pin' },
  { keys: ['双击'], action: '关闭贴图（Esc 同效）', scope: 'pin' },
  { keys: ['右键'], action: '右键菜单', scope: 'pin' },
  { keys: ['Ctrl', 'F3'], action: '边框开关', scope: 'pin' },
  { keys: ['方向键'], action: '移动贴图', scope: 'pin' },

  // 全局热键
  { keys: ['F1'], action: '截图（默认值，可在设置修改）', scope: 'global' },
  {
    keys: ['Shift', 'F1'],
    action: '再次截图（默认值）：不退出覆盖层，重新冻结屏幕再框选，上一次的覆盖层控件会一起被截入',
    scope: 'global',
  },
  { keys: ['F3'], action: '贴图（默认值，可在设置修改）', scope: 'global' },
]

export const shortcutScopeTitles: Record<Shortcut['scope'], string> = {
  overlay: '覆盖层',
  pin: '贴图窗口',
  global: '全局热键',
}

export const audiences: Audience[] = [
  {
    title: '经常截图写文档、提 bug',
    description: '热键即出、标完直接粘。',
  },
  {
    title: '老机器 / 迷你主机 / 虚拟机 / 远程桌面',
    description: '不靠 GPU、不吃内存、自启无感。',
  },
  {
    title: '不喜欢装东西',
    description: '一个 exe，删了就卸载干净。',
  },
  {
    title: '在意隐私',
    description: '本地处理，不上传截图、无遥测。',
  },
]

export const screenshots: Screenshot[] = [
  {
    id: 'general',
    title: '通用',
    caption:
      '「通用」页：开机自启、连按两次 Esc / 右键退出两个开关，语言（简体中文），贴图位置·截图原位置与双击选区空白·复制截图两个开关，以及窗口吸附、控件级捕捉（默认开）。',
    alt: 'AirSnip 设置窗口的「通用」页，含开机自启、连按两次 Esc / 右键退出、语言、贴图位置、双击选区空白、窗口吸附与控件级捕捉',
    src: '/images/general.webp',
    width: 722,
    height: 552,
  },
  {
    id: 'toolbar',
    title: '工具栏',
    caption:
      '「工具栏」页：24 个元素逐项显隐——工具组（移动 + 10 个工具）、5 个色块、填充 / 撤销 / 重做 / 字体行、贴图 / 长截图、复制 / 保存；组头可整组全显或全隐。页脚提示：全隐藏后 Enter 仍复制、Ctrl+S 仍保存。',
    alt: 'AirSnip 设置窗口的「工具栏」页，24 个工具栏元素分成五组逐项开关，页脚提示隐藏后 Enter 仍复制、Ctrl+S 仍保存',
    src: '/images/toolbar.webp',
    width: 722,
    height: 552,
  },
  {
    id: 'shortcuts',
    title: '快捷键',
    caption:
      '「快捷键」页：截图 F1、再次截图 Shift+F1、贴图 F3、贴图边框 Ctrl+F3、长截图 S、工具·移动 V，以及各标注工具的按键，全部可改；底部「恢复默认」一键还原，并提示无修饰键会覆盖其他程序按键。',
    alt: 'AirSnip 设置窗口的「快捷键」页，逐项列出截图、再次截图、贴图、贴图边框、长截图、移动与各标注工具的按键，底部有「恢复默认」按钮',
    src: '/images/shortcuts.webp',
    width: 722,
    height: 552,
  },
  {
    id: 'save',
    title: '保存',
    caption:
      '「保存」页：文件名格式三选一——日期 + 时间、时间戳（毫秒）、仅日期，图中选中时间戳（毫秒）。',
    alt: 'AirSnip 设置窗口的「保存」页，三个文件名格式单选项，时间戳（毫秒）一项被选中',
    src: '/images/save.webp',
    width: 722,
    height: 552,
  },
  {
    id: 'appearance',
    title: '外观',
    caption:
      '「外观」页：跟随系统 / 浅色 / 深色三档，图中跟随系统被选中；界面缩放另有自动 / 100% / 125% / 150% / 175% / 200% 六档，图中 100% 被选中。',
    alt: 'AirSnip 设置窗口的「外观」页，跟随系统、浅色、深色三个主题单选项，以及界面缩放的自动、100%、125%、150%、175%、200% 六个档位',
    src: '/images/appearance.webp',
    width: 722,
    height: 552,
  },
  {
    id: 'about',
    title: '关于',
    caption:
      '「关于」页：版本 v0.12.0 与 GPL-3.0 许可、项目地址、第三方许可清单入口、版本更新（含启动时自动检查开关，图中显示已是最新），以及作者的支持项目说明与赞赏二维码（原样展示）。',
    alt: 'AirSnip 设置窗口的「关于」页，含版本号 v0.12.0、GPL-3.0 许可、项目地址、第三方许可入口、版本更新与启动时自动检查开关，以及支持项目二维码',
    src: '/images/about.webp',
    width: 722,
    height: 552,
  },
]

export const heroShot = {
  src: '/images/hero.webp',
  width: 1297,
  height: 742,
  alt: '按 F1 后的截图覆盖层：背景整体压暗，选区框住网页内容并显示选区尺寸，屏幕底部一行标注工具栏',
  caption: '按 F1 后的样子：屏幕冻结、框选任意区域，底部一行就是全部标注工具。',
}
