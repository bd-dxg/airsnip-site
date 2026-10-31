import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type HeadConfig } from 'vitepress'
import { DESCRIPTION, REPO_URL, THIRD_PARTY_URL } from './data/site'

/** 站点域名由环境变量提供，未设置时不生成 og:url / sitemap / robots 的 sitemap 行 */
const siteUrl = process.env.SITE_URL?.replace(/\/+$/, '')
/** 子路径部署时通过 BASE 覆盖，默认部署在根路径 */
const base = process.env.BASE ?? '/'

const head: HeadConfig[] = [
  ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
  ['meta', { name: 'theme-color', content: '#1b6ba6' }],
  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:site_name', content: 'AirSnip 轻截' }],
  ['meta', { property: 'og:image', content: `${siteUrl ?? ''}${base}images/hero.webp` }],
  ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
]
if (siteUrl) {
  head.push(['meta', { property: 'og:url', content: `${siteUrl}${base}` }])
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'AirSnip 轻截',
  description: DESCRIPTION,
  base,
  cleanUrls: true,
  lastUpdated: true,
  appearance: false,
  head,
  sitemap: siteUrl ? { hostname: siteUrl } : undefined,
  markdown: {
    // 站内链接在构建时校验，避免死链
    externalLinks: { target: '_blank', rel: 'noopener' },
  },
  transformHead({ pageData }) {
    const title = pageData.frontmatter.title
    const description = pageData.frontmatter.description
    const tags: HeadConfig[] = []
    if (title) {
      tags.push(['meta', { property: 'og:title', content: `${title} | AirSnip 轻截` }])
    }
    if (description) {
      tags.push(['meta', { property: 'og:description', content: description }])
      tags.push(['meta', { name: 'twitter:description', content: description }])
    }
    return tags
  },
  async buildEnd(siteConfig) {
    const lines = ['User-agent: *', 'Allow: /', '']
    if (siteUrl) lines.push(`Sitemap: ${siteUrl}${base}sitemap.xml`, '')
    await writeFile(resolve(siteConfig.outDir, 'robots.txt'), lines.join('\n'), 'utf8')
  },
  themeConfig: {
    logo: `${base}favicon.svg`,
    siteTitle: 'AirSnip 轻截',
    nav: [
      { text: '快速上手', link: '/guide/getting-started' },
      { text: '功能', link: '/guide/features' },
      { text: '快捷键', link: '/guide/shortcuts' },
      { text: '常见问题', link: '/guide/faq' },
      { text: '下载', link: '/download' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '文档',
          items: [
            { text: '快速上手', link: '/guide/getting-started' },
            { text: '功能详解', link: '/guide/features' },
            { text: '快捷键', link: '/guide/shortcuts' },
            { text: '常见问题', link: '/guide/faq' },
          ],
        },
      ],
      '/about/': [
        {
          text: '关于',
          items: [
            { text: '性能数据与口径', link: '/about/performance' },
            { text: '隐私说明', link: '/about/privacy' },
            { text: '开源与许可', link: '/about/license' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: REPO_URL, ariaLabel: 'GitHub 仓库' }],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '清除查询条件',
            backButtonTitle: '关闭搜索',
            noResultsText: '没有找到结果：',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车键',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上箭头',
              navigateDownKeyAriaLabel: '下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc 键',
            },
          },
        },
      },
    },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: { dateStyle: 'medium' },
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    langMenuLabel: '语言',
    externalLinkIcon: true,
    notFound: {
      title: '页面不存在',
      quote: '这个地址没有内容，回到首页或快速上手看看。',
      linkLabel: '回到首页',
      linkText: '回到首页',
    },
    footer: {
      message: `GPL-3.0-only 开源 · <a href="${THIRD_PARTY_URL}" target="_blank" rel="noopener">第三方组件声明</a>`,
      copyright: '© AirSnip',
    },
  },
})
