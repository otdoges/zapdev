import { NextRequest, NextResponse } from 'next/server';
import { GitWorkflowManager } from '@/lib/git-workflow-manager';
import { auth } from '@clerk/nextjs/server';

const gitManager = GitWorkflowManager.getInstance();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const repositoryId = searchParams.get('repositoryId');

    switch (action) {
      case 'stats':
        const stats = gitManager.getStats();
        return NextResponse.json({ success: true, stats });

      case 'repositories':
        const repositories = gitManager.getRepositories(userId);
        return NextResponse.json({ success: true, repositories });

      case 'repository':
        if (!repositoryId) {
          return NextResponse.json(
            { success: false, error: 'Repository ID required' },
            { status: 400 }
          );
        }
        
        const repository = gitManager.getRepository(repositoryId);
        if (!repository || repository.metadata?.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Repository not found or access denied' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ success: true, repository });

      case 'config':
        const config = gitManager.getConfig();
        return NextResponse.json({ success: true, config });

      case 'check-gh-cli':
        const ghAvailable = await gitManager.checkGitHubCLI();
        return NextResponse.json({ success: true, ghCliAvailable: ghAvailable });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Git workflow API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Git workflow operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { action, ...data } = body;

    // Get user subscription type (simplified - in real app, get from Clerk metadata)
    const subscriptionType = 'pro'; // Default to pro for demo

    switch (action) {
      case 'clone-repository':
        if (!data.url) {
          return NextResponse.json(
            { success: false, error: 'Repository URL is required' },
            { status: 400 }
          );
        }
        
        const repositoryId = await gitManager.cloneRepository(
          data.url,
          userId,
          subscriptionType
        );
        
        return NextResponse.json({ success: true, repositoryId });

      case 'create-branch':
        if (!data.repositoryId || !data.featureName) {
          return NextResponse.json(
            { success: false, error: 'Repository ID and feature name are required' },
            { status: 400 }
          );
        }
        
        const branchName = await gitManager.createWorkingBranch(
          data.repositoryId,
          data.featureName
        );
        
        return NextResponse.json({ success: true, branchName });

      case 'auto-commit':
        if (!data.repositoryId || !data.description) {
          return NextResponse.json(
            { success: false, error: 'Repository ID and description are required' },
            { status: 400 }
          );
        }
        
        const commitResult = await gitManager.autoCommit(
          data.repositoryId,
          data.description,
          data.filesChanged || []
        );
        
        return NextResponse.json({ success: true, commitResult });

      case 'create-pr':
        if (!data.repositoryId || !data.title || !data.description) {
          return NextResponse.json(
            { success: false, error: 'Repository ID, title, and description are required' },
            { status: 400 }
          );
        }
        
        const prResult = await gitManager.createPullRequest(
          data.repositoryId,
          data.title,
          data.description,
          data.targetBranch
        );
        
        return NextResponse.json({ success: true, prResult });

      case 'complete-workflow':
        if (!data.url || !data.featureName || !data.description) {
          return NextResponse.json(
            { success: false, error: 'URL, feature name, and description are required' },
            { status: 400 }
          );
        }
        
        const workflowResult = await gitManager.executeCompleteWorkflow(
          data.url,
          data.featureName,
          data.description,
          userId,
          subscriptionType
        );
        
        return NextResponse.json({ success: true, workflow: workflowResult });

      case 'update-config':
        if (!data.repositoryId) {
          return NextResponse.json(
            { success: false, error: 'Repository ID is required' },
            { status: 400 }
          );
        }
        
        const configUpdated = gitManager.updateRepositoryConfig(
          data.repositoryId,
          data.config || {}
        );
        
        if (!configUpdated) {
          return NextResponse.json(
            { success: false, error: 'Repository not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ success: true, message: 'Configuration updated' });

      case 'cleanup-repository':
        if (!data.repositoryId) {
          return NextResponse.json(
            { success: false, error: 'Repository ID is required' },
            { status: 400 }
          );
        }
        
        const cleaned = await gitManager.cleanupRepository(data.repositoryId);
        
        return NextResponse.json({ 
          success: cleaned, 
          message: cleaned ? 'Repository cleaned up' : 'Cleanup failed' 
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Git workflow API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Git workflow operation failed' 
      },
      { status: 500 }
    );
  }
}