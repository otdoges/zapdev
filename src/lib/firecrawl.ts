import * as Sentry from '@sentry/react'

const { logger } = Sentry

// Secure HTML text sanitization function
function sanitizeHtmlText(htmlString: string): string {
  if (!htmlString) return ''
  
  // More robust HTML tag removal that handles edge cases
  return htmlString
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags with content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags with content
    .replace(/<[^>]+>/g, '') // Remove all remaining HTML tags
    .replace(/&[#\w]+;/g, (entity) => { // Decode common HTML entities
      const entities: { [key: string]: string } = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' '
      }
      const safeEntities = entities;
      return safeEntities[entity] || entity;
    })
    .trim()
    .substring(0, 500) // Limit length for safety
}

interface NavigationItem {
  index: number
  type: string
  links: Array<{
    href: string
    text: string
  }>
}

interface HeadingInfo {
  level: number
  text: string
}

interface AssetInfo {
  images: string[]
  stylesheets: string[]
  scripts: string[]
  fonts: string[]
}

export interface FirecrawlOptions {
  maxPages?: number
  includeSitemap?: boolean
  includeSubdomains?: boolean
}

export interface FirecrawlPageResult {
  url: string
  title?: string
  content?: string
  markdown?: string
  html?: string
  metadata?: Record<string, unknown>
  screenshot?: string
}

export interface FirecrawlCrawlResult {
  pages: FirecrawlPageResult[]
  totalPages: number
  crawlTime: number
}

export interface WebsiteAnalysis {
  url: string
  title?: string
  description?: string
  pages: FirecrawlPageResult[]
  technologies?: string[]
  layout?: string
  colorScheme?: string[]
  components?: string[]
  designPatterns?: string[]
  navigationStructure?: NavigationItem[]
  assets?: AssetInfo
  seo?: {
    metaTags: string[]
    headings: HeadingInfo[]
    imageAlts: string[]
  }
  performance?: {
    pageCount: number
    avgLoadTime: number
    hasLazyLoading: boolean
    hasCaching: boolean
  }
}

function getApiKey(): string {
  const key = import.meta.env.VITE_FIRECRAWL_API_KEY || ''
  if (!key) {
    throw new Error('Firecrawl API key not configured. Set VITE_FIRECRAWL_API_KEY in your environment.')
  }
  return key
}

export async function crawlSite(url: string, options: FirecrawlOptions = {}): Promise<FirecrawlCrawlResult> {
  const startTime = Date.now()
  
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP/HTTPS URLs are supported')
    }
  } catch (e) {
    throw new Error('Invalid URL')
  }

  const apiKey = getApiKey()

  const body: Record<string, unknown> = {
    url,
    limits: {
      maxPages: Math.min(Math.max(options.maxPages ?? 10, 1), 50),
    },
    formats: ['markdown', 'html', 'screenshot'],
    includeTags: ['title', 'meta', 'links', 'images'],
    excludeTags: ['script', 'style'],
    include_sitemap: options.includeSitemap ?? true,
    include_subdomains: options.includeSubdomains ?? false,
    waitFor: 2000, // Wait for dynamic content
    screenshot: true,
    fullPageScreenshot: true,
  }

  logger.info('Starting Firecrawl crawl', { url, options: body })

  // Firecrawl REST API
  const endpoint = 'https://api.firecrawl.dev/v1/crawl'

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    logger.error('Firecrawl crawl failed', { status: res.status, text })
    throw new Error(`Firecrawl error: ${res.status} - ${text}`)
  }

  const data = await res.json() as { 
    pages?: Array<{ 
      url: string
      title?: string
      content?: string
      markdown?: string
      html?: string
      metadata?: Record<string, unknown>
      screenshot?: string
    }>
    totalPages?: number
  }

  const pages: FirecrawlPageResult[] = (data.pages || []).map(p => ({
    url: p.url,
    title: p.title,
    content: p.content,
    markdown: p.markdown,
    html: p.html,
    metadata: p.metadata,
    screenshot: p.screenshot,
  }))

  const crawlTime = Date.now() - startTime
  logger.info('Firecrawl crawl completed', { url, pageCount: pages.length, crawlTime })
  
  return { 
    pages, 
    totalPages: data.totalPages || pages.length,
    crawlTime 
  }
}

