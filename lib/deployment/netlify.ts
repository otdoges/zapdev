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

// Security constants for input validation
const MAX_PROJECT_NAME_LENGTH = 64;
const MAX_SUBDOMAIN_LENGTH = 63;
const GIT_URL_REGEX = /^https?:\/\/(?:github\.com|gitlab\.com|bitbucket\.org)\/[a-zA-Z0-9._-]{1,100}\/[a-zA-Z0-9._-]{1,100}(?:\.git)?$/u;

/**
 * Sanitizes a string by trimming and converting to lowercase
 */
function sanitizeString(raw: string): string {
  return raw.toLowerCase().trim();
}

/**
 * Validates subdomain format and length using string validation
 */
function validateSubdomain(raw: string): void {
  if (raw.length > MAX_SUBDOMAIN_LENGTH) {
    throw new DeploymentError('Invalid subdomain format.', 'netlify', 'INVALID_CONFIG');
  }
  
  // Validate character set manually for security
  const validChars = /^[a-z0-9-]+$/;
  if (!validChars.test(raw)) {
    throw new DeploymentError('Invalid subdomain format.', 'netlify', 'INVALID_CONFIG');
  }
  
  // Check start and end characters
  if (raw.startsWith('-') || raw.endsWith('-')) {
    throw new DeploymentError('Invalid subdomain format.', 'netlify', 'INVALID_CONFIG');
  }
  
  // Check for consecutive hyphens
  if (raw.includes('--')) {
    throw new DeploymentError('Invalid subdomain format.', 'netlify', 'INVALID_CONFIG');
  }
}

/**
 * Validates git repository URL format
 */
function validateGitUrl(url: string): void {
  if (!GIT_URL_REGEX.test(url)) {
    throw new DeploymentError('Invalid git repository URL format.', 'netlify', 'INVALID_CONFIG');
  }
}

/**
 * Sanitizes project name with length enforcement
 */
function sanitizeProjectName(raw: string): string {
  const sanitized = sanitizeString(raw);
  return sanitized.slice(0, MAX_PROJECT_NAME_LENGTH);
}

interface NetlifyDeploy {
  id: string;
  site_id?: string;
  url: string;
  deploy_url: string;
  admin_url: string;
  state:
    | 'new'
    | 'pending_review'
    | 'accepted'
    | 'rejected'
    | 'enqueued'
    | 'preparing'
    | 'prepared'
    | 'uploading'
    | 'uploaded'
    | 'processing'
    | 'processed'
    | 'building'
    | 'ready'
    | 'retrying'
    | 'error'
    | 'canceled'
    | string; // forward-compat
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

  private validateAndSanitizeConfig(config: BaseDeploymentConfig): BaseDeploymentConfig {
    // Sanitize and validate project name
    if (!config.projectName || typeof config.projectName !== 'string') {
      throw new DeploymentError('Project name is required and must be a string', 'netlify', 'INVALID_CONFIG');
    }
    const safeProjectName = sanitizeProjectName(config.projectName);
    
    // Validate subdomain if provided
    if (config.subdomain) {
      if (typeof config.subdomain !== 'string') {
        throw new DeploymentError('Subdomain must be a string', 'netlify', 'INVALID_CONFIG');
      }
      const sanitizedSubdomain = sanitizeString(config.subdomain);
      validateSubdomain(sanitizedSubdomain);
      config.subdomain = sanitizedSubdomain;
    }
    
    // Validate git repository URL if provided
    if (config.gitRepo?.url) {
      validateGitUrl(config.gitRepo.url);
    }
    
    return {
      ...config,
      projectName: safeProjectName
    };
  }

  async deploy(config: BaseDeploymentConfig): Promise<DeploymentResult> {
    const startTime = Date.now();
    
    try {
      // Validate and sanitize inputs
      const validatedConfig = this.validateAndSanitizeConfig(config);
      
      // If files are provided, deploy directly
      if (validatedConfig.files) {
        return await this.deployFiles(validatedConfig);
      }
      
      // If git repo is provided, create a site with git integration
      if (validatedConfig.gitRepo) {
        return await this.deployFromGit(validatedConfig);
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
        `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      throw new DeploymentError(
        'Failed to create deployment',
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
      throw new DeploymentError(
        'Failed to create site',
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
      throw new DeploymentError(
        'Failed to create site',
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
          'Failed to get deployment status',
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
        throw new DomainConfigurationError(
          'Failed to configure custom domain',
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
          error: 'Failed to get site info'
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
          error: 'Failed to find deployment'
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
          error: 'Failed to delete site'
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
          error: 'Failed to list sites'
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
    if (url.includes('github.com')) return 'github';
    if (url.includes('gitlab.com')) return 'gitlab';
    if (url.includes('bitbucket.org')) return 'bitbucket';
    return 'github'; // default
  }

  private extractRepoPath(url: string): string {
    // Extract owner/repo from git URL
    const match = url.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?(?:[?#]|$)/);
    return match?.[1] || url;
  }
}