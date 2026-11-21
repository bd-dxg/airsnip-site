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
  /** 演示台图标文件名，取自软件仓库 assets/icons/ui/toolbar/<icon>.svg */
  icon: string
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
export const VERSION = 'v0.14.0'

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
  packageSize: '0.87 MB',
  license: 'GPL-3.0-only',
} as const

export const stats: Stat[] = [
  {
    label: '单文件体积',
    value: '1.56',
    unit: 'MB',
    note: '一个 exe 就是全部',
  },
  {
    label: '下载包',
    value: '0.87',
    unit: 'MB',
    note: 'zip，含文档与许可证',
  },
  {
    label: '待机内存',
    value: '3.8',
    unit: 'MB',
    note: '截图一次后的 Private Working Set，冷启动 2.3 MB',
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
  changes: [
    {
      icon: 'number',
      title: '序号升级成徽标：数字 / 对勾 / 叉号',
      body: '序号标记换成徽标，内容三态是数字、对勾、叉号，用来标「这里对、这里错」。没有新增工具栏按钮——第一行宽度已经贴着 1366×768 @ 200% 的上限，改成序号格子右下角多一个 ▾，点开是三行下拉。符号不占编号：一张图里混放 1、✓、✕、2 仍是 1、2。符号用矢量描边画，换任何字体都不会变成豆腐块，和徽标的圆形比例也始终一致。放置后要改：符号徽标双击直接在对勾 / 叉号之间切换，一次 Ctrl+Z 可回退；编号徽标双击仍进编辑框，直接打 v / √ / ✓ 或 x / × / ✕ 就行，不需要输入法。',
    },
    {
      icon: 'longshot',
      title: '长截图：局部动画不打断，快滚也接得上',
      body: '页面里有轮播图、GIF 头像、闪烁光标、进度条这类动画时不再整段失败——每行切 8 段各算哈希，5 段一致就算这行没变，动画只影响它所在的那一小段。快速滚动（超过半屏）也能接上：重叠区最小要求从半个内容区放宽到 1/5，所有候选位移都参与打分取最优。白底 / 内容稀疏的页面一滚动就被判「静止」的毛病修好了。吸顶导航、底部工具栏、左右粘滞侧栏都只留在最上面（最左）一份，纯色列不会被误遮。失败也不丢内容：参考帧只跟着成功拼入的部分前进，滚太快定位失败时往回落一点就能接上。',
    },
    {
      icon: 'tooltip',
      title: '长截图日志默认就写，一键打开文件夹',
      body: '排查长截图问题不用再退出托盘、开 PowerShell、设 AIRSNIP_DEBUG=1、去 %TEMP% 里翻文件：日志现在默认就在写，设置 →「通用」页底部点「打开日志文件夹」就能拿到。日志只有状态文本（滚动位置、匹配得分、画面变化比例），不含页面内容、不含账号密码；超过 4MB 自动轮转成 .log.1，只保留最近一段。定位异常时会把两帧画面存成 PNG（每次运行最多 6 对），问题解决后随手删掉即可。长截图状态条的按钮也补齐了悬停反馈：停留 400ms 弹出「名称 · 快捷键」气泡。',
    },
  ],
}

export const tools: Tool[] = [
  {
    key: '1',
    name: '矩形',
    icon: 'rect',
    description: '描边颜色（含渐变）、线型、线宽、填充、圆角。',
  },
  {
    key: '2',
    name: '箭头',
    icon: 'arrow',
    description: '直线或曲线（三次贝塞尔），头部随线宽缩放；Shift 吸附水平 / 垂直 / 45°。',
  },
  {
    key: '3',
    name: '文本',
    icon: 'text',
    description: '中文输入法、系统全部字体、粗体 / 斜体、字号，双击再编辑。',
  },
  {
    key: '4',
    name: '高斯模糊',
    icon: 'blur',
    description: '拖动区域即模糊，强度滚轮可调。',
  },
  {
    key: '5',
    name: '荧光笔',
    icon: 'highlight',
    description: '正片叠底半透明色块，不遮挡底图文字。',
  },
  {
    key: '6',
    name: '聚光灯',
    icon: 'glow',
    description: '选区内整体暗化、绘制区域恢复原亮，可叠加多块。',
  },
  {
    key: '7',
    name: '序号',
    icon: 'number',
    description:
      '徽标：点一下落下编号并自动 +1，双击改数字、后续从改后的值继续 +1；格子右下角 ▾ 切换数字 / 对勾 / 叉号，符号不占编号。',
  },
  {
    key: '8',
    name: '直线',
    icon: 'line',
    description: '按住 Shift 吸附水平 / 垂直 / 45°，只有头尾两个端点手柄。',
  },
  {
    key: '9',
    name: '椭圆',
    icon: 'ellipse',
    description: '按住 Shift 画正圆，与矩形共用填充开关。',
  },
  {
    key: '0',
    name: '手绘',
    icon: 'freehand',
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
  { keys: ['Ctrl', 'S'], action: '另存为（PNG / JPEG / WebP），可改键', scope: 'overlay' },
  {
    keys: ['Alt', 'S'],
    action: '快速保存：按保存路径模板直接落盘、不弹对话框，点存完的提示可定位到文件',
    scope: 'overlay',
  },
  {
    keys: ['F'],
    action: '没有选区时选中光标所在显示器的整屏（含任务栏）；已有选区时不生效',
    scope: 'overlay',
  },
  {
    keys: ['R'],
    action: '没有选区时复用本次运行上一次确定的选区；不自动完成',
    scope: 'overlay',
  },
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
    keys: ['双击', '徽标'],
    action:
      '对勾 / 叉号徽标双击在两者之间切换（可撤销）；编号徽标双击进编辑框，直接输 v / √ / ✓ 或 x / × / ✕，不需要输入法',
    scope: 'overlay',
  },
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
      '「工具栏」页：24 个元素逐项显隐——工具组（移动 + 10 个工具）、3 个色块（2 纯色 + 1 渐变）、填充 / 线型 / 撤销 / 重做 / 字体行、贴图 / 长截图、复制 / 快存 / 保存；组头可整组全显或全隐。页脚提示：复制 / 保存藏了之后 Enter 仍复制、Ctrl+S 仍保存。',
    alt: 'AirSnip 设置窗口的「工具栏」页，24 个工具栏元素分成五组逐项开关，含 3 个色块、线型格子与快存按钮，页脚提示隐藏后 Enter 仍复制、Ctrl+S 仍保存',
    src: '/images/toolbar.webp',
    width: 722,
    height: 552,
  },
  {
    id: 'shortcuts',
    title: '快捷键',
    caption:
      '「快捷键」页：分「截图 / 输出 / 工具」三个子页签，图中选中「工具」，列出移动 V 与 10 个标注工具的按键，全部可改；底部「恢复默认」一键还原，并提示无修饰键会覆盖其他程序按键。',
    alt: 'AirSnip 设置窗口的「快捷键」页，分截图、输出、工具三个子页签，当前为工具页签，逐项列出移动 V 与矩形到数字键 1–0 的标注工具按键，底部有恢复默认按钮',
    src: '/images/shortcuts.webp',
    width: 722,
    height: 552,
  },
  {
    id: 'save',
    title: '保存',
    caption:
      '「保存」页：保存位置、文件名模板、格式（.png）、同名文件自动加序号，下面一行实时预览最终路径；上方是「快速保存后显示通知」「同时复制到剪贴板」两个开关，底部是「打开文件夹」「变量说明」。',
    alt: 'AirSnip 设置窗口的「保存」页，含快速保存后显示通知与同时复制到剪贴板两个开关、保存位置路径、文件名模板输入框、格式下拉框 .png、同名文件自动加序号、预览路径，以及打开文件夹与变量说明按钮',
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
      '「关于」页：版本号与 GPL-3.0 许可，行右侧是「我要反馈」按钮；下面依次是项目地址、第三方许可清单入口、版本更新（含启动时自动检查开关，图中显示已是最新），以及作者的支持项目说明与赞赏二维码（原样展示）。',
    alt: 'AirSnip 设置窗口的「关于」页，含版本号、GPL-3.0 许可、我要反馈按钮、项目地址、第三方许可入口、版本更新与启动时自动检查开关，以及支持项目二维码',
    src: '/images/about.webp',
    width: 722,
    height: 552,
  },
]

