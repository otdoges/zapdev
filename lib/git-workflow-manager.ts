import { exec } from 'child_process';
import { promisify } from 'util';
import { trackAIAgentUsage } from './posthog';

const execAsync = promisify(exec);

export interface GitRepository {
  id: string;
  url: string;
  owner: string;
  name: string;
  branch: string;
  localPath: string;
  status: 'cloning' | 'ready' | 'working' | 'committing' | 'error';
  lastCommit?: string;
  workingBranch?: string;
  createdAt: Date;
  metadata?: {
    userId?: string;
    subscriptionType?: 'free' | 'pro' | 'enterprise';
    autoCommit?: boolean;
    autoPR?: boolean;
  };
}

export interface GitWorkflowConfig {
  autoCommit: boolean;
  autoPR: boolean;
  branchPrefix: string;
  commitMessageTemplate: string;
  workspaceDir: string;
  maxRepositories: number;
  enableGitHooks: boolean;
}

export interface CommitResult {
  success: boolean;
  commitHash?: string;
  message: string;
  filesChanged: string[];
  error?: string;
}

export interface PRResult {
  success: boolean;
  prNumber?: number;
  prUrl?: string;
  error?: string;
}

export class GitWorkflowManager {
  private static instance: GitWorkflowManager;
  private repositories: Map<string, GitRepository> = new Map();
  private config: GitWorkflowConfig;

  constructor() {
    this.config = {
      autoCommit: true,
      autoPR: false,
      branchPrefix: 'ai-feature/',
      commitMessageTemplate: '🤖 AI-Generated: {description}',
      workspaceDir: '/tmp/ai-workspace',
      maxRepositories: 10,
      enableGitHooks: true
    };
  }

  public static getInstance(): GitWorkflowManager {
    if (!GitWorkflowManager.instance) {
      GitWorkflowManager.instance = new GitWorkflowManager();
    }
    return GitWorkflowManager.instance;
  }

