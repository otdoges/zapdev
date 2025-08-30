import { trackFeatureUsage } from './posthog';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  baseUrl?: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'merged' | 'closed';
  branch: string;
  baseBranch: string;
  author: string;
  files: GitHubFile[];
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  url: string;
  checks?: {
    status: 'pending' | 'success' | 'failure';
    details: string;
  };
}

export interface GitHubFile {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
  encoding?: 'utf-8' | 'base64';
}

export interface BranchStrategy {
  type: 'feature' | 'hotfix' | 'release';
  prefix: string;
  baseBranch: string;
  autoDelete: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    event: 'task_completed' | 'job_completed' | 'manual';
    conditions: Record<string, any>;
  };
  action: {
    type: 'create_pr' | 'update_pr' | 'merge_pr' | 'create_branch';
    config: Record<string, any>;
  };
  enabled: boolean;
  subscriptionLevel: 'free' | 'pro' | 'enterprise';
}

export class GitHubAutomation {
  private static instance: GitHubAutomation;
  private config?: GitHubConfig;
  private rules: Map<string, AutomationRule> = new Map();
  private pullRequests: Map<string, PullRequest> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): GitHubAutomation {
    if (!GitHubAutomation.instance) {
      GitHubAutomation.instance = new GitHubAutomation();
    }
    return GitHubAutomation.instance;
  }

  /**
   * Configure GitHub integration
   */
  public configure(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * Initialize default automation rules
   */
  private initializeDefaultRules() {
    const defaultRules: AutomationRule[] = [
      {
        id: 'auto-pr-feature',
        name: 'Auto PR for Features',
        description: 'Automatically create PR when feature development task completes',
        trigger: {
          event: 'task_completed',
          conditions: {
            taskType: 'feature-development',
            taskStatus: 'completed'
          }
        },
        action: {
          type: 'create_pr',
          config: {
            branchStrategy: 'feature',
            reviewRequired: true,
            autoMerge: false
          }
        },
        enabled: true,
        subscriptionLevel: 'free'
      },
      {
        id: 'parallel-feature-coordination',
        name: 'Parallel Feature Coordination',
        description: 'Create coordinated PRs for parallel feature development',
        trigger: {
          event: 'job_completed',
          conditions: {
            jobType: 'parallel-development'
          }
        },
        action: {
          type: 'create_pr',
          config: {
            branchStrategy: 'feature',
            createSeparatePRs: true,
            linkPRs: true,
            reviewRequired: true
          }
        },
        enabled: true,
        subscriptionLevel: 'pro'
      },
      {
        id: 'hotfix-auto-merge',
        name: 'Hotfix Auto Merge',
        description: 'Auto-merge critical hotfix PRs after checks pass',
        trigger: {
          event: 'task_completed',
          conditions: {
            taskType: 'bug-fix',
            taskPriority: 'critical'
          }
        },
        action: {
          type: 'create_pr',
          config: {
            branchStrategy: 'hotfix',
            autoMerge: true,
            requireChecks: true
          }
        },
        enabled: true,
        subscriptionLevel: 'enterprise'
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Create a pull request from completed task
   */
  public async createPRFromTask(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    files: GitHubFile[],
    options: {
      branchStrategy?: BranchStrategy;
      reviewRequired?: boolean;
      autoMerge?: boolean;
      userId?: string;
      subscriptionType?: 'free' | 'pro' | 'enterprise';
    } = {}
  ): Promise<PullRequest> {
    if (!this.config) {
      throw new Error('GitHub not configured. Please configure GitHub integration first.');
    }

    const {
      branchStrategy = {
        type: 'feature',
        prefix: 'feature/',
        baseBranch: 'main',
        autoDelete: true
      },
      reviewRequired = true,
      autoMerge = false,
      userId,
      subscriptionType = 'free'
    } = options;

    // Generate branch name
    const branchName = this.generateBranchName(taskTitle, branchStrategy);

    try {
      // Simulate GitHub API calls (in real implementation, use GitHub API)
      const pr: PullRequest = {
        id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        number: Math.floor(Math.random() * 1000) + 1,
        title: `feat: ${taskTitle}`,
        description: this.generatePRDescription(taskDescription, taskId),
        status: reviewRequired ? 'open' : 'draft',
        branch: branchName,
        baseBranch: branchStrategy.baseBranch,
        author: 'zapdev-ai',
        files,
        createdAt: new Date(),
        updatedAt: new Date(),
        url: `https://github.com/${this.config.owner}/${this.config.repo}/pull/${Math.floor(Math.random() * 1000) + 1}`,
        checks: {
          status: 'pending',
          details: 'Running automated checks...'
        }
      };

      this.pullRequests.set(pr.id, pr);

      // Track PR creation
      if (userId) {
        trackFeatureUsage(userId, 'github-automation', subscriptionType === 'pro', {
          action: 'pr-created',
          taskId,
          branchStrategy: branchStrategy.type
        });
      }

      // Simulate checks and auto-merge for enterprise
      if (autoMerge && subscriptionType === 'enterprise') {
        setTimeout(async () => {
          await this.autoMergePR(pr.id, userId);
        }, 30000); // Auto-merge after 30 seconds of checks
      }

      return pr;

    } catch (error) {
      console.error('Failed to create PR:', error);
      throw new Error(`Failed to create PR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create multiple coordinated PRs for parallel development
   */
  public async createCoordinatedPRs(
    tasks: Array<{
      taskId: string;
      title: string;
      description: string;
      files: GitHubFile[];
    }>,
    options: {
      userId?: string;
      subscriptionType?: 'free' | 'pro' | 'enterprise';
      linkPRs?: boolean;
    } = {}
  ): Promise<PullRequest[]> {
    if (options.subscriptionType === 'free' && tasks.length > 2) {
      throw new Error('Free tier limited to 2 parallel PRs. Upgrade to Pro for unlimited parallel development.');
    }

    const prs: PullRequest[] = [];
    const prLinks: string[] = [];

    for (const task of tasks) {
      const pr = await this.createPRFromTask(
        task.taskId,
        task.title,
        task.description,
        task.files,
        {
          reviewRequired: true,
          autoMerge: false,
          userId: options.userId,
          subscriptionType: options.subscriptionType
        }
      );

      prs.push(pr);
      prLinks.push(`#${pr.number}`);
    }

    // Update PR descriptions to link related PRs
    if (options.linkPRs && prs.length > 1) {
      for (const pr of prs) {
        const otherPRs = prLinks.filter(link => link !== `#${pr.number}`);
        pr.description += `\n\n**Related PRs:** ${otherPRs.join(', ')}`;
        this.pullRequests.set(pr.id, pr);
      }
    }

    return prs;
  }

  /**
   * Auto-merge a PR after checks pass
   */
  private async autoMergePR(prId: string, userId?: string): Promise<boolean> {
    const pr = this.pullRequests.get(prId);
    if (!pr) {
      return false;
    }

    try {
      // Simulate checks passing
      pr.checks = {
        status: 'success',
        details: 'All checks passed'
      };

      // Simulate merge
      pr.status = 'merged';
      pr.mergedAt = new Date();
      pr.updatedAt = new Date();

      this.pullRequests.set(prId, pr);

      // Track auto-merge
      if (userId) {
        trackFeatureUsage(userId, 'github-automation', true, {
          action: 'pr-auto-merged',
          prId,
          prNumber: pr.number
        });
      }

      return true;

    } catch (error) {
      console.error(`Failed to auto-merge PR ${prId}:`, error);
      return false;
    }
  }

  /**
   * Generate branch name based on strategy
   */
  private generateBranchName(taskTitle: string, strategy: BranchStrategy): string {
    const sanitizedTitle = taskTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);

    const timestamp = Date.now().toString().slice(-6);
    return `${strategy.prefix}${sanitizedTitle}-${timestamp}`;
  }

  /**
   * Generate PR description
   */
  private generatePRDescription(taskDescription: string, taskId: string): string {
    return `## Description
${taskDescription}

## Changes
- Automated implementation by Zapdev AI
- Task ID: ${taskId}
- Generated on: ${new Date().toISOString()}

## Testing
- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] No breaking changes

## Deployment Notes
This PR was generated automatically by Zapdev AI. Please review carefully before merging.`;
  }

  /**
   * Process automation rules for a completed task
   */
  public async processTaskCompleted(
    taskId: string,
    taskType: string,
    taskTitle: string,
    taskDescription: string,
    taskPriority: string,
    files: GitHubFile[],
    userId?: string,
    subscriptionType: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<PullRequest[]> {
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => 
        rule.enabled &&
        rule.trigger.event === 'task_completed' &&
        this.checkRuleConditions(rule.trigger.conditions, {
          taskType,
          taskPriority,
          subscriptionType
        }) &&
        this.hasSubscriptionLevel(subscriptionType, rule.subscriptionLevel)
      );

    const createdPRs: PullRequest[] = [];

    for (const rule of applicableRules) {
      try {
        if (rule.action.type === 'create_pr') {
          const pr = await this.createPRFromTask(
            taskId,
            taskTitle,
            taskDescription,
            files,
            {
              ...rule.action.config,
              userId,
              subscriptionType
            }
          );
          createdPRs.push(pr);
        }
      } catch (error) {
        console.error(`Failed to execute rule ${rule.id}:`, error);
      }
    }

    return createdPRs;
  }

  /**
   * Check if rule conditions are met
   */
  private checkRuleConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    return Object.entries(conditions).every(([key, value]) => {
      return context[key] === value;
    });
  }

  /**
   * Check subscription level requirements
   */
  private hasSubscriptionLevel(userLevel: string, requiredLevel: string): boolean {
    const levels = { free: 0, pro: 1, enterprise: 2 };
    return levels[userLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels];
  }

  /**
   * Get all pull requests
   */
  public getPullRequests(filter?: {
    status?: PullRequest['status'];
    author?: string;
    branch?: string;
  }): PullRequest[] {
    let prs = Array.from(this.pullRequests.values());

    if (filter) {
      if (filter.status) {
        prs = prs.filter(pr => pr.status === filter.status);
      }
      if (filter.author) {
        prs = prs.filter(pr => pr.author === filter.author);
      }
      if (filter.branch) {
        prs = prs.filter(pr => pr.branch.includes(filter.branch));
      }
    }

    return prs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get PR by ID
   */
  public getPullRequest(prId: string): PullRequest | null {
    return this.pullRequests.get(prId) || null;
  }

  /**
   * Get automation rules
   */
  public getAutomationRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Add custom automation rule
   */
  public addAutomationRule(rule: Omit<AutomationRule, 'id'>): string {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.rules.set(ruleId, { ...rule, id: ruleId });
    return ruleId;
  }

  /**
   * Toggle automation rule
   */
  public toggleAutomationRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    rule.enabled = enabled;
    this.rules.set(ruleId, rule);
    return true;
  }

  /**
   * Get GitHub automation statistics
   */
  public getStats(): {
    totalPRs: number;
    openPRs: number;
    mergedPRs: number;
    draftPRs: number;
    activeRules: number;
    automationRate: number; // percentage of automated PRs
  } {
    const allPRs = Array.from(this.pullRequests.values());
    const openPRs = allPRs.filter(pr => pr.status === 'open');
    const mergedPRs = allPRs.filter(pr => pr.status === 'merged');
    const draftPRs = allPRs.filter(pr => pr.status === 'draft');
    const activeRules = Array.from(this.rules.values()).filter(r => r.enabled);

    const automationRate = allPRs.length > 0 ? (allPRs.length / allPRs.length) * 100 : 0; // 100% since all are automated

    return {
      totalPRs: allPRs.length,
      openPRs: openPRs.length,
      mergedPRs: mergedPRs.length,
      draftPRs: draftPRs.length,
      activeRules: activeRules.length,
      automationRate
    };
  }
}
