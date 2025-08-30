import { NextRequest, NextResponse } from 'next/server';
import { AutonomousPipeline } from '@/lib/autonomous-pipeline';
import { auth } from '@clerk/nextjs/server';

const pipeline = AutonomousPipeline.getInstance();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await auth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = pipeline.getStats();
        return NextResponse.json({ success: true, stats });

      case 'tasks':
        const status = searchParams.get('status') as 'pending' | 'analyzing' | 'implementing' | 'testing' | 'completed' | 'failed' | null;
        const type = searchParams.get('type') as 'feature-development' | 'bug-fix' | 'optimization' | 'testing' | 'documentation' | null;
        const priority = searchParams.get('priority') as 'low' | 'medium' | 'high' | 'critical' | null;
        
        const tasks = pipeline.getTasks({
          ...(status && { status }),
          ...(type && { type }),
          ...(priority && { priority })
        });
        
        return NextResponse.json({ success: true, tasks });

      case 'agents':
        const agents = pipeline.getAgents();
        return NextResponse.json({ success: true, agents });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Pipeline API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Pipeline operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await auth();
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'submit-task':
        const taskId = await pipeline.submitTask({
          type: data.type || 'feature-development',
          title: data.title,
          description: data.description,
          priority: data.priority || 'medium',
          estimatedTime: data.estimatedTime || 30,
          dependencies: data.dependencies,
          metadata: {
            userQuery: data.userQuery,
            codebaseContext: data.codebaseContext,
            subscriptionType: data.subscriptionType || 'free'
          }
        });
        
        return NextResponse.json({ success: true, taskId });

      case 'get-task':
        if (!data.taskId) {
          return NextResponse.json(
            { success: false, error: 'Task ID required' },
            { status: 400 }
          );
        }
        
        const task = pipeline.getTask(data.taskId);
        if (!task) {
          return NextResponse.json(
            { success: false, error: 'Task not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ success: true, task });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Pipeline API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Pipeline operation failed' 
      },
      { status: 500 }
    );
  }
}
