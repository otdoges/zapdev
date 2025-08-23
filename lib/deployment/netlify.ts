/**
 * 🌐 Netlify Deployment Service
 * 
 * Handles deployment to Netlify with custom subdomain support for zapdev.link
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

// For URL parsing
// Node.js global URL is available, but add import if needed:
// import { URL } from 'url';
interface NetlifyDeploy {
  id: string;
  url: string;
  deploy_url: string;
  admin_url: string;
  state: 'new' | 'building' | 'ready' | 'error' | 'uploading';
  name: string;
  created_at: string;
  build_id?: string;
  error_message?: string;
}

interface NetlifySite {
  id: string;
  name: string;
  url: string;
  admin_url: string;
  custom_domain?: string;
  state: 'current' | 'deleted';
  created_at: string;
}

export class NetlifyDeploymentService implements IDeploymentService {
  public readonly platform: DeploymentPlatform = 'netlify';
  
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
    return 'https://api.netlify.com/api/v1';
  }

  private mapStatus(netlifyState: string): DeploymentStatus {
    switch (netlifyState) {
      case 'new':
      case 'uploading':
        return 'pending';
      case 'building':
        return 'building';
      case 'ready':
        return 'ready';
      case 'error':
        return 'error';
      default:
        return 'pending';
    }
  }

  async deploy(config: BaseDeploymentConfig): Promise<DeploymentResult> {
    const startTime = Date.now();
    
    try {
      // If files are provided, deploy directly
      if (config.files) {
        return await this.deployFiles(config);
      }
      
      // If git repo is provided, create a site with git integration
      if (config.gitRepo) {
        return await this.deployFromGit(config);
      }
      
      throw new DeploymentError(
        'Either files or gitRepo must be provided for deployment',
        'netlify',
        'INVALID_CONFIG'
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof DeploymentError) {
        throw error;
      }
      
      throw new DeploymentError(
        `Netlify deployment failed: ${error instanceof Error ? error.message : String(error)}`,
        'netlify',
        'DEPLOYMENT_FAILED',
        { error, duration }
      );
    }
  }

  private async deployFiles(config: BaseDeploymentConfig): Promise<DeploymentResult> {
    const files = config.files!;
    
    // Create a new site first
    const site = await this.createSite(config.projectName);
    
    // Prepare files for deployment (FormData not needed for this implementation)
    
    // Create a zip-like structure for Netlify
    const fileEntries = Object.entries(files).map(([path, content]) => ({
      path: path.startsWith('/') ? path.slice(1) : path,
      content
    }));
    
    // Create a simple deployment
    const deployResponse = await fetch(`${this.baseUrl}/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        files: Object.fromEntries(
          fileEntries.map(({ path, content }) => [path, content])
        ),
        async: false
      })
    });

    if (!deployResponse.ok) {
      const error = await deployResponse.text();
      throw new DeploymentError(
        `Failed to create deployment: ${error}`,
        'netlify',
        'DEPLOY_FAILED'
      );
    }

    const deploy: NetlifyDeploy = await deployResponse.json();
    
    // Setup custom domain if needed
    let customDomain: string | undefined;
    if (config.subdomain) {
      const domainResult = await this.setupCustomDomain({
        subdomain: config.subdomain,
        fullDomain: `${config.subdomain}.zapdev.link`,
        verified: false
      }, site.id);
      
      if (domainResult.success) {
        customDomain = domainResult.domain;
      }
    }

    return {
      success: true,
      deploymentId: deploy.id,
      url: deploy.deploy_url,
      customDomain,
      status: this.mapStatus(deploy.state),
      platform: 'netlify',
      metadata: {
        siteId: site.id,
        adminUrl: deploy.admin_url,
        netlifyUrl: deploy.url
      }
    };
  }

  private async deployFromGit(config: BaseDeploymentConfig): Promise<DeploymentResult> {
    const gitRepo = config.gitRepo!;
    
    // Create site with git repo
    const siteResponse = await fetch(`${this.baseUrl}/sites`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        name: config.projectName,
        repo: {
          provider: this.extractGitProvider(gitRepo.url),
          repo: this.extractRepoPath(gitRepo.url),
          branch: gitRepo.branch || 'main',
          cmd: gitRepo.buildCommand || 'npm run build',
          dir: gitRepo.outputDirectory || 'dist'
        },
        build_settings: {
          cmd: gitRepo.buildCommand || 'npm run build',
          publish_dir: gitRepo.outputDirectory || 'dist'
        }
      })
    });

    if (!siteResponse.ok) {
      const error = await siteResponse.text();
      throw new DeploymentError(
        `Failed to create site: ${error}`,
        'netlify',
        'SITE_CREATION_FAILED'
      );
    }

    const site: NetlifySite = await siteResponse.json();
    
    // Get the latest deploy
    const deploysResponse = await fetch(`${this.baseUrl}/sites/${site.id}/deploys?per_page=1`, {
      headers: this.headers
    });
    
    const deploys: NetlifyDeploy[] = await deploysResponse.json();
    const latestDeploy = deploys[0];
    
    // Setup custom domain if needed
    let customDomain: string | undefined;
    if (config.subdomain) {
      const domainResult = await this.setupCustomDomain({
        subdomain: config.subdomain,
        fullDomain: `${config.subdomain}.zapdev.link`,
        verified: false
      }, site.id);
      
      if (domainResult.success) {
        customDomain = domainResult.domain;
      }
    }

    return {
      success: true,
      deploymentId: latestDeploy?.id || site.id,
      url: site.url,
      customDomain,
      status: latestDeploy ? this.mapStatus(latestDeploy.state) : 'pending',
      platform: 'netlify',
      metadata: {
        siteId: site.id,
        adminUrl: site.admin_url,
        gitRepo: gitRepo.url
      }
    };
  }

  private async createSite(name: string): Promise<NetlifySite> {
    const response = await fetch(`${this.baseUrl}/sites`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        name: name,
        build_settings: {}
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new DeploymentError(
        `Failed to create site: ${error}`,
        'netlify',
        'SITE_CREATION_FAILED'
      );
    }

    return await response.json();
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/deploys/${deploymentId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new DeploymentError(
          `Failed to get deployment status: ${response.statusText}`,
          'netlify',
          'STATUS_FETCH_FAILED'
        );
      }

      const deploy: NetlifyDeploy = await response.json();

      return {
        success: deploy.state === 'ready',
        deploymentId: deploy.id,
        url: deploy.deploy_url,
        status: this.mapStatus(deploy.state),
        platform: 'netlify',
        error: deploy.error_message,
        metadata: {
          adminUrl: deploy.admin_url,
          buildId: deploy.build_id
        }
      };
    } catch (error) {
      if (error instanceof DeploymentError) {
        throw error;
      }
      
      throw new DeploymentError(
        `Failed to get deployment status: ${error instanceof Error ? error.message : String(error)}`,
        'netlify',
        'STATUS_ERROR'
      );
    }
  }

  async setupCustomDomain(config: CustomDomainConfig, siteId?: string): Promise<{
    success: boolean;
    domain?: string;
    verified?: boolean;
    dnsRecords?: CustomDomainConfig['dnsRecords'];
    error?: string;
  }> {
    try {
      if (!siteId) {
        throw new DomainConfigurationError(
          'Site ID is required for Netlify domain setup',
          config.fullDomain,
          'netlify',
          'MISSING_SITE_ID'
        );
      }

      // Add custom domain to the site
      const response = await fetch(`${this.baseUrl}/sites/${siteId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          custom_domain: config.fullDomain
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new DomainConfigurationError(
          `Failed to configure custom domain: ${error}`,
          config.fullDomain,
          'netlify',
          'DOMAIN_CONFIG_FAILED'
        );
      }

      await response.json();

      // Get DNS records for the domain
      const dnsResponse = await fetch(`${this.baseUrl}/sites/${siteId}/dns`, {
        headers: this.headers
      });

      let dnsRecords: CustomDomainConfig['dnsRecords'] = [];
      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json();
        dnsRecords = dnsData.records?.map((record: {
          type: string;
          hostname: string;
          value: string;
        }) => ({
          type: record.type,
          name: record.hostname,
          value: record.value
        })) || [];
      }

      return {
        success: true,
        domain: config.fullDomain,
        verified: false, // Will need separate verification
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

  async verifyCustomDomain(domain: string, siteId?: string): Promise<{
    success: boolean;
    verified: boolean;
    error?: string;
  }> {
    try {
      if (!siteId) {
        return {
          success: false,
          verified: false,
          error: 'Site ID is required for domain verification'
        };
      }

      // Get site info to check domain status
      const response = await fetch(`${this.baseUrl}/sites/${siteId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        return {
          success: false,
          verified: false,
          error: `Failed to get site info: ${response.statusText}`
        };
      }

      const site: NetlifySite = await response.json();
      const verified = site.custom_domain === domain;

      return {
        success: true,
        verified
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
      // For Netlify, we need to delete the site, not just the deployment
      // First, get the deploy to find the site ID
      const deployResponse = await fetch(`${this.baseUrl}/deploys/${deploymentId}`, {
        headers: this.headers
      });

      if (!deployResponse.ok) {
        return {
          success: false,
          error: `Failed to find deployment: ${deployResponse.statusText}`
        };
      }

      const deploy: NetlifyDeploy = await deployResponse.json();
      
      // Ensure we have the site ID from the deployment
      const siteId = deploy.site_id;
      if (!siteId) {
        return {
          success: false,
          error: 'Site ID not found in deployment data'
        };
      }
      
      // Delete the site (which will delete all deployments)
      const deleteResponse = await fetch(`${this.baseUrl}/sites/${siteId}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!deleteResponse.ok) {
        return {
          success: false,
          error: `Failed to delete site: ${deleteResponse.statusText}`
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
      const response = await fetch(`${this.baseUrl}/sites?per_page=${limit}`, {
        headers: this.headers
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to list sites: ${response.statusText}`
        };
      }

      const sites: NetlifySite[] = await response.json();

      const deployments = sites.map(site => ({
        id: site.id,
        name: site.name,
        url: site.url,
        status: 'ready' as DeploymentStatus, // Sites are generally ready
        createdAt: new Date(site.created_at)
      }));

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
      // Try to parse the URL (supports https/git:///ssh; fallback for git@ style)
      let hostname = '';
      try {
        // Handle web and git URLs (e.g., https://github.com/..., git://github.com/...)
        hostname = new URL(url).hostname.toLowerCase();
      } catch {
        // Fallback for git@github.com:owner/repo.git
        // E.g. git@github.com:owner/repo.git or ssh://git@github.com/owner/repo.git
        const match = url.match(/@([a-zA-Z0-9.\-]+)[/:]/);
        if (match) hostname = match[1].toLowerCase();
      }
      if (hostname === 'github.com') return 'github';
      if (hostname === 'gitlab.com') return 'gitlab';
      if (hostname === 'bitbucket.org') return 'bitbucket';
      return 'github'; // default
    } catch {
      // Fallback to original heuristic
      if (url.includes('github.com')) return 'github';
      if (url.includes('gitlab.com')) return 'gitlab';
      if (url.includes('bitbucket.org')) return 'bitbucket';
      return 'github';
    }
  }

  private extractRepoPath(url: string): string {
    // Extract owner/repo from git URL
    const match = url.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?(?:[?#]|$)/);
    return match?.[1] || url;
  }
}