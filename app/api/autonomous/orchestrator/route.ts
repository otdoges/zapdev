import { NextRequest, NextResponse } from 'next/server';
import { BackgroundOrchestrator } from '@/lib/background-orchestrator';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const orchestrator = BackgroundOrchestrator.getInstance();

    switch (action) {
      case 'stats':
        const stats = orchestrator.getStats();
        return NextResponse.json({ success: true, stats });

      case 'jobs':
        const status = searchParams.get('status') as 'pending' | 'running' | 'completed' | 'failed' | 'paused' | null;
        const type = searchParams.get('type') as 'scheduled' | 'triggered' | 'manual' | null;
        
        const jobs = orchestrator.getJobs({
          ...(status && { status }),
          ...(type && { type }),
          ...(userId && { userId })
        });
        
        return NextResponse.json({ success: true, jobs });

      case 'job-coordinations':
        const jobId = searchParams.get('jobId');
        if (!jobId) {
          return NextResponse.json(
            { success: false, error: 'Job ID required' },
            { status: 400 }
          );
        }
        
        const coordinations = orchestrator.getJobCoordinations(jobId);
        return NextResponse.json({ success: true, coordinations });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Orchestrator API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Orchestrator operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { action, ...data } = body;
    
    const orchestrator = BackgroundOrchestrator.getInstance();

    switch (action) {
      case 'schedule-job':
        const jobId = await orchestrator.scheduleJob({
          type: data.type || 'manual',
          name: data.name,
          description: data.description,
          tasks: data.tasks || [],
          priority: data.priority || 'medium',
          schedule: data.schedule,
          trigger: data.trigger,
          metadata: {
            userId: userId || undefined,
            subscriptionType: data.subscriptionType || 'free',
            maxRetries: data.maxRetries || 2,
            timeout: data.timeout || 60
          }
        });
        
        return NextResponse.json({ success: true, jobId });

      case 'parallel-development':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }
        
        const parallelJobId = await orchestrator.createParallelDevelopmentJob(
          data.features || [],
          userId,
          data.subscriptionType || 'free'
        );
        
        return NextResponse.json({ success: true, jobId: parallelJobId });

      case 'start-job':
        if (!data.jobId) {
          return NextResponse.json(
            { success: false, error: 'Job ID required' },
            { status: 400 }
          );
        }
        
        const started = await orchestrator.startJob(data.jobId);
        return NextResponse.json({ success: true, started });

      case 'pause-job':
        if (!data.jobId) {
          return NextResponse.json(
            { success: false, error: 'Job ID required' },
            { status: 400 }
          );
        }
        
        const paused = orchestrator.pauseJob(data.jobId);
        return NextResponse.json({ success: true, paused });

      case 'resume-job':
        if (!data.jobId) {
          return NextResponse.json(
            { success: false, error: 'Job ID required' },
            { status: 400 }
          );
        }
        
        const resumed = await orchestrator.resumeJob(data.jobId);
        return NextResponse.json({ success: true, resumed });

      case 'cancel-job':
        if (!data.jobId) {
          return NextResponse.json(
            { success: false, error: 'Job ID required' },
            { status: 400 }
          );
        }
        
        const cancelled = orchestrator.cancelJob(data.jobId);
        return NextResponse.json({ success: true, cancelled });

      case 'get-job':
        if (!data.jobId) {
          return NextResponse.json(
            { success: false, error: 'Job ID required' },
            { status: 400 }
          );
        }
        
        const job = orchestrator.getJob(data.jobId);
        if (!job) {
          return NextResponse.json(
            { success: false, error: 'Job not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ success: true, job });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Orchestrator API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Orchestrator operation failed' 
      },
      { status: 500 }
    );
  }
}
