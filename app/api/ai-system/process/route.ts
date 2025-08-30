import { NextRequest, NextResponse } from 'next/server';
import { IntegratedAISystem, AIRequest } from '@/lib/integrated-ai-system';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const aiSystem = IntegratedAISystem.getInstance();
    
    const body = await request.json();
    const aiRequest: AIRequest = {
      ...body,
      userId: userId || undefined
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

export async function GET() {
  try {
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
