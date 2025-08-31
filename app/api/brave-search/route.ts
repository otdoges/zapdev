/**
 * DEPRECATED: Brave Search API Route
 * 
 * This API route is maintained for backwards compatibility but is deprecated.
 * New implementations should use /api/search/query which provides AI-enhanced results.
 * 
 * This route now uses the internal search service for consistency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getInternalBraveSearch } from '@/lib/search/internal-brave-search';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, count = 10, offset = 0 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Use the new internal search service for consistency
    const internalSearch = getInternalBraveSearch();
    
    try {
      const searchResult = await internalSearch.search(query, {
        count,
        offset,
        language: 'en',
        country: 'US',
        safesearch: 'moderate'
      });

      // Return in the legacy format for backwards compatibility
      return NextResponse.json({
        success: true,
        results: searchResult.results,
        query: searchResult.query,
        mixed: searchResult.mixed || null,
        // Add deprecation notice
        _deprecated: true,
        _notice: 'This API is deprecated. Please use /api/search/query for enhanced AI-powered search.',
        _newEndpoint: '/api/search/query'
      });

    } catch (searchError) {
      console.error('Internal search error:', searchError);
      return NextResponse.json(
        { error: 'Search service unavailable', status: 503 },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Brave search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}