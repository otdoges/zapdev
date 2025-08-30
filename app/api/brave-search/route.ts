import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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

    const braveApiKey = process.env.BRAVE_API_KEY;
    if (!braveApiKey) {
      return NextResponse.json({ error: 'Brave API key not configured' }, { status: 500 });
    }

    // Make request to Brave Search API
    const braveUrl = new URL('https://api.search.brave.com/res/v1/web/search');
    braveUrl.searchParams.set('q', query);
    braveUrl.searchParams.set('count', count.toString());
    braveUrl.searchParams.set('offset', offset.toString());
    braveUrl.searchParams.set('search_lang', 'en');
    braveUrl.searchParams.set('country', 'US');
    braveUrl.searchParams.set('safesearch', 'moderate');

    const response = await fetch(braveUrl.toString(), {
      method: 'GET',
      headers: {
        'X-Subscription-Token': braveApiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Brave API error:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Failed to search', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      results: data.web?.results || [],
      query: data.query,
      mixed: data.mixed || null,
    });

  } catch (error) {
    console.error('Brave search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}