import { NextRequest, NextResponse } from 'next/server';
import { IntegratedAISystem, AIRequest } from '@/lib/integrated-ai-system';

export async function POST(request: NextRequest) {
  try {
    // Block browser requests - only allow server-side calls
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');
    
    if (userAgent && (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) && referer) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const aiSystem = IntegratedAISystem.getInstance();
    
    const body = await request.json();
    const aiRequest: AIRequest = {
      ...body,
      userId: body.userId || 'anonymous'
    };

    // Validate required fields
    if (!aiRequest.userQuery) {
      return NextResponse.json(
        { error: 'userQuery is required' },
        { status: 400 }
      );
    }

    // Process the request
    const response = await aiSystem.processRequest(aiRequest);

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('AI system processing error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'AI system processing failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Block browser requests - only allow server-side calls
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');
    
    if (userAgent && (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) && referer) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const aiSystem = IntegratedAISystem.getInstance();
    const metrics = aiSystem.getPerformanceMetrics();

    return NextResponse.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('AI system metrics error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metrics' 
      },
      { status: 500 }
    );
  }
}
