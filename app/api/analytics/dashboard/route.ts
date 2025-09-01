import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface AnalyticsQuery {
  siteId: string;
  timeRange?: '24h' | '7d' | '30d' | '90d';
  page?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AnalyticsQuery = await request.json();
    const { siteId, timeRange = '7d', page } = body;

    if (!siteId) {
      return NextResponse.json({ 
        error: 'Site ID is required' 
      }, { status: 400 });
    }

    // TODO: Verify user owns this site
    // const site = await convex.query(api.deployments.getDeployment, { siteId, userId });
    // if (!site) {
    //   return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    // }

    // Calculate time range
    const now = Date.now();
    const timeRanges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };
    const startTime = now - timeRanges[timeRange];

    // TODO: Query analytics data from Convex
    // This would normally query the siteAnalytics table
    const analytics = await getAnalyticsData(siteId, startTime, now, page);

    return NextResponse.json({
      success: true,
      data: analytics,
      timeRange,
      siteId,
    });

  } catch (error) {
    console.error('[analytics] Failed to get dashboard data:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

async function getAnalyticsData(
  siteId: string, 
  startTime: number, 
  endTime: number, 
  page?: string
) {
  // TODO: Replace with actual Convex queries
  // For now, return mock data structure
  
  // This would normally be:
  // const events = await convex.query(api.analytics.getEventsByTimeRange, {
  //   siteId,
  //   startTime,
  //   endTime,
  //   page
  // });

  const events: any[] = []; // Mock data

  // Process analytics data
  const analytics = {
    overview: {
      totalPageviews: 0,
      uniqueVisitors: 0,
      averageSessionTime: 0,
      bounceRate: 0,
    },
    pageviews: {
      timeline: [] as { date: string; views: number }[],
      total: 0,
    },
    topPages: [] as { page: string; views: number; percentage: number }[],
    referrers: [] as { referrer: string; visits: number; percentage: number }[],
    devices: {
      desktop: 0,
      mobile: 0,
      tablet: 0,
    },
    browsers: [] as { browser: string; visits: number; percentage: number }[],
    countries: [] as { country: string; visits: number; percentage: number }[],
    realtime: {
      currentVisitors: 0,
      recentPageviews: [] as { page: string; timestamp: number }[],
    },
  };

  if (events.length === 0) {
    return analytics;
  }

  // Calculate overview metrics
  const pageviewEvents = events.filter(e => e.event === 'pageview');
  const uniqueIPs = new Set(events.map(e => e.ip)).size;
  
  analytics.overview.totalPageviews = pageviewEvents.length;
  analytics.overview.uniqueVisitors = uniqueIPs;

  // Calculate pageview timeline
  const timelineData = new Map<string, number>();
  pageviewEvents.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    timelineData.set(date, (timelineData.get(date) || 0) + 1);
  });

  analytics.pageviews.timeline = Array.from(timelineData.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate top pages
  const pageViews = new Map<string, number>();
  pageviewEvents.forEach(event => {
    pageViews.set(event.page, (pageViews.get(event.page) || 0) + 1);
  });

  analytics.topPages = Array.from(pageViews.entries())
    .map(([page, views]) => ({
      page,
      views,
      percentage: Math.round((views / pageviewEvents.length) * 100)
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Calculate referrers
  const referrerCounts = new Map<string, number>();
  pageviewEvents.forEach(event => {
    const referrer = event.referrer || 'direct';
    referrerCounts.set(referrer, (referrerCounts.get(referrer) || 0) + 1);
  });

  analytics.referrers = Array.from(referrerCounts.entries())
    .map(([referrer, visits]) => ({
      referrer: referrer === 'direct' ? 'Direct' : new URL(referrer).hostname,
      visits,
      percentage: Math.round((visits / pageviewEvents.length) * 100)
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  // Calculate device breakdown
  const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
  events.forEach(event => {
    if (event.device in deviceCounts) {
      deviceCounts[event.device as keyof typeof deviceCounts]++;
    }
  });
  analytics.devices = deviceCounts;

  // Calculate browser breakdown
  const browserCounts = new Map<string, number>();
  events.forEach(event => {
    if (event.browser) {
      browserCounts.set(event.browser, (browserCounts.get(event.browser) || 0) + 1);
    }
  });

  analytics.browsers = Array.from(browserCounts.entries())
    .map(([browser, visits]) => ({
      browser: browser.charAt(0).toUpperCase() + browser.slice(1),
      visits,
      percentage: Math.round((visits / events.length) * 100)
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // Calculate country breakdown
  const countryCounts = new Map<string, number>();
  events.forEach(event => {
    if (event.country && event.country !== 'unknown') {
      countryCounts.set(event.country, (countryCounts.get(event.country) || 0) + 1);
    }
  });

  analytics.countries = Array.from(countryCounts.entries())
    .map(([country, visits]) => ({
      country: country.toUpperCase(),
      visits,
      percentage: Math.round((visits / events.length) * 100)
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  // Calculate realtime data (last 30 minutes)
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  const recentEvents = events.filter(e => e.timestamp > thirtyMinutesAgo);
  
  analytics.realtime.currentVisitors = new Set(
    recentEvents.map(e => e.ip)
  ).size;

  analytics.realtime.recentPageviews = recentEvents
    .filter(e => e.event === 'pageview')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)
    .map(e => ({
      page: e.page,
      timestamp: e.timestamp
    }));

  return analytics;
}