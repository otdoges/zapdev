import { NextRequest, NextResponse } from 'next/server';
import { getHealthMonitor } from '@/lib/monitoring/health-checks';
import { getLogger } from '@/lib/monitoring/logger';

const logger = getLogger();

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logger.info('Health check requested', {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    const healthMonitor = getHealthMonitor();
    const systemHealth = await healthMonitor.runAll();
    
    const responseTime = Date.now() - startTime;
    
    // Determine HTTP status based on overall health
    let status = 200;
    if (systemHealth.overall === 'unhealthy') {
      status = 503; // Service Unavailable
    } else if (systemHealth.overall === 'degraded') {
      status = 200; // OK but with warnings
    }

    const response = {
      status: systemHealth.overall,
      timestamp: systemHealth.timestamp,
      uptime: Math.round(systemHealth.uptime / 1000), // Convert to seconds
      version: systemHealth.version,
      environment: systemHealth.environment,
      responseTime,
      checks: Object.fromEntries(
        Object.entries(systemHealth.checks).map(([name, result]) => [
          name,
          {
            status: result.status,
            message: result.message,
            responseTime: result.responseTime,
            ...(process.env.NODE_ENV === 'development' && { details: result.details }),
          }
        ])
      ),
    };

    logger.info('Health check completed', {
      overall: systemHealth.overall,
      responseTime,
      totalChecks: Object.keys(systemHealth.checks).length,
      healthyChecks: Object.values(systemHealth.checks).filter(c => c.healthy).length,
    });

    return NextResponse.json(response, { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': systemHealth.overall,
        'X-Response-Time': responseTime.toString(),
      },
    });
  } catch (error) {
    logger.error('Health check failed', error as Error);
    
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Health check system failure',
      timestamp: new Date(),
      error: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : 'Internal server error',
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
      },
    });
  }
}