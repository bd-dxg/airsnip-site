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
    | 'ocr'
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
  id: 'general' | 'shortcuts' | 'save' | 'appearance' | 'ocr' | 'about'
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
export const VERSION = 'v0.10.0'

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
  packageSize: '0.80 MB',
  license: 'GPL-3.0-only',
} as const

export const stats: Stat[] = [
  {
    label: '单文件体积',
    value: '1.44',
    unit: 'MB',
    note: '一个 exe 就是全部',
  },
  {
    label: '下载包',
    value: '0.80',
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
  lead: '一句话：新增直线 / 椭圆 / 手绘三个标注工具，5 个色块全部可自定义，取消改成连按两次，并修掉 HDR 桌面下长截图内存暴涨。',
  changes: [
    {
      icon: 'shapes',
      title: '新增直线 / 椭圆 / 手绘',
      body: '工具栏再加三个标注工具，默认键 8 / 9 / 0，可在设置里改并参与冲突检测。直线按住 Shift 吸附水平 / 垂直 / 45°，只有头尾两个端点手柄；椭圆按住 Shift 画正圆，与矩形共用填充开关；手绘按 2px 最小步距采样点列，渲染用「相邻点中点 + 二次贝塞尔」平滑，命中按折线距离判定。三者都进既有的矢量对象模型，选中 / 移动 / 八向缩放 / 方向键微调 / 撤销重做直接可用。',
    },
    {
      icon: 'palette',
      title: '5 个色块都能自己改',
      body: '取消原来单独的「自定义色」格子，工具栏 5 个色块统一为单击使用、双击改色：双击展开覆盖层内自绘的取色面板，改的就是该色块本身。单击不用等「可能是双击」的计时器，所以没有选色延迟；悬停提示显示当前色值与操作方式。5 色随配置持久化，下次截图沿用。',
    },
    {
      icon: 'mouse',
      title: '取消截图改成连按两次',
      body: '有未保存标注时，第一次按 Esc / 右键只弹非模态提示，同一键在 2 秒内再按一次才退出，不再弹系统确认框；换键或先做别的操作会解除待命。设置「常规」页的开关文案改为「连按两次退出」，关掉后有标注也直接退出。',
    },
    {
      icon: 'tooltip',
      title: '提示不再盖住选区',
      body: '小选区下的提示优先放在选区内部右上角；可用高度不到提示两倍或宽度塞不下时退到选区上方，上方也没空间才放下方，最后钳回屏幕内。提示 2 秒自动消失，末尾 0.5 秒渐隐。',
    },
    {
      icon: 'hdr',
      title: '修掉 HDR 下长截图内存暴涨',
      body: 'HDR 桌面抓屏走 DXGI Desktop Duplication，原实现每抓一帧就重建一次 D3D11 设备与 duplication 会话，驱动在反复重建时会累积泄漏（长截图期间每 ~90ms 一帧，越滚占用越大）。现在整个长截图会话复用同一套设备，结束统一释放；遇到 DXGI_ERROR_ACCESS_LOST（切分辨率 / 全屏独占 / 锁屏）重建一次后继续。单次截图与贴图编辑仍是现建现用。',
    },
    {
      icon: 'layout',
      title: '界面细节跟上',
      body: '系统对话框声明通用控件 v6，抓屏 / 保存失败的提示不再是 Win7 式经典外观。设置「快捷键」页键帽行 12 → 15 项（5 个热键 + 10 个工具），仍是两列、固定窗口高度内；工具栏第一行 19 → 22 个按钮，已补窄屏 / 高缩放下不越界的回归测试。',
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
]

export const shortcuts: Shortcut[] = [
  // 覆盖层
  {
    keys: ['Enter'],
    action: '复制到剪贴板并退出（Ctrl+C、选区内双击同效）',
    scope: 'overlay',
  },
  { keys: ['Ctrl', 'S'], action: '另存为（PNG / JPEG / WebP）', scope: 'overlay' },
  { keys: ['F3'], action: '把选区贴到屏幕', scope: 'overlay' },
  { keys: ['S'], action: '长截图（当前选区为视口）', scope: 'overlay' },
  { keys: ['T'], action: 'OCR 识别选区文字（需在设置里打开总开关）', scope: 'overlay' },
  {
    keys: ['1 – 6'],
    action: '切换工具：矩形 / 箭头 / 文本 / 模糊 / 荧光笔 / 聚光灯（可改）',
    scope: 'overlay',
  },
  { keys: ['Ctrl', 'Z'], action: '撤销（Ctrl+Y 或 Ctrl+Shift+Z 重做）', scope: 'overlay' },
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
      '「通用」页：开机自启与连按两次退出两个开关，语言（简体中文），贴图位置（原位置 / 屏幕中间）二选一。',
    alt: 'AirSnip 设置窗口的「通用」页，含开机自启、连按两次退出、语言与贴图位置，左侧导航为通用、快捷键、保存、外观、OCR 翻译、关于',
    src: '/images/general.webp',
    width: 721,
    height: 553,
  },
  {
    id: 'shortcuts',
    title: '快捷键',
    caption:
      '「快捷键」页：截图 F1、再次截图 Shift+F1、贴图 F3、贴图边框 Ctrl+F3、长截图 S、OCR C，以及十个标注工具的按键，全部可改；底部「恢复默认」一键还原，并提示无修饰键会覆盖其他程序按键。',
    alt: 'AirSnip 设置窗口的「快捷键」页，逐项列出截图、再次截图、贴图、贴图边框、长截图、OCR 与十个标注工具的按键，底部有「恢复默认」按钮',
    src: '/images/shortcuts.webp',
    width: 719,
    height: 552,
  },
  {
    id: 'save',
    title: '保存',
    caption: '「保存」页：文件名格式三选一——日期 + 时间、时间戳（毫秒）、仅日期。',
    alt: 'AirSnip 设置窗口的「保存」页，三个文件名格式单选项',
    src: '/images/save.webp',
    width: 722,
    height: 552,
  },
  {
    id: 'appearance',
    title: '外观',
    caption:
      '「外观」页：跟随系统 / 浅色 / 深色三档，软件主题支持跟随系统切换；界面缩放另有自动 / 100% / 125% / 150% / 175% / 200% 六档。',
    alt: 'AirSnip 设置窗口的「外观」页，三个主题单选项，以及界面缩放的自动、100%、125%、150%、175%、200% 六个档位',
    src: '/images/appearance.webp',
    width: 723,
    height: 552,
  },
  {
    id: 'ocr',
    title: 'OCR 翻译',
    caption:
      '「OCR 翻译」页：OCR 总开关、识别后自动复制、识别语言（跟随系统），说明写明本地识别、图片不出本机。',
    alt: 'AirSnip 设置窗口的「OCR 翻译」页，含 OCR 总开关、识别后自动复制、识别语言与本地识别说明',
    src: '/images/ocr.webp',
    width: 720,
    height: 551,
  },
  {
    id: 'about',
    title: '关于',
    caption:
      '「关于」页：版本与许可、项目地址、第三方许可清单入口、版本更新（含启动时自动检查开关，图中显示已是最新），以及作者的支持项目说明与赞赏二维码（原样展示）。',
    alt: 'AirSnip 设置窗口的「关于」页，含版本号、GPL-3.0 许可、项目地址、第三方许可入口、版本更新与启动时自动检查开关，以及支持项目二维码',
    src: '/images/about.webp',
    width: 723,
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
