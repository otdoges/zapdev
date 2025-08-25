/**
 * ▲ Vercel Deployment Service
 * 
 * Handles deployment to Vercel with custom subdomain support for zapdev.link
 */

import {
  IDeploymentService,
  DeploymentPlatform,
  BaseDeploymentConfig,
  DeploymentResult,
  CustomDomainConfig,
  DeploymentError,
  DomainConfigurationError,
  DeploymentStatus
} from './types.js';

interface VercelDeployment {
  uid: string;
  url: string;
  name: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  target: string;
  alias?: string[];
  aliasAssigned?: boolean;
  created: number;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  checksState?: 'running' | 'completed';
  checksConclusion?: 'succeeded' | 'failed' | 'skipped' | 'canceled';
}

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  updatedAt: number;
  targets?: {
    production?: {
      domain?: string;
    };
  };
}

interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  createdAt: number;
  gitBranch?: string;
}

export class VercelDeploymentService implements IDeploymentService {
  public readonly platform: DeploymentPlatform = 'vercel';
  
  constructor(
    private accessToken: string,
    private teamId?: string
  ) {}

  private get headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'zapdev-deployment-service/1.0.0'
    };
  }

  private get baseUrl() {
    return 'https://api.vercel.com';
  }

  private get teamQuery() {
    return this.teamId ? `?teamId=${encodeURIComponent(this.teamId)}` : '';
  }

  private mapStatus(vercelState: string): DeploymentStatus {
    switch (vercelState) {
      case 'INITIALIZING':
      case 'QUEUED':
        return 'pending';
      case 'BUILDING':
        return 'building';
      case 'READY':
        return 'ready';
      case 'ERROR':
        return 'error';
      case 'CANCELED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  async deploy(config: BaseDeploymentConfig): Promise<DeploymentResult> {
    const startTime = Date.now();
    
    try {
      // Create or get project first
      const project = await this.createOrGetProject(config.projectName);
      
      // If files are provided, deploy directly
      if (config.files) {
        return await this.deployFiles(config, project);
      }
      
      // If git repo is provided, deploy from git
      if (config.gitRepo) {
        return await this.deployFromGit(config, project);
      }
      
      throw new DeploymentError(
        'Either files or gitRepo must be provided for deployment',
        'vercel',
        'INVALID_CONFIG'
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof DeploymentError) {
        throw error;
      }
      
      throw new DeploymentError(
        `Vercel deployment failed: ${error instanceof Error ? error.message : String(error)}`,
        'vercel',
        'DEPLOYMENT_FAILED',
        { error, duration }
      );
    }
  }

  private async deployFiles(config: BaseDeploymentConfig, project: VercelProject): Promise<DeploymentResult> {
    const files = config.files!;
    
    // Prepare files for Vercel deployment
    const vercelFiles = Object.entries(files).map(([path, content]) => ({
      file: path.startsWith('/') ? path.slice(1) : path,
      data: content
    }));

    // Create deployment
    const deploymentResponse = await fetch(`${this.baseUrl}/v13/deployments${this.teamQuery}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        name: config.projectName,
        files: vercelFiles,
        target: 'production',
        projectSettings: {
          buildCommand: config.gitRepo?.buildCommand || null,
          outputDirectory: config.gitRepo?.outputDirectory || null,
          installCommand: 'npm install'
        },
        env: config.environment || {},
        projectId: project.id
      })
    });

    if (!deploymentResponse.ok) {
      const error = await deploymentResponse.text();
      throw new DeploymentError(
        `Failed to create deployment: ${error}`,
        'vercel',
        'DEPLOY_FAILED'
      );
    }

    const deployment: VercelDeployment = await deploymentResponse.json();
    
    // Setup custom domain if needed
    let customDomain: string | undefined;
    if (config.subdomain) {
      const domainResult = await this.setupCustomDomain({
        subdomain: config.subdomain,
        fullDomain: `${config.subdomain}.zapdev.link`,
        verified: false
      }, project.id);
      
      if (domainResult.success) {
        customDomain = domainResult.domain;
      }
    }

    return {
      success: true,
      deploymentId: deployment.uid,
      url: `https://${deployment.url}`,
      customDomain,
      status: this.mapStatus(deployment.state),
      platform: 'vercel',
      metadata: {
        projectId: project.id,
        alias: deployment.alias,
        target: deployment.target
      }
    };
  }

  private async deployFromGit(config: BaseDeploymentConfig, project: VercelProject): Promise<DeploymentResult> {
    const gitRepo = config.gitRepo!;
    
    // Update project with git repository
    await this.linkProjectToGit(project.id, gitRepo);
    
    // Create deployment from git
    const deploymentResponse = await fetch(`${this.baseUrl}/v13/deployments${this.teamQuery}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        name: config.projectName,
        gitSource: {
          type: this.extractGitProvider(gitRepo.url),
          repo: this.extractRepoPath(gitRepo.url),
          ref: gitRepo.branch || 'main'
        },
        target: 'production',
        projectSettings: {
          buildCommand: gitRepo.buildCommand || 'npm run build',
          outputDirectory: gitRepo.outputDirectory || 'dist',
          installCommand: 'npm install'
        },
        env: config.environment || {},
        projectId: project.id
      })
    });

    if (!deploymentResponse.ok) {
      const error = await deploymentResponse.text();
      throw new DeploymentError(
        `Failed to create git deployment: ${error}`,
        'vercel',
        'GIT_DEPLOY_FAILED'
      );
    }

    const deployment: VercelDeployment = await deploymentResponse.json();
    
    // Setup custom domain if needed
    let customDomain: string | undefined;
    if (config.subdomain) {
      const domainResult = await this.setupCustomDomain({
        subdomain: config.subdomain,
        fullDomain: `${config.subdomain}.zapdev.link`,
        verified: false
      }, project.id);
      
      if (domainResult.success) {
        customDomain = domainResult.domain;
      }
    }

    return {
      success: true,
      deploymentId: deployment.uid,
      url: `https://${deployment.url}`,
      customDomain,
      status: this.mapStatus(deployment.state),
      platform: 'vercel',
      metadata: {
        projectId: project.id,
        gitRepo: gitRepo.url,
        branch: gitRepo.branch || 'main'
      }
    };
  }

  private async createOrGetProject(name: string): Promise<VercelProject> {
    // Try to get existing project first
    const existingResponse = await fetch(`${this.baseUrl}/v9/projects/${name}${this.teamQuery}`, {
      headers: this.headers
    });

    if (existingResponse.ok) {
      return await existingResponse.json();
    }

    // Create new project
    const createResponse = await fetch(`${this.baseUrl}/v10/projects${this.teamQuery}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        name: name,
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
        installCommand: 'npm install',
        devCommand: 'npm run dev'
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new DeploymentError(
        `Failed to create project: ${error}`,
        'vercel',
        'PROJECT_CREATION_FAILED'
      );
    }

    return await createResponse.json();
  }

  private async linkProjectToGit(projectId: string, gitRepo: BaseDeploymentConfig['gitRepo']): Promise<void> {
    if (!gitRepo) return;

    const response = await fetch(`${this.baseUrl}/v9/projects/${projectId}${this.teamQuery}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({
        gitRepository: {
          repo: this.extractRepoPath(gitRepo.url),
          type: this.extractGitProvider(gitRepo.url)
        },
        buildCommand: gitRepo.buildCommand || 'npm run build',
        outputDirectory: gitRepo.outputDirectory || 'dist'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new DeploymentError(
        `Failed to link project to git: ${error}`,
        'vercel',
        'GIT_LINK_FAILED'
      );
    }
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v13/deployments/${deploymentId}${this.teamQuery}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new DeploymentError(
          `Failed to get deployment status: ${response.statusText}`,
          'vercel',
          'STATUS_FETCH_FAILED'
        );
      }

      const deployment: VercelDeployment = await response.json();

      return {
        success: deployment.state === 'READY',
        deploymentId: deployment.uid,
        url: `https://${deployment.url}`,
        status: this.mapStatus(deployment.state),
        platform: 'vercel',
        metadata: {
          alias: deployment.alias,
          target: deployment.target,
          checksState: deployment.checksState,
          checksConclusion: deployment.checksConclusion
        }
      };
    } catch (error) {
      if (error instanceof DeploymentError) {
        throw error;
      }
      
      throw new DeploymentError(
        `Failed to get deployment status: ${error instanceof Error ? error.message : String(error)}`,
        'vercel',
        'STATUS_ERROR'
      );
    }
  }

  async setupCustomDomain(config: CustomDomainConfig, projectId?: string): Promise<{
    success: boolean;
    domain?: string;
    verified?: boolean;
    dnsRecords?: CustomDomainConfig['dnsRecords'];
    error?: string;
  }> {
    try {
      if (!projectId) {
        throw new DomainConfigurationError(
          'Project ID is required for Vercel domain setup',
          config.fullDomain,
          'vercel',
          'MISSING_PROJECT_ID'
        );
      }

      // Add domain to project
      const response = await fetch(`${this.baseUrl}/v10/projects/${projectId}/domains${this.teamQuery}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          name: config.fullDomain,
          gitBranch: null, // Use for production
          redirect: null
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new DomainConfigurationError(
          `Failed to add domain to project: ${error}`,
          config.fullDomain,
          'vercel',
          'DOMAIN_ADD_FAILED'
        );
      }

      const domain: VercelDomain = await response.json();

      // Get DNS records for the domain
      const dnsResponse = await fetch(`${this.baseUrl}/v6/domains/${config.fullDomain}/config${this.teamQuery}`, {
        headers: this.headers
      });

      let dnsRecords: CustomDomainConfig['dnsRecords'] = [];
      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json();
        if (dnsData.configuredBy === 'CNAME') {
          dnsRecords = [{
            type: 'CNAME',
            name: config.subdomain,
            value: 'cname.vercel-dns.com'
          }];
        } else if (dnsData.configuredBy === 'A') {
          dnsRecords = [{
            type: 'A',
            name: config.subdomain,
            value: '76.76.19.61' // Vercel's A record
          }];
        }
      }

      return {
        success: true,
        domain: config.fullDomain,
        verified: domain.verified,
        dnsRecords
      };
    } catch (error) {
      if (error instanceof DomainConfigurationError) {
        throw error;
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async verifyCustomDomain(domain: string, projectId?: string): Promise<{
    success: boolean;
    verified: boolean;
    error?: string;
  }> {
    try {
      if (!projectId) {
        return {
          success: false,
          verified: false,
          error: 'Project ID is required for domain verification'
        };
      }

      // Verify the domain
      const response = await fetch(`${this.baseUrl}/v9/projects/${projectId}/domains/${domain}/verify${this.teamQuery}`, {
        method: 'POST',
        headers: this.headers
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          verified: false,
          error: `Verification failed: ${error}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        verified: result.verified || false
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async deleteDeployment(deploymentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/v13/deployments/${deploymentId}${this.teamQuery}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to delete deployment: ${response.statusText}`
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async listDeployments(limit = 20): Promise<{
    success: boolean;
    deployments?: Array<{
      id: string;
      name: string;
      url: string;
      status: DeploymentStatus;
      createdAt: Date;
    }>;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (this.teamId) params.set('teamId', this.teamId);
      // Clamp limit to sane bounds supported by API
      params.set('limit', String(Math.max(1, Math.min(100, limit))));
      const response = await fetch(`${this.baseUrl}/v6/deployments?${params.toString()}`, {
        headers: this.headers
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to list deployments: ${response.statusText}`
        };
      }

      const data = await response.json();
      const deployments = data.deployments?.map((deployment: VercelDeployment) => ({
        id: deployment.uid,
        name: deployment.name,
        url: `https://${deployment.url}`,
        status: this.mapStatus(deployment.state),
        createdAt: new Date(deployment.created)
      })) || [];

      return {
        success: true,
        deployments
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private extractGitProvider(url: string): string {
    try {
      // Secure URL parsing to prevent domain spoofing attacks
      let hostname = '';
      try {
        // Handle web and git URLs (e.g., https://github.com/..., git://github.com/...)
        hostname = new URL(url).hostname.toLowerCase();
      } catch {
        // Fallback for git@github.com:owner/repo.git
        // E.g. git@github.com:owner/repo.git or ssh://git@github.com/owner/repo.git
        const match = url.match(/@([a-zA-Z0-9.-]+)[/:]/);
        if (match) hostname = match[1].toLowerCase();
      }
      if (hostname === 'github.com') return 'github';
      if (hostname === 'gitlab.com') return 'gitlab';
      if (hostname === 'bitbucket.org') return 'bitbucket';
      return 'github'; // default
    } catch {
      // Secure fallback - no substring matching to prevent spoofing
      // Only return 'github' as default if we cannot parse the URL securely
      return 'github';
    }
  }

  private extractRepoPath(url: string): string {
    // Extract owner/repo from git URL
    const sanitized = url.trim();
    // Try robust URL parsing first (supports https and ssh://)
    try {
      const normalized = sanitized.startsWith('git@')
        // Convert scp-like git@host:owner/repo.git to ssh://git@host/owner/repo.git for URL parsing
        ? sanitized.replace(/^git@/, 'ssh://git@').replace(':', '/')
        : sanitized;
      const u = new URL(normalized);
      const parts = u.pathname.replace(/^\/+/, '').split('/');
      const owner = parts[0];
      const repo = parts[1]?.replace(/\.git$/, '');
      if (owner && repo) {
        return `${owner}/${repo}`.replace(/[^A-Za-z0-9._/-]/g, '');
      }
    } catch {
      // fall through to regex fallback
    }
    // Fallback: accept trailing slash or extra segments after owner/repo
    const match = sanitized.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?(?:\/|[?#]|$)/);
    if (match?.[1]) {
      return match[1].replace(/[^A-Za-z0-9._/-]/g, '');
    }
    
    // If no match found, return empty string as fallback instead of sanitized input
    // to prevent potential injection of malformed repo paths
    return '';
}