export const heroShot = {
  src: '/images/hero.webp',
  width: 1329,
  height: 692,
  alt: '按 F1 后的截图覆盖层：背景整体压暗，选区框住网页内容并显示选区尺寸，屏幕底部一行标注工具栏',
  caption: '按 F1 后的样子：屏幕冻结、框选任意区域，底部一行就是全部标注工具。',
}

/**
 * 首页演示台（DemoStage）用的真实参数，每一项都能在软件源码里找到出处。
 * 改任何数字前先对一遍源码，不在组件里另写一份：
 * - 调色板：src/theme/mod.rs（`DARK`，RGBA 已换算成 CSS 写法）
 * - 工具栏几何：src/overlay/toolbar/mod.rs（各 `*_BASE` 常量）
 * - 滚轮步进与范围：src/overlay/wheel.rs
 * - 选中框、手柄、强调色：src/overlay/objedit/frame.rs
 * - 圆角控制柄：src/overlay/objedit/mod.rs（`RADIUS_GRIP_BASE` / `ARC_TO_CORNER`）
 * - 默认颜色：src/editor/palette.rs；默认线宽：src/editor/tool.rs
 */
export const demo = {
  /**
   * 两套调色板，对应 src/theme/mod.rs 的 DARK / LIGHT。
   * 覆盖层工具栏取的是 `theme::palette(resolve(config.theme))`，所以软件切浅色时它就真变成浅色条。
   */
  palettes: {
    dark: {
      bg: 'rgba(32, 32, 32, 0.941)',
      border: 'rgba(255, 255, 255, 0.235)',
      icon: 'rgba(255, 255, 255, 0.922)',
      divider: 'rgba(255, 255, 255, 0.157)',
      accent: '#1a73e8',
      accentSoft: 'rgba(26, 115, 232, 0.353)',
      swatchBorder: 'rgba(0, 0, 0, 0.471)',
      rowHover: 'rgba(255, 255, 255, 0.071)',
      shadow: '0 16px 40px -16px rgba(0, 0, 0, 0.55)',
    },
    light: {
      bg: 'rgba(248, 248, 248, 0.965)',
      border: 'rgba(0, 0, 0, 0.176)',
      icon: 'rgba(40, 40, 40, 0.922)',
      divider: 'rgba(0, 0, 0, 0.098)',
      accent: '#1a73e8',
      accentSoft: 'rgba(26, 115, 232, 0.157)',
      swatchBorder: 'rgba(0, 0, 0, 0.235)',
      rowHover: 'rgba(0, 0, 0, 0.039)',
      shadow: '0 16px 40px -16px rgba(15, 23, 42, 0.42)',
    },
  },

  /** 覆盖层会把屏幕整体压暗（两种主题一致）；演示台只留一点点，多了会发闷 */
  dimmer: 'rgba(15, 23, 42, 0.08)',

  /** 舞台 viewBox：与 .as-demo__stage 的 16:10 一致，1 单位 = 1 CSS px */
  stage: { width: 1120, height: 700 },

  /** 工具栏基准几何（100% DPI 下就是屏幕像素） */
  toolbar: {
    height: 34,
    rowGap: 3,
    button: 26,
    swatch: 22,
    gap: 4,
    sep: 9,
    pad: 5,
    radius: 8,
    /** 线型格子占两格宽：要看出「段 + 隙」 */
    lineSlot: 52,
    /** 图标在按钮里的绘制边长 */
    iconSize: 18,
  },

  /** 描边类工具的默认值与滚轮范围（wheel.rs / tool.rs） */
  stroke: {
    color: '#e53935',
    defaultWidth: 4,
    minWidth: 1,
    maxWidth: 32,
    /** 滚轮一格 1px，按住 Ctrl 三倍 */
    wheelStep: 1,
    ctrlStep: 3,
    /** 命中判定放宽量：指针离矩形多远内算「悬停在这个对象上」 */
    hitSlop: 8,
  },

  /** 选中框与手柄（frame.rs） */
  frame: { accent: '#1a73e8', handle: 7, round: 3.5, lineWidth: 1 },

  /** 手柄命中半径（pick/mod.rs 的 PICK_RADIUS_BASE） */
  pickRadius: 6,

  /** 缩放的最小边长（objedit/mod.rs 的 MIN_SIZE） */
  minSide: 4,

  /** 圆角控制柄：内缩 14 + 0.293 × r，上限 min(宽, 高) / 2 */
  radiusGrip: { baseInset: 14, arcToCorner: 0.293 },

  /** 底图那张白色卡片的位置与尺寸（舞台 viewBox 坐标，组件按百分比摆） */
  docCard: { x: 300, y: 200, width: 520, height: 300 },

  /** 演示台的初始矩形（舞台坐标）：框住卡片里的日志区，不切到标题与 URL 行 */
  initialRect: { x: 344, y: 252, width: 432, height: 200 },

  /** 第一行工具栏里工具之外的元素，顺序与 toolbar::layout 的组分一致 */
  actions: {
    move: { name: '移动', icon: 'move', hint: 'V' },
    fill: { name: '填充', icon: 'fill', hint: '' },
    line: { name: '线型', icon: 'line', hint: '' },
    undo: { name: '撤销', icon: 'undo', hint: 'Ctrl+Z' },
    redo: { name: '重做', icon: 'redo', hint: 'Ctrl+Y' },
    pin: { name: '贴图', icon: 'pin', hint: 'F3' },
    longshot: { name: '长截图', icon: 'longshot', hint: 'S' },
    copy: { name: '复制', icon: 'copy', hint: 'Enter' },
    quickSave: { name: '快存', icon: 'quick_save', hint: 'Alt+S' },
    save: { name: '保存', icon: 'save', hint: 'Ctrl+S' },
  },

  /** 工具栏里的三个色块：两个纯色 + 一个渐变（palette.rs 的 DEFAULT_COLORS） */
  swatches: { solid: ['#e53935', '#fb8c00'], gradient: ['#e53935', '#fb8c00'] },
} as const
