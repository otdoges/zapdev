import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface AnalyticsEvent {
  siteId: string;
  event: string;
  page: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
  timestamp: number;
  sessionId?: string;
  scrollDepth?: number;
  loadTime?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsEvent = await request.json();
    const { siteId, event, page, title, referrer, timestamp } = body;

    if (!siteId || !event || !page) {
      return NextResponse.json({ 
        error: 'Missing required fields: siteId, event, page' 
      }, { status: 400 });
    }

    // Get user info from request
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = getClientIP(request);
    const hashedIP = ip ? hashIP(ip) : undefined;

    // Parse user agent for device/browser info
    const deviceInfo = parseUserAgent(userAgent);

    // Get geographic info (in production, you'd use a service like MaxMind)
    const geoInfo = await getGeoInfo(ip);

    // TODO: Store in Convex database
    // This would normally call a Convex mutation to store the analytics data
    const analyticsData = {
      siteId,
      event,
      page,
      title,
      referrer: referrer || undefined,
      userAgent,
      ip: hashedIP, // Store hashed IP for privacy
      country: geoInfo.country,
      city: geoInfo.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      sessionId: body.sessionId,
      loadTime: body.loadTime,
      scrollDepth: body.scrollDepth,
      timestamp: timestamp || Date.now(),
    };

    console.log('[analytics] Tracked event:', {
      siteId,
      event,
      page,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
    });

    // In a real implementation, you would:
    // await convex.mutation(api.analytics.trackEvent, analyticsData);

    return NextResponse.json({ 
      success: true,
      tracked: true 
    });

  } catch (error) {
    console.error('[analytics] Failed to track event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to track event'
    }, { status: 500 });
  }
}

function getClientIP(request: NextRequest): string | null {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnecting = request.headers.get('cf-connecting-ip');
  if (cfConnecting) {
    return cfConnecting;
  }

  return null;
}

function hashIP(ip: string): string {
  // Hash IP for privacy while maintaining uniqueness for analytics
  return crypto.createHash('sha256').update(ip + process.env.ANALYTICS_SALT || 'default-salt').digest('hex').substring(0, 16);
}

function parseUserAgent(userAgent?: string) {
  if (!userAgent) {
    return { device: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let device = 'desktop';
  if (ua.includes('mobile')) device = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'tablet';

  // Detect browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
  else if (ua.includes('edg')) browser = 'edge';
  else if (ua.includes('opera')) browser = 'opera';

  // Detect OS
  let os = 'unknown';
  if (ua.includes('windows')) os = 'windows';
  else if (ua.includes('mac')) os = 'macos';
  else if (ua.includes('linux')) os = 'linux';
  else if (ua.includes('android')) os = 'android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'ios';

  return { device, browser, os };
}

async function getGeoInfo(ip: string | null) {
  // In production, you'd use a service like MaxMind GeoIP2 or similar
  // For now, return defaults
  if (!ip) {
    return { country: 'unknown', city: 'unknown' };
  }

  // Basic detection for localhost/development
  if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'localhost', city: 'development' };
  }

  // In production, you would do:
  // try {
  //   const response = await fetch(`https://ipapi.co/${ip}/json/`);
  //   const data = await response.json();
  //   return { 
  //     country: data.country_code || 'unknown',
  //     city: data.city || 'unknown'
  //   };
  // } catch (error) {
  //   return { country: 'unknown', city: 'unknown' };
  // }

  return { country: 'unknown', city: 'unknown' };
}