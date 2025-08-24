/**
 * 🚀 Zapdev Deployment Manager
 * 
 * Unified deployment manager for Netlify and Vercel with custom subdomain support
 */

import {
  IDeploymentService,
  DeploymentPlatform,
  BaseDeploymentConfig,
  DeploymentResult,
  CustomDomainConfig,
  ZapdevDeploymentConfig,
  DeploymentAnalyticsEvent,
  DeploymentError,
  DomainConfigurationError
} from './types.js';

import { NetlifyDeploymentService } from './netlify.js';
import { VercelDeploymentService } from './vercel.js';

interface DeploymentManagerOptions {
  config: ZapdevDeploymentConfig;
  analytics?: {
    track: (event: DeploymentAnalyticsEvent) => Promise<void>;
  };
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, error?: unknown, meta?: Record<string, unknown>) => void;
  };
}

export class ZapdevDeploymentManager {
  private services: Map<DeploymentPlatform, IDeploymentService> = new Map();
  private config: ZapdevDeploymentConfig;
  private analytics?: DeploymentManagerOptions['analytics'];
  private logger?: DeploymentManagerOptions['logger'];

  constructor(options: DeploymentManagerOptions) {
    this.config = options.config;
    this.analytics = options.analytics;
    this.logger = options.logger;

    // Initialize deployment services
    this.initializeServices();
  }

  private initializeServices(): void {
    // Initialize Netlify service
    if (this.config.netlify.accessToken) {
      const netlifyService = new NetlifyDeploymentService(
        this.config.netlify.accessToken,
        this.config.netlify.teamId
      );
      this.services.set('netlify', netlifyService);
      this.logger?.info('Netlify deployment service initialized');
    }

    // Initialize Vercel service
    if (this.config.vercel.accessToken) {
      const vercelService = new VercelDeploymentService(
        this.config.vercel.accessToken,
        this.config.vercel.teamId
      );
      this.services.set('vercel', vercelService);
      this.logger?.info('Vercel deployment service initialized');
    }

    if (this.services.size === 0) {
      throw new Error('No deployment services configured. Please provide access tokens for Netlify or Vercel.');
    }
  }