// Enhanced single page scraping with detailed analysis
export async function scrapePage(url: string): Promise<FirecrawlPageResult> {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP/HTTPS URLs are supported')
    }
  } catch (e) {
    throw new Error('Invalid URL')
  }

  const apiKey = getApiKey()

  const body = {
    url,
    formats: ['markdown', 'html', 'screenshot'],
    includeTags: ['title', 'meta', 'links', 'images', 'forms'],
    excludeTags: ['script'],
    waitFor: 3000,
    screenshot: true,
    fullPageScreenshot: true,
    extractorOptions: {
      mode: 'llm-extraction',
      extractionPrompt: 'Extract the main content, navigation structure, key components, design patterns, color scheme, and technologies used'
    }
  }

  logger.info('Starting Firecrawl page scrape', { url })

  const endpoint = 'https://api.firecrawl.dev/v1/scrape'

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    logger.error('Firecrawl scrape failed', { status: res.status, text })
    throw new Error(`Firecrawl scrape error: ${res.status} - ${text}`)
  }

  const data = await res.json() as {
    url: string
    title?: string
    content?: string
    markdown?: string
    html?: string
    metadata?: Record<string, unknown>
    screenshot?: string
  }

  logger.info('Firecrawl page scrape completed', { url, title: data.title })

  return {
    url: data.url,
    title: data.title,
    content: data.content,
    markdown: data.markdown,
    html: data.html,
    metadata: data.metadata,
    screenshot: data.screenshot,
  }
}

// Comprehensive website analysis for cloning
export async function crawlWebsite(url: string, options: FirecrawlOptions = {}): Promise<WebsiteAnalysis> {
  logger.info('Starting comprehensive website analysis', { url })
  
  // First, scrape the main page for detailed analysis
  const mainPage = await scrapePage(url)
  
  // Then crawl the site for additional pages
  const crawlResult = await crawlSite(url, { 
    maxPages: options.maxPages || 10,
    includeSitemap: options.includeSitemap ?? true,
    includeSubdomains: options.includeSubdomains ?? false 
  })

  // Analyze the content for technologies, patterns, and structure
  const analysis = await analyzeWebsiteContent(mainPage, crawlResult.pages)
  
  const websiteAnalysis: WebsiteAnalysis = {
    url,
    title: mainPage.title || mainPage.metadata?.title,
    description: mainPage.metadata?.description || mainPage.metadata?.ogDescription,
    pages: [mainPage, ...crawlResult.pages.filter(p => p.url !== url)],
    technologies: analysis.technologies,
    layout: analysis.layout,
    colorScheme: analysis.colorScheme,
    components: analysis.components,
    designPatterns: analysis.designPatterns,
    navigationStructure: analysis.navigationStructure,
    assets: analysis.assets,
    seo: analysis.seo,
    performance: {
      pageCount: crawlResult.totalPages,
      avgLoadTime: crawlResult.crawlTime / crawlResult.totalPages,
      hasLazyLoading: analysis.hasLazyLoading,
      hasCaching: analysis.hasCaching,
    }
  }

  logger.info('Website analysis completed', { 
    url, 
    pageCount: websiteAnalysis.pages.length,
    technologies: websiteAnalysis.technologies?.length 
  })

  return websiteAnalysis
}

