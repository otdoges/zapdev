import * as Sentry from '@sentry/react';

const { logger } = Sentry;

// Brave Search API types
export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  published?: string;
  thumbnail?: {
    src: string;
  };
}

export interface BraveSearchResponse {
  web: {
    type: string;
    results: BraveSearchResult[];
  };
}

export interface SearchOptions {
  count?: number;
  offset?: number;
  country?: string;
  search_lang?: string;
  ui_lang?: string;
  safesearch?: 'strict' | 'moderate' | 'off';
  freshness?: 'pd' | 'pw' | 'pm' | 'py';
}

export interface WebsiteAnalysis {
  url: string;
  title?: string;
  description?: string;
  technologies?: string[];
  layout?: string;
  colorScheme?: string[];
  components?: string[];
  content?: string;
}

// Input validation
const validateSearchQuery = (query: string): { isValid: boolean; error?: string } => {
  if (!query || query.trim().length === 0) {
    return { isValid: false, error: 'Search query cannot be empty' };
  }
  if (query.length > 400) {
    return { isValid: false, error: 'Search query too long (max 400 characters)' };
  }
  // Basic XSS prevention
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(query)) {
      return { isValid: false, error: 'Invalid characters in search query' };
    }
  }
  
  return { isValid: true };
};

// Sanitize search query
const sanitizeQuery = (query: string): string => {
  return query
    .replace(/[<>'"]/g, '')
    .trim()
    .substring(0, 400);
};

// Brave Search API client
export class BraveSearchService {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_BRAVE_SEARCH_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('Brave Search API key not configured');
    }
  }

  async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<BraveSearchResult[]> {
    const validation = validateSearchQuery(query);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    if (!this.apiKey) {
      throw new Error('Brave Search API key not configured');
    }

    const sanitizedQuery = sanitizeQuery(query);
    const searchParams = new URLSearchParams({
      q: sanitizedQuery,
      count: (options.count || 10).toString(),
      offset: (options.offset || 0).toString(),
      country: options.country || 'us',
      search_lang: options.search_lang || 'en',
      ui_lang: options.ui_lang || 'en',
      safesearch: options.safesearch || 'moderate',
      ...(options.freshness && { freshness: options.freshness }),
    });

    try {
      logger.info('Performing Brave search', { 
        query: sanitizedQuery, 
        options: { ...options, count: options.count || 10 } 
      });

      const response = await fetch(
        `${this.baseUrl}/web/search?${searchParams}`, 
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Brave Search API error', { 
          status: response.status, 
          error: errorText,
          query: sanitizedQuery 
        });
        
        if (response.status === 429) {
          throw new Error('Search rate limit exceeded. Please try again later.');
        } else if (response.status === 401) {
          throw new Error('Invalid Brave Search API key');
        } else if (response.status === 403) {
          throw new Error('Brave Search API access denied');
        } else {
          throw new Error(`Search failed with status ${response.status}`);
        }
      }

      const data: BraveSearchResponse = await response.json();
      
      if (!data.web?.results) {
        logger.warn('No search results returned', { query: sanitizedQuery });
        return [];
      }

      const results = data.web.results.slice(0, options.count || 10);
      logger.info('Brave search completed', { 
        query: sanitizedQuery, 
        resultCount: results.length 
      });

      return results;
    } catch (error) {
      logger.error('Brave search error', { 
        error: error instanceof Error ? error.message : String(error),
        query: sanitizedQuery 
      });
      
      Sentry.captureException(error, {
        tags: { operation: 'brave_search' },
        extra: { query: sanitizedQuery, options }
      });
      
      throw error;
    }
  }

  async analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
    // Validate URL
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
      }
    } catch (error) {
      throw new Error('Invalid URL format');
    }

    try {
      logger.info('Analyzing website', { url });

      // Fetch website content
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'ZapDev Website Analyzer/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse HTML content (basic analysis)
      const analysis: WebsiteAnalysis = {
        url,
        title: this.extractTitle(html),
        description: this.extractDescription(html),
        technologies: this.detectTechnologies(html),
        layout: this.analyzeLayout(html),
        colorScheme: this.extractColors(html),
        components: this.identifyComponents(html),
        content: this.extractTextContent(html).substring(0, 2000), // Limit content
      };

      logger.info('Website analysis completed', { 
        url, 
        title: analysis.title,
        technologiesCount: analysis.technologies?.length 
      });

      return analysis;
    } catch (error) {
      logger.error('Website analysis error', { 
        error: error instanceof Error ? error.message : String(error),
        url 
      });
      
      Sentry.captureException(error, {
        tags: { operation: 'website_analysis' },
        extra: { url }
      });
      
      throw error;
    }
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  private extractDescription(html: string): string {
    const descMatch = html.match(/<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i);
    return descMatch ? descMatch[1].trim() : '';
  }

  private detectTechnologies(html: string): string[] {
    const technologies: string[] = [];
    
    // Check for common frameworks and libraries
    if (html.includes('react')) technologies.push('React');
    if (html.includes('vue')) technologies.push('Vue.js');
    if (html.includes('angular')) technologies.push('Angular');
    if (html.includes('bootstrap')) technologies.push('Bootstrap');
    if (html.includes('tailwind')) technologies.push('Tailwind CSS');
    if (html.includes('jquery')) technologies.push('jQuery');
    if (html.includes('next.js') || html.includes('__NEXT_DATA__')) technologies.push('Next.js');
    if (html.includes('nuxt')) technologies.push('Nuxt.js');
    if (html.includes('gatsby')) technologies.push('Gatsby');
    
    return technologies;
  }

  private analyzeLayout(html: string): string {
    // Simple layout analysis
    if (html.includes('grid') || html.includes('display: grid')) {
      return 'CSS Grid';
    } else if (html.includes('flex') || html.includes('display: flex')) {
      return 'Flexbox';
    } else if (html.includes('container') || html.includes('row') || html.includes('col')) {
      return 'Bootstrap Grid';
    }
    return 'Traditional Layout';
  }

  private extractColors(html: string): string[] {
    const colors: string[] = [];
    const colorRegex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/g;
    const matches = html.match(colorRegex);
    
    if (matches) {
      // Remove duplicates and limit to 10 colors
      return [...new Set(matches)].slice(0, 10);
    }
    
    return colors;
  }

  private identifyComponents(html: string): string[] {
    const components: string[] = [];
    
    // Check for common UI components
    if (html.includes('navbar') || html.includes('navigation')) components.push('Navigation');
    if (html.includes('header')) components.push('Header');
    if (html.includes('footer')) components.push('Footer');
    if (html.includes('sidebar')) components.push('Sidebar');
    if (html.includes('carousel') || html.includes('slider')) components.push('Carousel/Slider');
    if (html.includes('modal') || html.includes('dialog')) components.push('Modal');
    if (html.includes('form')) components.push('Forms');
    if (html.includes('button')) components.push('Buttons');
    if (html.includes('card')) components.push('Cards');
    if (html.includes('table')) components.push('Tables');
    
    return components;
  }

  private extractTextContent(html: string): string {
    // Remove HTML tags and get text content
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Export singleton instance
export const braveSearchService = new BraveSearchService();