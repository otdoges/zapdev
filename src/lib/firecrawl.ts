import * as Sentry from '@sentry/react'

const { logger } = Sentry

export interface FirecrawlOptions {
  maxPages?: number
  includeSitemap?: boolean
  includeSubdomains?: boolean
}

export interface FirecrawlPageResult {
  url: string
  title?: string
  content?: string
}

export interface FirecrawlCrawlResult {
  pages: FirecrawlPageResult[]
}

function getApiKey(): string {
  const key = import.meta.env.VITE_FIRECRAWL_API_KEY || ''
  if (!key) {
    throw new Error('Firecrawl API key not configured. Set VITE_FIRECRAWL_API_KEY in your environment.')
  }
  return key
}

export async function crawlSite(url: string, options: FirecrawlOptions = {}): Promise<FirecrawlCrawlResult> {
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
      maxPages: Math.min(Math.max(options.maxPages ?? 10, 1), 100),
    },
    include_sitemap: options.includeSitemap ?? true,
    include_subdomains: options.includeSubdomains ?? false,
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
    throw new Error(`Firecrawl error: ${res.status}`)
  }

  const data = await res.json() as { pages?: Array<{ url: string; title?: string; content?: string }> }

  const pages: FirecrawlPageResult[] = (data.pages || []).map(p => ({
    url: p.url,
    title: p.title,
    content: p.content,
  }))

  logger.info('Firecrawl crawl completed', { url, pageCount: pages.length })
  return { pages }
}