// AI-powered content analysis
async function analyzeWebsiteContent(mainPage: FirecrawlPageResult, allPages: FirecrawlPageResult[]) {
  const combinedContent = [mainPage, ...allPages]
    .map(p => p.content || p.markdown || '')
    .join('\n\n')
  
  const combinedHtml = [mainPage, ...allPages]
    .map(p => p.html || '')
    .join('\n\n')

  return {
    technologies: detectTechnologies(combinedHtml, combinedContent),
    layout: analyzeLayoutPatterns(combinedHtml),
    colorScheme: extractColorScheme(combinedHtml),
    components: identifyUIComponents(combinedHtml, combinedContent),
    designPatterns: detectDesignPatterns(combinedHtml, combinedContent),
    navigationStructure: extractNavigationStructure(combinedHtml),
    assets: extractAssets(combinedHtml),
    seo: analyzeSEO(mainPage),
    hasLazyLoading: combinedHtml.includes('loading="lazy"') || combinedHtml.includes('data-src'),
    hasCaching: combinedHtml.includes('service-worker') || combinedHtml.includes('cache'),
  }
}

function detectTechnologies(html: string, content: string): string[] {
  const technologies: string[] = []
  const htmlLower = html.toLowerCase()
  const contentLower = content.toLowerCase()

  // Frontend Frameworks
  if (htmlLower.includes('react') || htmlLower.includes('__react') || htmlLower.includes('_reactinternalinstance')) {
    technologies.push('React')
  }
  if (htmlLower.includes('vue') || htmlLower.includes('__vue')) {
    technologies.push('Vue.js')
  }
  if (htmlLower.includes('angular') || htmlLower.includes('ng-')) {
    technologies.push('Angular')
  }
  if (htmlLower.includes('svelte')) {
    technologies.push('Svelte')
  }

  // CSS Frameworks
  if (htmlLower.includes('bootstrap') || htmlLower.includes('btn-primary')) {
    technologies.push('Bootstrap')
  }
  if (htmlLower.includes('tailwind') || htmlLower.includes('tw-')) {
    technologies.push('Tailwind CSS')
  }
  if (htmlLower.includes('bulma')) {
    technologies.push('Bulma')
  }
  if (htmlLower.includes('foundation')) {
    technologies.push('Foundation')
  }

  // Meta Frameworks
  if (htmlLower.includes('next.js') || htmlLower.includes('__next_data__') || htmlLower.includes('_next/')) {
    technologies.push('Next.js')
  }
  if (htmlLower.includes('nuxt') || htmlLower.includes('__nuxt')) {
    technologies.push('Nuxt.js')
  }
  if (htmlLower.includes('gatsby') || htmlLower.includes('___gatsby')) {
    technologies.push('Gatsby')
  }

  // Libraries
  if (htmlLower.includes('jquery') || htmlLower.includes('$')) {
    technologies.push('jQuery')
  }
  if (htmlLower.includes('lodash') || htmlLower.includes('underscore')) {
    technologies.push('Lodash/Underscore')
  }
  if (htmlLower.includes('gsap') || htmlLower.includes('greensock')) {
    technologies.push('GSAP')
  }
  if (htmlLower.includes('three.js') || htmlLower.includes('threejs')) {
    technologies.push('Three.js')
  }

  // Analytics & Tools
  if (htmlLower.includes('google-analytics') || htmlLower.includes('gtag')) {
    technologies.push('Google Analytics')
  }
  if (htmlLower.includes('hotjar')) {
    technologies.push('Hotjar')
  }
  if (htmlLower.includes('mixpanel')) {
    technologies.push('Mixpanel')
  }

  return [...new Set(technologies)]
}

function analyzeLayoutPatterns(html: string): string {
  const htmlLower = html.toLowerCase()
  
  if (htmlLower.includes('display: grid') || htmlLower.includes('grid-template')) {
    return 'CSS Grid'
  }
  if (htmlLower.includes('display: flex') || htmlLower.includes('flex-direction')) {
    return 'Flexbox'
  }
  if (htmlLower.includes('container') && htmlLower.includes('row') && htmlLower.includes('col')) {
    return 'Bootstrap Grid'
  }
  if (htmlLower.includes('position: absolute') || htmlLower.includes('position: fixed')) {
    return 'Absolute Positioning'
  }
  
  return 'Flow Layout'
}

