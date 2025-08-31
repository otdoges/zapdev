import { NextRequest, NextResponse } from 'next/server';
import { RealtimeMonitor } from '@/lib/realtime-monitor';
import { requireAdmin } from '@/lib/admin-auth';

const monitor = RealtimeMonitor.getInstance();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // CRITICAL SECURITY FIX: Require admin authentication for realtime monitoring
    const adminUser = await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'dashboard':
        const dashboardData = monitor.getDashboardData();
        return NextResponse.json({ success: true, data: dashboardData });

      case 'current-metrics':
        const currentMetrics = monitor.getCurrentMetrics();
        return NextResponse.json({ success: true, metrics: currentMetrics });

      case 'historical-metrics':
        const hours = parseInt(searchParams.get('hours') || '24');
        const historicalMetrics = monitor.getHistoricalMetrics(hours);
        return NextResponse.json({ success: true, metrics: historicalMetrics });

      case 'recent-updates':
        const limit = parseInt(searchParams.get('limit') || '50');
        const type = searchParams.get('type') as any;
        const updates = monitor.getRecentUpdates(limit, type);
        return NextResponse.json({ success: true, updates });

      case 'health-check':
        const currentHealth = monitor.getCurrentMetrics();
        const healthStatus = currentHealth?.orchestrator.systemHealth || 'healthy';
        
        return NextResponse.json({ 
          success: true, 
          health: {
            status: healthStatus,
            timestamp: new Date(),
            uptime: process.uptime(),
            version: '1.0.0'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Realtime monitor API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Monitor operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // CRITICAL SECURITY FIX: Require admin authentication for realtime monitoring operations
    const adminUser = await requireAdmin();
    
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'subscribe':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }
        
        const subscribed = monitor.subscribe({
          userId,
          subscriptionType: data.subscriptionType || 'free',
          channels: data.channels || [],
          filters: data.filters || {},
          realTimeEnabled: data.subscriptionType === 'pro' || data.subscriptionType === 'enterprise'
        });
        
        return NextResponse.json({ success: true, subscribed });

      case 'unsubscribe':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }
        
        const unsubscribed = monitor.unsubscribe(userId);
        return NextResponse.json({ success: true, unsubscribed });

      case 'track-task':
        if (!data.task) {
          return NextResponse.json(
            { success: false, error: 'Task data is required' },
            { status: 400 }
          );
        }
        
        monitor.trackTaskProgress(data.task);
        return NextResponse.json({ success: true, message: 'Task tracking started' });

      case 'track-job':
        if (!data.job) {
          return NextResponse.json(
            { success: false, error: 'Job data is required' },
            { status: 400 }
          );
        }
        
        monitor.trackJobProgress(data.job);
        return NextResponse.json({ success: true, message: 'Job tracking started' });

      case 'track-pr':
        if (!data.pr) {
          return NextResponse.json(
            { success: false, error: 'PR data is required' },
            { status: 400 }
          );
        }
        
        monitor.trackPRProgress(data.pr);
        return NextResponse.json({ success: true, message: 'PR tracking started' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Realtime monitor API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Monitor operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'shutdown':
        monitor.shutdown();
        return NextResponse.json({ success: true, message: 'Monitor shutdown complete' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Realtime monitor API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Monitor operation failed' 
      },
      { status: 500 }
    );
  }
}
