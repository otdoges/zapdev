import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkSearchRateLimit, consumeSearchRateLimit } from '@/lib/search/rate-limiter';
import { getAISearchProcessor, SearchContext } from '@/lib/search/ai-search-processor';
import { getSearchCache } from '@/lib/search/search-cache';

/**
 * User-friendly search API endpoint
 * 
 * This endpoint provides users with AI-processed, enhanced search results
 * while handling rate limiting, caching, and subscription management.
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { 
      query, 
      searchType = 'smart',
      context = {}
    }: {
      query: string;
      searchType?: 'smart' | 'deep' | 'quick';
      context?: SearchContext;
    } = await req.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Search query is required',
        code: 'QUERY_REQUIRED'
      }, { status: 400 });
    }

    if (query.trim().length > 500) {
      return NextResponse.json({ 
        error: 'Search query is too long (max 500 characters)',
        code: 'QUERY_TOO_LONG'
      }, { status: 400 });
    }

    // Check rate limiting with subscription integration
    const searchTypeForLimiting = searchType === 'deep' ? 'deep' : 'standard';
    const rateLimitResult = await checkSearchRateLimit(searchTypeForLimiting);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        error: rateLimitResult.reason || 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.resetTime,
        remaining: rateLimitResult.remaining,
        upgradeAvailable: rateLimitResult.reason?.includes('free')
      }, { status: 429 });
    }

    // Check cache first
    const cache = getSearchCache();
    const cacheKey = `${userId}:${query}:${searchType}`;
    
    let cachedResult = null;
    try {
      cachedResult = cache.get(cacheKey, { searchType: 'web' });
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    if (cachedResult) {
      // Return cached result with rate limit headers
      const response = NextResponse.json({
        success: true,
        cached: true,
        ...cachedResult,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        }
      });

      // Add rate limit headers
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toISOString());
      
      return response;
    }

    // Perform AI-enhanced search
    const processor = getAISearchProcessor();
    
    let searchResult;
    const startTime = Date.now();
    
    try {
      switch (searchType) {
        case 'deep':
          searchResult = await processor.deepSearch(query.trim(), context);
          break;
        case 'quick':
          searchResult = await processor.processSearch(query.trim(), {
            ...context,
            // Quick search uses fewer results for speed
          });
          break;
        case 'smart':
        default:
          searchResult = await processor.processSearch(query.trim(), context);
          break;
      }
    } catch (searchError) {
      console.error('Search processing error:', searchError);
      return NextResponse.json({
        error: 'Search processing failed. Please try again.',
        code: 'SEARCH_PROCESSING_ERROR'
      }, { status: 500 });
    }

    const processingTime = Date.now() - startTime;

    // Consume rate limit after successful search
    try {
      await consumeSearchRateLimit(searchTypeForLimiting);
    } catch (error) {
      console.warn('Rate limit consumption error:', error);
    }

    // Cache the result
    try {
      cache.set(cacheKey, searchResult, { searchType: 'web' });
    } catch (error) {
      console.warn('Cache write error:', error);
    }

    // Prepare response with additional metadata
    const response = NextResponse.json({
      success: true,
      cached: false,
      processingTime,
      ...searchResult,
      rateLimit: {
        remaining: rateLimitResult.remaining - 1,
        resetTime: rateLimitResult.resetTime
      },
      metadata: {
        searchType,
        userId: userId.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
        version: '2.0'
      }
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', (rateLimitResult.remaining - 1).toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toISOString());
    response.headers.set('X-Search-Processing-Time', processingTime.toString());
    
    return response;

  } catch (error) {
    console.error('Search API error:', error);
    
    // Determine appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({
          error: 'Search service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE'
        }, { status: 503 });
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED'
        }, { status: 429 });
      }
    }

    return NextResponse.json({
      error: 'Internal server error occurred',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

/**
 * Get search usage statistics for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'usage') {
      // Get usage statistics
      const rateLimitResult = await checkSearchRateLimit();
      const cache = getSearchCache();
      const cacheStats = cache.getStats();

      return NextResponse.json({
        success: true,
        usage: {
          remaining: rateLimitResult.remaining,
          current: rateLimitResult.current,
          resetTime: rateLimitResult.resetTime,
          subscriptionTier: 'free' // TODO: Get from user profile
        },
        cache: {
          hitRate: cacheStats.hitRate,
          totalQueries: cacheStats.hits + cacheStats.misses
        }
      });
    }

    if (action === 'suggestions') {
      // Get popular search queries for suggestions
      const cache = getSearchCache();
      const popularQueries = cache.getPopularQueries(10);
      
      return NextResponse.json({
        success: true,
        suggestions: popularQueries.map(q => ({
          query: q.query,
          popularity: q.count
        }))
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action parameter',
      validActions: ['usage', 'suggestions']
    }, { status: 400 });

  } catch (error) {
    console.error('Search stats API error:', error);
    return NextResponse.json({
      error: 'Failed to get search statistics'
    }, { status: 500 });
  }
}