function extractColorScheme(html: string): string[] {
  const colors: string[] = []
  
  // Extract hex colors
  const hexMatches = html.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/g)
  if (hexMatches) {
    colors.push(...hexMatches)
  }
  
  // Extract RGB colors
  const rgbMatches = html.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g)
  if (rgbMatches) {
    colors.push(...rgbMatches)
  }
  
  // Extract RGBA colors
  const rgbaMatches = html.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g)
  if (rgbaMatches) {
    colors.push(...rgbaMatches)
  }
  
  return [...new Set(colors)].slice(0, 20)
}

function identifyUIComponents(html: string, content: string): string[] {
  const components: string[] = []
  const htmlLower = html.toLowerCase()
  const contentLower = content.toLowerCase()
  
  // Navigation
  if (htmlLower.includes('<nav') || htmlLower.includes('navbar') || htmlLower.includes('navigation')) {
    components.push('Navigation Bar')
  }
  
  // Layout Components
  if (htmlLower.includes('<header')) {
    components.push('Header')
  }
  if (htmlLower.includes('<footer')) {
    components.push('Footer')
  }
  if (htmlLower.includes('sidebar') || htmlLower.includes('aside')) {
    components.push('Sidebar')
  }
  
  // Interactive Components
  if (htmlLower.includes('carousel') || htmlLower.includes('slider') || htmlLower.includes('swiper')) {
    components.push('Carousel/Slider')
  }
  if (htmlLower.includes('modal') || htmlLower.includes('dialog') || htmlLower.includes('popup')) {
    components.push('Modal/Dialog')
  }
  if (htmlLower.includes('dropdown') || htmlLower.includes('select')) {
    components.push('Dropdown')
  }
  if (htmlLower.includes('accordion') || htmlLower.includes('collapse')) {
    components.push('Accordion')
  }
  if (htmlLower.includes('tab') && htmlLower.includes('panel')) {
    components.push('Tabs')
  }
  
  // Form Components
  if (htmlLower.includes('<form') || htmlLower.includes('input') || htmlLower.includes('button')) {
    components.push('Forms')
  }
  if (htmlLower.includes('search') || htmlLower.includes('type="search"')) {
    components.push('Search')
  }
  
  // Content Components
  if (htmlLower.includes('card') || contentLower.includes('card')) {
    components.push('Cards')
  }
  if (htmlLower.includes('<table') || htmlLower.includes('data-table')) {
    components.push('Tables')
  }
  if (htmlLower.includes('gallery') || htmlLower.includes('image-grid')) {
    components.push('Image Gallery')
  }
  if (htmlLower.includes('testimonial') || contentLower.includes('testimonial')) {
    components.push('Testimonials')
  }
  if (htmlLower.includes('pricing') || contentLower.includes('pricing')) {
    components.push('Pricing Tables')
  }
  
  return [...new Set(components)]
}

function detectDesignPatterns(html: string, content: string): string[] {
  const patterns: string[] = []
  const htmlLower = html.toLowerCase()
  const contentLower = content.toLowerCase()
  
  // Layout Patterns
  if (htmlLower.includes('hero') || contentLower.includes('hero section')) {
    patterns.push('Hero Section')
  }
  if (contentLower.includes('call to action') || htmlLower.includes('cta')) {
    patterns.push('Call to Action')
  }
  if (contentLower.includes('feature') && contentLower.includes('grid')) {
    patterns.push('Feature Grid')
  }
  if (contentLower.includes('testimonial') || contentLower.includes('review')) {
    patterns.push('Social Proof')
  }
  if (contentLower.includes('newsletter') || contentLower.includes('subscribe')) {
    patterns.push('Newsletter Signup')
  }
  
  // Design Patterns
  if (htmlLower.includes('sticky') || htmlLower.includes('fixed')) {
    patterns.push('Sticky Elements')
  }
  if (htmlLower.includes('parallax') || htmlLower.includes('scroll')) {
    patterns.push('Parallax Scrolling')
  }
  if (htmlLower.includes('gradient') || htmlLower.includes('linear-gradient')) {
    patterns.push('Gradients')
  }
  if (htmlLower.includes('shadow') || htmlLower.includes('box-shadow')) {
    patterns.push('Drop Shadows')
  }
  if (htmlLower.includes('border-radius') || htmlLower.includes('rounded')) {
    patterns.push('Rounded Corners')
  }
  
  return [...new Set(patterns)]
}