  /**
   * Clone a repository from GitHub URL
   */
  public async cloneRepository(
    url: string, 
    userId?: string, 
    subscriptionType: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<string> {
    // Check subscription limits
    if (subscriptionType === 'free' && this.repositories.size >= 2) {
      throw new Error('Free tier limited to 2 repositories. Upgrade to Pro for unlimited repositories.');
    }

    // Parse GitHub URL
    const { owner, name } = this.parseGitHubUrl(url);
    
    const repository: GitRepository = {
      id: `repo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      owner,
      name,
      branch: 'main',
      localPath: `${this.config.workspaceDir}/${owner}-${name}`,
      status: 'cloning',
      createdAt: new Date(),
      metadata: {
        userId,
        subscriptionType,
        autoCommit: this.config.autoCommit,
        autoPR: this.config.autoPR
      }
    };

    this.repositories.set(repository.id, repository);

    try {
      // Ensure workspace directory exists
      await execAsync(`mkdir -p ${this.config.workspaceDir}`);

      // Clone repository using gh CLI
      const cloneCommand = `gh repo clone ${owner}/${name} ${repository.localPath}`;
      await execAsync(cloneCommand);

      // Set up local git config
      await this.setupGitConfig(repository.localPath);

      repository.status = 'ready';
      this.repositories.set(repository.id, repository);

      // Track successful clone
      if (userId) {
        trackAIAgentUsage(userId, 'git-workflow-manager', 'repository-cloned');
      }

      return repository.id;
    } catch (error) {
      repository.status = 'error';
      this.repositories.set(repository.id, repository);
      throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse GitHub URL to extract owner and repo name
   */
  private parseGitHubUrl(url: string): { owner: string; name: string } {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/)?$/,
      /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)/,
      /github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { owner: match[1], name: match[2].replace('.git', '') };
      }
    }

    throw new Error('Invalid GitHub URL format');
  }

  /**
   * Set up git configuration for AI commits
   */
  private async setupGitConfig(repoPath: string): Promise<void> {
    const commands = [
      `cd ${repoPath} && git config user.name "AI Agent"`,
      `cd ${repoPath} && git config user.email "ai-agent@zapdev.com"`
    ];

    for (const command of commands) {
      await execAsync(command);
    }
  }

  /**
   * Create a new working branch for AI changes
   */
  public async createWorkingBranch(
    repositoryId: string, 
    featureName: string
  ): Promise<string> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    const branchName = `${this.config.branchPrefix}${featureName.toLowerCase().replace(/\s+/g, '-')}`;
    
    try {
      // Create and checkout new branch
      const createBranchCommand = `cd ${repository.localPath} && git checkout -b ${branchName}`;
      await execAsync(createBranchCommand);

      repository.workingBranch = branchName;
      repository.status = 'working';
      this.repositories.set(repositoryId, repository);

      return branchName;
    } catch (error) {
      throw new Error(`Failed to create working branch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Commit changes automatically when background job completes
   */
  public async autoCommit(
    repositoryId: string,
    description: string,
    filesChanged: string[]
  ): Promise<CommitResult> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    if (!repository.metadata?.autoCommit) {
      return { success: false, message: 'Auto-commit disabled for this repository', filesChanged };
    }

    try {
      repository.status = 'committing';
      this.repositories.set(repositoryId, repository);

      const repoPath = repository.localPath;
      
      // Add changes
      await execAsync(`cd ${repoPath} && git add .`);

      // Check if there are changes to commit
      const { stdout: statusOutput } = await execAsync(`cd ${repoPath} && git status --porcelain`);
      if (!statusOutput.trim()) {
        return { success: false, message: 'No changes to commit', filesChanged };
      }

      // Create commit message
      const commitMessage = this.config.commitMessageTemplate.replace('{description}', description);
      const fullCommitMessage = `${commitMessage}

Files changed:
${filesChanged.map(file => `- ${file}`).join('\n')}

🤖 Generated with AI Agent
Co-Authored-By: AI Agent <ai-agent@zapdev.com>`;

      // Commit changes
      const commitCommand = `cd ${repoPath} && git commit -m "${fullCommitMessage}"`;
      const { stdout: commitOutput } = await execAsync(commitCommand);

      // Extract commit hash
      const commitHashMatch = commitOutput.match(/\[.*?([a-f0-9]{7,})\]/);
      const commitHash = commitHashMatch ? commitHashMatch[1] : undefined;

      repository.lastCommit = commitHash;
      repository.status = 'ready';
      this.repositories.set(repositoryId, repository);

      // Track commit
      if (repository.metadata?.userId) {
        trackAIAgentUsage(repository.metadata.userId, 'git-workflow-manager', 'auto-commit');
      }

      return {
        success: true,
        commitHash,
        message: 'Changes committed successfully',
        filesChanged
      };
    } catch (error) {
      repository.status = 'error';
      this.repositories.set(repositoryId, repository);
      
      return {
        success: false,
        message: `Commit failed: ${error instanceof Error ? error.message : String(error)}`,
        filesChanged,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create pull request using gh CLI
   */
  public async createPullRequest(
    repositoryId: string,
    title: string,
    description: string,
    targetBranch: string = 'main'
  ): Promise<PRResult> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    if (!repository.metadata?.autoPR && repository.metadata?.subscriptionType === 'free') {
      return { success: false, error: 'Auto-PR is a Pro feature. Upgrade to enable automatic pull requests.' };
    }

    try {
      const repoPath = repository.localPath;
      const workingBranch = repository.workingBranch;

      if (!workingBranch) {
        throw new Error('No working branch found');
      }

      // Push branch to remote
      await execAsync(`cd ${repoPath} && git push -u origin ${workingBranch}`);

      // Create PR using gh CLI
      const prBody = `## AI-Generated Feature

${description}

### Changes
- Automatically generated by AI Agent
- Branch: \`${workingBranch}\`
- Target: \`${targetBranch}\`

### Testing
Please review the changes and test thoroughly before merging.

🤖 Generated with AI Agent`;

      const prCommand = `cd ${repoPath} && gh pr create --title "${title}" --body "${prBody}" --base ${targetBranch}`;
      const { stdout: prOutput } = await execAsync(prCommand);

      // Extract PR URL and number
      const prUrlMatch = prOutput.match(/(https:\/\/github\.com\/[^\s]+)/);
      const prUrl = prUrlMatch ? prUrlMatch[1] : undefined;
      const prNumberMatch = prUrl?.match(/\/pull\/(\d+)/);
      const prNumber = prNumberMatch ? parseInt(prNumberMatch[1]) : undefined;

      // Track PR creation
      if (repository.metadata?.userId) {
        trackAIAgentUsage(repository.metadata.userId, 'git-workflow-manager', 'pr-created');
      }

      return {
        success: true,
        prNumber,
        prUrl
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create PR: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute complete workflow: clone, work, commit, PR
   */
  public async executeCompleteWorkflow(
    url: string,
    featureName: string,
    description: string,
    userId?: string,
    subscriptionType: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<{
    repositoryId: string;
    branchName: string;
    commitResult: CommitResult;
    prResult?: PRResult;
  }> {
    // Clone repository
    const repositoryId = await this.cloneRepository(url, userId, subscriptionType);
    
    // Create working branch
    const branchName = await this.createWorkingBranch(repositoryId, featureName);
    
    // Note: Actual file changes would be made by background agents here
    // For now, we'll simulate changes
    const filesChanged = [`src/components/${featureName.replace(/\s+/g, '')}.tsx`];
    
    // Auto-commit changes
    const commitResult = await this.autoCommit(repositoryId, description, filesChanged);
    
    let prResult: PRResult | undefined;
    
    // Create PR if enabled and commit was successful
    if (commitResult.success) {
      const repository = this.repositories.get(repositoryId);
      if (repository?.metadata?.autoPR || subscriptionType !== 'free') {
        prResult = await this.createPullRequest(
          repositoryId,
          `AI Feature: ${featureName}`,
          description
        );
      }
    }

    return {
      repositoryId,
      branchName,
      commitResult,
      prResult
    };
  }

  /**
   * Get repository status
   */
  public getRepository(repositoryId: string): GitRepository | null {
    return this.repositories.get(repositoryId) || null;
  }

  /**
   * Get all repositories
   */
  public getRepositories(userId?: string): GitRepository[] {
    const repos = Array.from(this.repositories.values());
    return userId ? repos.filter(r => r.metadata?.userId === userId) : repos;
  }

  /**
   * Update repository configuration
   */
  public updateRepositoryConfig(
    repositoryId: string,
    config: Partial<GitRepository['metadata']>
  ): boolean {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      return false;
    }

    repository.metadata = { ...repository.metadata, ...config };
    this.repositories.set(repositoryId, repository);
    return true;
  }

  /**
   * Clean up repository (remove from disk)
   */
  public async cleanupRepository(repositoryId: string): Promise<boolean> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      return false;
    }

    try {
      // Remove directory
      await execAsync(`rm -rf ${repository.localPath}`);
      
      // Remove from memory
      this.repositories.delete(repositoryId);
      
      return true;
    } catch (error) {
      console.error(`Failed to cleanup repository ${repositoryId}:`, error);
      return false;
    }
  }

  /**
   * Check if gh CLI is available
   */
  public async checkGitHubCLI(): Promise<boolean> {
    try {
      await execAsync('gh --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get Git workflow statistics
   */
  public getStats(): {
    totalRepositories: number;
    activeRepositories: number;
    totalCommits: number;
    totalPRs: number;
    successRate: number;
  } {
    const repos = Array.from(this.repositories.values());
    const activeRepos = repos.filter(r => r.status === 'ready' || r.status === 'working');
    const totalCommits = repos.filter(r => r.lastCommit).length;
    
    // Estimate PRs (in real implementation, track this properly)
    const totalPRs = repos.filter(r => r.metadata?.autoPR).length;
    
    const successfulRepos = repos.filter(r => r.status === 'ready' || r.lastCommit);
    const successRate = repos.length > 0 ? successfulRepos.length / repos.length : 1;

    return {
      totalRepositories: repos.length,
      activeRepositories: activeRepos.length,
      totalCommits,
      totalPRs,
      successRate
    };
  }

  /**
   * Update workflow configuration
   */
  public updateConfig(newConfig: Partial<GitWorkflowConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): GitWorkflowConfig {
    return { ...this.config };
  }
}