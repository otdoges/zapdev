import { NextRequest, NextResponse } from 'next/server';

// Function to sanitize smart quotes and other problematic characters
function sanitizeQuotes(text: string): string {
  return text
    // Replace smart single quotes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Replace smart double quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Replace other quote-like characters
    .replace(/[\u00AB\u00BB]/g, '"') // Guillemets
    .replace(/[\u2039\u203A]/g, "'") // Single guillemets
    // Replace other problematic characters
    .replace(/[\u2013\u2014]/g, '-') // En dash and em dash
    .replace(/[\u2026]/g, '...') // Ellipsis
    .replace(/[\u00A0]/g, ' '); // Non-breaking space
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 });
    }
    
    // Early guard: if input is not a valid http/https URL, do NOT call Firecrawl
    try {
      const test = new URL(url);
      if (test.protocol !== 'http:' && test.protocol !== 'https:') {
        return NextResponse.json({
          success: false,
          error: 'Invalid URL protocol'
        }, { status: 400 });
      }
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL'
      }, { status: 400 });
    }
    
    console.log('[scrape-url-enhanced] Scraping with Firecrawl:', url);
    
    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not set');
    }
    
    // Make request to Firecrawl API with maxAge for 500% faster scraping
    const payload = {
      url,
      formats: ['markdown', 'html', 'screenshot'],
      waitFor: 3000,
      timeout: 30000,
      blockAds: true,
      maxAge: 3600000, // Use cached data if less than 1 hour old (500% faster!)
      actions: [
        {
          type: 'wait',
          milliseconds: 2000
        },
        {
          type: 'screenshot',
          fullPage: false // Just visible viewport for performance
        }
      ]
    };
    
    console.log('[scrape-url-enhanced] Request payload:', JSON.stringify(payload, null, 2));
    
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('[scrape-url-enhanced] Response status:', firecrawlResponse.status);
    console.log('[scrape-url-enhanced] Response headers:', Object.fromEntries(firecrawlResponse.headers.entries()));
    
    if (!firecrawlResponse.ok) {
      const error = await firecrawlResponse.text();
      console.error('[scrape-url-enhanced] Firecrawl error response:', error);
      throw new Error(`Firecrawl API error: ${error}`);
    }
    
    const data = await firecrawlResponse.json();
    console.log('[scrape-url-enhanced] Response data keys:', Object.keys(data));
    console.log('[scrape-url-enhanced] Success:', data.success);
    console.log('[scrape-url-enhanced] Has data:', !!data.data);
    
    if (!data.success || !data.data) {
      console.error('[scrape-url-enhanced] Invalid response structure:', JSON.stringify(data, null, 2));
      throw new Error('Failed to scrape content');
    }
    
    const { markdown, metadata, screenshot, actions } = data.data;
    // html available but not used in current implementation
    
    // Get screenshot from either direct field or actions result
    const screenshotUrl = screenshot || actions?.screenshots?.[0] || null;
    
    // Sanitize the markdown content
    const sanitizedMarkdown = sanitizeQuotes(markdown || '');
    
    // Extract structured data from the response
    const title = metadata?.title || '';
    const description = metadata?.description || '';
    
    // Format content for AI
    const formattedContent = `
Title: ${sanitizeQuotes(title)}
Description: ${sanitizeQuotes(description)}
URL: ${url}

Main Content:
${sanitizedMarkdown}
    `.trim();
    
    return NextResponse.json({
      success: true,
      url,
      content: formattedContent,
      screenshot: screenshotUrl,
      structured: {
        title: sanitizeQuotes(title),
        description: sanitizeQuotes(description),
        content: sanitizedMarkdown,
        url,
        screenshot: screenshotUrl
      },
      metadata: {
        scraper: 'firecrawl-enhanced',
        timestamp: new Date().toISOString(),
        contentLength: formattedContent.length,
        cached: data.data.cached || false, // Indicates if data came from cache
        ...metadata
      },
      message: 'URL scraped successfully with Firecrawl (with caching for 500% faster performance)'
    });
    
  } catch (error) {
    console.error('[scrape-url-enhanced] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}