function extractNavigationStructure(html: string): NavigationItem[] {
  const navigation: NavigationItem[] = []
  
  // Extract navigation links
  const navRegex = /<nav[^>]*>(.*?)<\/nav>/gis
  const navMatches = html.match(navRegex)
  
  if (navMatches) {
    navMatches.forEach((nav, index) => {
      const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi
      const links: Array<{ href: string; text: string }> = []
      let linkMatch
      
      while ((linkMatch = linkRegex.exec(nav)) !== null) {
        links.push({
          href: linkMatch[1],
          text: sanitizeHtmlText(linkMatch[2])
        })
      }
      
      navigation.push({
        index,
        type: 'navigation',
        links
      })
    })
  }
  
  return navigation
}

function extractAssets(html: string): AssetInfo {
  const assets = {
    images: [] as string[],
    stylesheets: [] as string[],
    scripts: [] as string[],
    fonts: [] as string[]
  }
  
  // Extract images
  const imgRegex = /<img[^>]*src=["']([^"']*)[^>]*>/gi
  let imgMatch
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    assets.images.push(imgMatch[1])
  }
  
  // Extract stylesheets
  const cssRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*)[^>]*>/gi
  let cssMatch
  while ((cssMatch = cssRegex.exec(html)) !== null) {
    assets.stylesheets.push(cssMatch[1])
  }
  
  // Extract scripts
  const scriptRegex = /<script[^>]*src=["']([^"']*)[^>]*>/gi
  let scriptMatch
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    assets.scripts.push(scriptMatch[1])
  }
  
  // Extract fonts
  const fontRegex = /font-family:\s*["']([^"']*)[^;]*/gi
  let fontMatch
  while ((fontMatch = fontRegex.exec(html)) !== null) {
    assets.fonts.push(fontMatch[1])
  }
  
  return {
    images: [...new Set(assets.images)].slice(0, 50),
    stylesheets: [...new Set(assets.stylesheets)],
    scripts: [...new Set(assets.scripts)],
    fonts: [...new Set(assets.fonts)]
  }
}

function analyzeSEO(page: FirecrawlPageResult): { metaTags: string[]; headings: HeadingInfo[]; imageAlts: string[] } {
  const html = page.html || ''
  
  // Extract meta tags
  const metaTags: string[] = []
  const metaRegex = /<meta[^>]*>/gi
  let metaMatch
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    metaTags.push(metaMatch[0])
  }
  
  // Extract headings
  const headings: HeadingInfo[] = []
  for (let i = 1; i <= 6; i++) {
    const headingRegex = new RegExp(`<h${i}[^>]*>(.*?)</h${i}>`, 'gi')
    let headingMatch
    while ((headingMatch = headingRegex.exec(html)) !== null) {
      headings.push({
        level: i,
        text: sanitizeHtmlText(headingMatch[1])
      })
    }
  }
  
  // Extract image alt texts
  const imageAlts: string[] = []
  const altRegex = /<img[^>]*alt=["']([^"']*)[^>]*>/gi
  let altMatch
  while ((altMatch = altRegex.exec(html)) !== null) {
    imageAlts.push(altMatch[1])
  }
  
  return {
    metaTags,
    headings,
    imageAlts: [...new Set(imageAlts)]
  }
}
