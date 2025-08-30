import { NextRequest, NextResponse } from 'next/server';
import { GitHubAutomation, GitHubFile } from '@/lib/github-automation';
import { auth } from '@clerk/nextjs/server';

const github = GitHubAutomation.getInstance();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // CRITICAL SECURITY FIX: Require authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = github.getStats();
        return NextResponse.json({ success: true, stats });

      case 'pull-requests':
        const status = searchParams.get('status') as any;
        const author = searchParams.get('author');
        const branch = searchParams.get('branch');
        
        const prs = github.getPullRequests({
          ...(status && { status }),
          ...(author && { author }),
          ...(branch && { branch })
        });
        
        return NextResponse.json({ success: true, pullRequests: prs });

      case 'automation-rules':
        const rules = github.getAutomationRules();
        return NextResponse.json({ success: true, rules });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GitHub automation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'GitHub automation operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // CRITICAL SECURITY FIX: Require authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'configure':
        if (!data.owner || !data.repo || !data.token) {
          return NextResponse.json(
            { success: false, error: 'GitHub owner, repo, and token are required' },
            { status: 400 }
          );
        }
        
        // CRITICAL SECURITY FIX: Validate GitHub token format
        if (typeof data.token !== 'string' || !data.token.startsWith('ghp_') && !data.token.startsWith('github_pat_')) {
          return NextResponse.json(
            { success: false, error: 'Invalid GitHub token format' },
            { status: 400 }
          );
        }
        
        github.configure({
          owner: data.owner,
          repo: data.repo,
          token: data.token,
          baseUrl: data.baseUrl
        });
        
        return NextResponse.json({ success: true, message: 'GitHub configured successfully' });

      case 'create-pr':
        if (!data.taskId || !data.title || !data.files) {
          return NextResponse.json(
            { success: false, error: 'Task ID, title, and files are required' },
            { status: 400 }
          );
        }
        
        const pr = await github.createPRFromTask(
          data.taskId,
          data.title,
          data.description || '',
          data.files as GitHubFile[],
          {
            branchStrategy: data.branchStrategy,
            reviewRequired: data.reviewRequired !== false,
            autoMerge: data.autoMerge === true,
            userId: userId || undefined,
            subscriptionType: data.subscriptionType || 'free'
          }
        );
        
        return NextResponse.json({ success: true, pullRequest: pr });

      case 'create-coordinated-prs':
        if (!data.tasks || !Array.isArray(data.tasks)) {
          return NextResponse.json(
            { success: false, error: 'Tasks array is required' },
            { status: 400 }
          );
        }
        
        const coordPRs = await github.createCoordinatedPRs(
          data.tasks,
          {
            userId: userId || undefined,
            subscriptionType: data.subscriptionType || 'free',
            linkPRs: data.linkPRs !== false
          }
        );
        
        return NextResponse.json({ success: true, pullRequests: coordPRs });

      case 'process-task-completed':
        if (!data.taskId || !data.taskType || !data.title) {
          return NextResponse.json(
            { success: false, error: 'Task ID, type, and title are required' },
            { status: 400 }
          );
        }
        
        const createdPRs = await github.processTaskCompleted(
          data.taskId,
          data.taskType,
          data.title,
          data.description || '',
          data.priority || 'medium',
          data.files || [],
          userId || undefined,
          data.subscriptionType || 'free'
        );
        
        return NextResponse.json({ success: true, pullRequests: createdPRs });

      case 'add-automation-rule':
        if (!data.name || !data.trigger || !data.action) {
          return NextResponse.json(
            { success: false, error: 'Name, trigger, and action are required' },
            { status: 400 }
          );
        }
        
        const ruleId = github.addAutomationRule({
          name: data.name,
          description: data.description || '',
          trigger: data.trigger,
          action: data.action,
          enabled: data.enabled !== false,
          subscriptionLevel: data.subscriptionLevel || 'free'
        });
        
        return NextResponse.json({ success: true, ruleId });

      case 'toggle-automation-rule':
        if (!data.ruleId || typeof data.enabled !== 'boolean') {
          return NextResponse.json(
            { success: false, error: 'Rule ID and enabled status are required' },
            { status: 400 }
          );
        }
        
        const toggled = github.toggleAutomationRule(data.ruleId, data.enabled);
        return NextResponse.json({ success: true, toggled });

      case 'get-pr':
        if (!data.prId) {
          return NextResponse.json(
            { success: false, error: 'PR ID is required' },
            { status: 400 }
          );
        }
        
        const pullRequest = github.getPullRequest(data.prId);
        if (!pullRequest) {
          return NextResponse.json(
            { success: false, error: 'Pull request not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ success: true, pullRequest });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GitHub automation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'GitHub automation operation failed' 
      },
      { status: 500 }
    );
  }
}
