import { NextRequest, NextResponse } from 'next/server';
import { PerformanceOptimizer } from '@/lib/performance-optimizer';
import { requireAdmin } from '@/lib/admin-auth';

const optimizer = PerformanceOptimizer.getInstance();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Require admin authentication for performance optimization access
    const adminUser = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = optimizer.getOptimizerStats();
        return NextResponse.json({ success: true, stats });

      case 'metrics':
        const timeWindow = parseInt(searchParams.get('timeWindow') || '60');
        const metrics = optimizer.getMetrics(timeWindow);
        return NextResponse.json({ success: true, metrics });

      case 'recommendations':
        const statusParam = searchParams.get('status');
        const status = statusParam as 'pending' | 'approved' | 'implementing' | 'completed' | 'rejected' | undefined;
        const recommendations = optimizer.getRecommendations(status);
        return NextResponse.json({ success: true, recommendations });

      case 'benchmarks':
        const benchmarks = optimizer.getBenchmarks();
        return NextResponse.json({ success: true, benchmarks });

      case 'alerts':
        const levelParam = searchParams.get('level');
        const level = levelParam as 'info' | 'warning' | 'error' | 'critical' | undefined;
        const alerts = optimizer.getAlerts(level);
        return NextResponse.json({ success: true, alerts });

      case 'scaling-rules':
        const rules = optimizer.getScalingRules();
        return NextResponse.json({ success: true, rules });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Performance optimizer API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Optimizer operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Require admin authentication for performance optimization operations
    const adminUser = await requireAdmin();
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'apply-recommendation':
        if (!data.recommendationId) {
          return NextResponse.json(
            { success: false, error: 'Recommendation ID is required' },
            { status: 400 }
          );
        }
        
        const applied = await optimizer.applyOptimizationRecommendation(data.recommendationId);
        return NextResponse.json({ success: true, applied });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Performance optimizer API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Optimizer operation failed' 
      },
      { status: 500 }
    );
  }
}