  /**
   * Deploy a project to the specified platform
   */
  async deploy(config: BaseDeploymentConfig): Promise<DeploymentResult> {
    const startTime = Date.now();
    
    // Validate subdomain
    if (config.subdomain && !this.isValidSubdomain(config.subdomain)) {
      throw new DeploymentError(
        'Invalid subdomain format. Must be 3-63 characters, alphanumeric and hyphens only.',
        config.platform,
        'INVALID_SUBDOMAIN'
      );
    }

    const service = this.services.get(config.platform);
    if (!service) {
      throw new DeploymentError(
        `${config.platform} service not configured`,
        config.platform,
        'SERVICE_NOT_CONFIGURED'
      );
    }

    try {
      this.logger?.info('Starting deployment', {
        platform: config.platform,
        project: config.projectName,
        subdomain: config.subdomain
      });

      // Track deployment start
      await this.trackAnalytics({
        event: 'deployment_started',
        properties: {
          platform: config.platform,
          project_name: config.projectName,
          subdomain: config.subdomain || '',
          has_git_repo: !!config.gitRepo,
          has_files: !!config.files
        }
      });

      // Perform deployment
      const result = await service.deploy(config);
      
      const duration = Date.now() - startTime;

      // Track deployment completion
      await this.trackAnalytics({
        event: result.success ? 'deployment_completed' : 'deployment_failed',
        properties: {
          platform: config.platform,
          project_name: config.projectName,
          subdomain: config.subdomain || '',
          deployment_id: result.deploymentId,
          duration_ms: duration,
          success: result.success,
          error_message: result.error,
          custom_domain: result.customDomain,
          status: result.status
        }
      });

      this.logger?.info('Deployment completed', {
        platform: config.platform,
        success: result.success,
        deploymentId: result.deploymentId,
        url: result.url,
        customDomain: result.customDomain,
        duration: `${duration}ms`
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track deployment failure
      await this.trackAnalytics({
        event: 'deployment_failed',
        properties: {
          platform: config.platform,
          project_name: config.projectName,
          subdomain: config.subdomain || '',
          duration_ms: duration,
          success: false,
          error_message: error instanceof Error ? error.message : String(error)
        }
      });

      this.logger?.error('Deployment failed', error, {
        platform: config.platform,
        project: config.projectName,
        duration: `${duration}ms`
      });

      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(platform: DeploymentPlatform, deploymentId: string): Promise<DeploymentResult> {
    const service = this.services.get(platform);
    if (!service) {
      throw new DeploymentError(
        `${platform} service not configured`,
        platform,
        'SERVICE_NOT_CONFIGURED'
      );
    }

    return await service.getDeploymentStatus(deploymentId);
  }

  /**
   * Setup custom subdomain (nameoftheirchoice.zapdev.link)
   */
  async setupCustomSubdomain(
    subdomain: string,
    platform: DeploymentPlatform,
    projectId?: string
  ): Promise<{
    success: boolean;
    domain?: string;
    dnsInstructions?: {
      type: string;
      name: string;
      value: string;
      description: string;
    }[];
    error?: string;
  }> {
    try {
      // Validate subdomain
      if (!this.isValidSubdomain(subdomain)) {
        throw new DomainConfigurationError(
          'Invalid subdomain format. Must be 3-63 characters, alphanumeric and hyphens only.',
          `${subdomain}.${this.config.baseDomain}`,
          platform,
          'INVALID_SUBDOMAIN'
        );
      }

      const service = this.services.get(platform);
      if (!service) {
        throw new DeploymentError(
          `${platform} service not configured`,
          platform,
          'SERVICE_NOT_CONFIGURED'
        );
      }

      const fullDomain = `${subdomain}.${this.config.baseDomain}`;
      
      this.logger?.info('Setting up custom subdomain', {
        subdomain,
        fullDomain,
        platform,
        projectId
      });

      // Setup domain on the platform
      const result = await service.setupCustomDomain({
        subdomain,
        fullDomain,
        verified: false
      }, projectId);

      if (result.success) {
        // Track domain configuration
        await this.trackAnalytics({
          event: 'domain_configured',
          properties: {
            platform,
            subdomain,
            custom_domain: fullDomain,
            project_id: projectId,
            success: true
          }
        });

        // Create DNS instructions for zapdev.link management
        const dnsInstructions = this.createDNSInstructions(subdomain, platform, result.dnsRecords);

        this.logger?.info('Custom subdomain configured', {
          domain: fullDomain,
          platform,
          verified: result.verified
        });

        return {
          success: true,
          domain: fullDomain,
          dnsInstructions
        };
      } else {
        await this.trackAnalytics({
          event: 'domain_configured',
          properties: {
            platform,
            subdomain,
            custom_domain: fullDomain,
            project_id: projectId,
            success: false,
            error_message: result.error
          }
        });

        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      this.logger?.error('Failed to setup custom subdomain', error, {
        subdomain,
        platform,
        projectId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Verify custom domain
   */
  async verifyCustomDomain(
    domain: string,
    platform: DeploymentPlatform,
    projectId?: string
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    const service = this.services.get(platform);
    if (!service) {
      throw new DeploymentError(
        `${platform} service not configured`,
        platform,
        'SERVICE_NOT_CONFIGURED'
      );
    }

    try {
      const result = await service.verifyCustomDomain(domain, projectId);
      
      // Track verification
      await this.trackAnalytics({
        event: 'domain_verified',
        properties: {
          platform,
          custom_domain: domain,
          project_id: projectId,
          success: result.success,
          verified: result.verified,
          error_message: result.error
        }
      });

      this.logger?.info('Domain verification completed', {
        domain,
        platform,
        verified: result.verified,
        success: result.success
      });

      return result;
    } catch (error) {
      this.logger?.error('Domain verification failed', error, {
        domain,
        platform,
        projectId
      });

      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(platform: DeploymentPlatform, deploymentId: string): Promise<{ success: boolean; error?: string }> {
    const service = this.services.get(platform);
    if (!service) {
      throw new DeploymentError(
        `${platform} service not configured`,
        platform,
        'SERVICE_NOT_CONFIGURED'
      );
    }

    try {
      const result = await service.deleteDeployment(deploymentId);
      
      this.logger?.info('Deployment deleted', {
        platform,
        deploymentId,
        success: result.success
      });

      return result;
    } catch (error) {
      this.logger?.error('Failed to delete deployment', error, {
        platform,
        deploymentId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * List deployments from all platforms
   */
  async listAllDeployments(limit = 20): Promise<{
    success: boolean;
    deployments?: Array<{
      id: string;
      name: string;
      url: string;
      platform: DeploymentPlatform;
      status: import('./types.js').DeploymentStatus;
      createdAt: Date;
    }>;
    error?: string;
  }> {
    try {
      const allDeployments: Array<{
        id: string;
        name: string;
        url: string;
        platform: DeploymentPlatform;
        status: import('./types').DeploymentStatus;
        createdAt: Date;
      }> = [];
      
      for (const [platform, service] of this.services.entries()) {
        try {
          const result = await service.listDeployments(limit);
          if (result.success && result.deployments) {
            const platformDeployments = result.deployments.map(dep => ({
              ...dep,
              platform
            }));
            allDeployments.push(...platformDeployments);
          }
        } catch (error) {
          this.logger?.warn(`Failed to list deployments from ${platform}`, { error: String(error) });
        }
      }

      // Sort by creation date (newest first)
      allDeployments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        success: true,
        deployments: allDeployments.slice(0, limit)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms(): DeploymentPlatform[] {
    return Array.from(this.services.keys());
  }

  /**
   * Check if a subdomain is valid
   */
  private isValidSubdomain(subdomain: string): boolean {
    // RFC compliant subdomain validation
    if (subdomain.length < 3 || subdomain.length > 63) return false;
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) return false;
    
    const validPattern = /^[a-z0-9-]+$/i;
    return validPattern.test(subdomain);
  }

  /**
   * Create DNS instructions for zapdev.link management
   */
  private createDNSInstructions(
    subdomain: string,
    platform: DeploymentPlatform,
    platformDnsRecords?: CustomDomainConfig['dnsRecords']
  ): Array<{
    type: string;
    name: string;
    value: string;
    description: string;
  }> {
    const instructions = [];

    if (platform === 'netlify') {
      instructions.push({
        type: 'CNAME',
        name: subdomain,
        value: 'your-netlify-site.netlify.app',
        description: `Point ${subdomain}.zapdev.link to your Netlify site`
      });
    } else if (platform === 'vercel') {
      instructions.push({
        type: 'CNAME',
        name: subdomain,
        value: 'cname.vercel-dns.com',
        description: `Point ${subdomain}.zapdev.link to Vercel's CDN`
      });
    }

    // Add platform-specific DNS records if available
    if (platformDnsRecords) {
      platformDnsRecords.forEach(record => {
        instructions.push({
          type: record.type,
          name: record.name,
          value: record.value,
          description: `${platform} DNS record: ${record.type} record for ${record.name}`
        });
      });
    }

    return instructions;
  }

  /**
   * Track analytics events
   */
  private async trackAnalytics(event: DeploymentAnalyticsEvent): Promise<void> {
    if (!this.analytics) return;

    try {
      await this.analytics.track(event);
    } catch (error) {
      this.logger?.warn('Failed to track analytics event', { 
        event: event.event, 
        error: String(error) 
      });
    }
  }
}