/**
 * 🚀 Deployment API Endpoint
 * 
 * Handles deployment requests with Netlify and Vercel integration
 * Supports custom subdomain creation: nameoftheirchoice.zapdev.link
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ZapdevDeploymentManager } from '../../lib/deployment/manager.js';
import {
  BaseDeploymentConfig,
  DeploymentPlatform,
  ZapdevDeploymentConfig,
  DeploymentError,
  DomainConfigurationError,
  DeploymentAnalyticsEvent
} from '../../lib/deployment/types.js';

// PostHog Analytics Integration (matching zapdev patterns)
class PostHogAnalytics {
  private apiKey: string | undefined;
  private host: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.VITE_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_API_KEY;
    this.host = process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
    this.enabled = !!this.apiKey && process.env.NODE_ENV !== 'test';
  }

  async track(event: DeploymentAnalyticsEvent): Promise<void> {
    if (!this.enabled || !this.apiKey) return;

    try {
      const payload = {
        api_key: this.apiKey,
        event: event.event,
        properties: {
          ...event.properties,
          $lib: 'zapdev-deployment-api',
          $lib_version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
        distinct_id: event.properties.user_id || 'deployment-api',
      };

      fetch(`${this.host}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'zapdev-deployment-api/1.0.0',
        },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently fail analytics
      });
    } catch {
      // Silently fail analytics
    }
  }
}

// Enhanced Logger
const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`🟢 [${timestamp}] DEPLOY-API INFO: ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(`🟡 [${timestamp}] DEPLOY-API WARN: ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`🔴 [${timestamp}] DEPLOY-API ERROR: ${message} - ${errorMsg}`, meta ? JSON.stringify(meta) : '');
  },
};

// Initialize analytics
const analytics = new PostHogAnalytics();

// Deployment manager configuration
const deploymentConfig: ZapdevDeploymentConfig = {
  baseDomain: 'zapdev.link',
  netlify: {
    accessToken: process.env.NETLIFY_ACCESS_TOKEN || '',
    teamId: process.env.NETLIFY_TEAM_ID,
  },
  vercel: {
    accessToken: process.env.VERCEL_ACCESS_TOKEN || '',
    teamId: process.env.VERCEL_TEAM_ID,
  },
  defaults: {
    platform: (process.env.DEFAULT_DEPLOYMENT_PLATFORM as DeploymentPlatform) || 'vercel',
    buildCommand: process.env.DEFAULT_BUILD_COMMAND || 'npm run build',
    outputDirectory: process.env.DEFAULT_OUTPUT_DIR || 'dist',
    nodeVersion: process.env.DEFAULT_NODE_VERSION || '18.x',
  },
};

// Initialize deployment manager
let deploymentManager: ZapdevDeploymentManager;

try {
  deploymentManager = new ZapdevDeploymentManager({
    config: deploymentConfig,
    analytics: { track: analytics.track.bind(analytics) },
    logger,
  });
} catch (error) {
  logger.error('Failed to initialize deployment manager', error);
}

interface DeployRequest {
  action: 'deploy' | 'status' | 'setup-domain' | 'verify-domain' | 'delete' | 'list';
  platform?: DeploymentPlatform;
  projectName?: string;
  subdomain?: string; // For nameoftheirchoice.zapdev.link
  deploymentId?: string;
  projectId?: string;
  files?: Record<string, string>;
  gitRepo?: {
    url: string;
    branch?: string;
    buildCommand?: string;
    outputDirectory?: string;
  };
  environment?: Record<string, string>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if deployment manager is initialized
    if (!deploymentManager) {
      throw new Error('Deployment manager not initialized. Please check environment variables.');
    }

    const body = req.method === 'POST' ? req.body as DeployRequest : null;
    const action = body?.action || (req.query.action as string);

    if (!action) {
      return res.status(400).json({ 
        error: 'Missing action parameter',
        availableActions: ['deploy', 'status', 'setup-domain', 'verify-domain', 'delete', 'list']
      });
    }

    logger.info('Deployment API request', { 
      action, 
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
    });

    switch (action) {
      case 'deploy':
        return await handleDeploy(req, res, body!);
      
      case 'status':
        return await handleStatus(req, res, body || { action: 'status' });
      
      case 'setup-domain':
        return await handleSetupDomain(req, res, body!);
      
      case 'verify-domain':
        return await handleVerifyDomain(req, res, body!);
      
      case 'delete':
        return await handleDelete(req, res, body!);
      
      case 'list':
        return await handleList(req, res);
      
      default:
        return res.status(400).json({ 
          error: `Unknown action: ${action}`,
          availableActions: ['deploy', 'status', 'setup-domain', 'verify-domain', 'delete', 'list']
        });
    }
  } catch (error) {
    logger.error('API request failed', error);
    
    if (error instanceof DeploymentError || error instanceof DomainConfigurationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code || 'DEPLOYMENT_ERROR',
        platform: error.platform
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleDeploy(req: VercelRequest, res: VercelResponse, body: DeployRequest) {
  const { platform, projectName, subdomain, files, gitRepo, environment } = body;

  if (!platform || !projectName) {
    return res.status(400).json({
      error: 'Missing required fields: platform, projectName'
    });
  }

  if (!files && !gitRepo) {
    return res.status(400).json({
      error: 'Either files or gitRepo must be provided'
    });
  }

  // Validate subdomain format
  if (subdomain && !/^[a-z0-9-]{3,63}$/i.test(subdomain)) {
    return res.status(400).json({
      error: 'Invalid subdomain format. Must be 3-63 characters, alphanumeric and hyphens only.'
    });
  }

  const config: BaseDeploymentConfig = {
    platform,
    projectName,
    subdomain,
    files,
    gitRepo,
    environment,
  };

  const result = await deploymentManager.deploy(config);
  
  return res.status(result.success ? 200 : 500).json({
    success: result.success,
    deploymentId: result.deploymentId,
    url: result.url,
    customDomain: result.customDomain,
    status: result.status,
    platform: result.platform,
    error: result.error,
    metadata: result.metadata,
  });
}

async function handleStatus(req: VercelRequest, res: VercelResponse, body: DeployRequest) {
  const platform = body.platform || (req.query.platform as DeploymentPlatform);
  const deploymentId = body.deploymentId || (req.query.deploymentId as string);

  if (!platform || !deploymentId) {
    return res.status(400).json({
      error: 'Missing required fields: platform, deploymentId'
    });
  }

  const result = await deploymentManager.getDeploymentStatus(platform, deploymentId);
  
  return res.status(200).json({
    success: result.success,
    deploymentId: result.deploymentId,
    url: result.url,
    status: result.status,
    platform: result.platform,
    error: result.error,
    metadata: result.metadata,
  });
}

async function handleSetupDomain(req: VercelRequest, res: VercelResponse, body: DeployRequest) {
  const { subdomain, platform, projectId } = body;

  if (!subdomain || !platform) {
    return res.status(400).json({
      error: 'Missing required fields: subdomain, platform'
    });
  }

  const result = await deploymentManager.setupCustomSubdomain(subdomain, platform, projectId);
  
  return res.status(result.success ? 200 : 400).json({
    success: result.success,
    domain: result.domain,
    dnsInstructions: result.dnsInstructions,
    error: result.error,
  });
}

async function handleVerifyDomain(req: VercelRequest, res: VercelResponse, body: DeployRequest) {
  const { subdomain, platform, projectId } = body;
  
  if (!subdomain || !platform) {
    return res.status(400).json({
      error: 'Missing required fields: subdomain, platform'
    });
  }

  const domain = `${subdomain}.zapdev.link`;
  const result = await deploymentManager.verifyCustomDomain(domain, platform, projectId);
  
  return res.status(200).json({
    success: result.success,
    verified: result.verified,
    domain,
    error: result.error,
  });
}

async function handleDelete(req: VercelRequest, res: VercelResponse, body: DeployRequest) {
  const { platform, deploymentId } = body;

  if (!platform || !deploymentId) {
    return res.status(400).json({
      error: 'Missing required fields: platform, deploymentId'
    });
  }

  const result = await deploymentManager.deleteDeployment(platform, deploymentId);
  
  return res.status(result.success ? 200 : 400).json({
    success: result.success,
    error: result.error,
  });
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  const limit = parseInt((req.query.limit as string) || '20');
  
  const result = await deploymentManager.listAllDeployments(limit);
  
  return res.status(result.success ? 200 : 500).json({
    success: result.success,
    deployments: result.deployments,
    platforms: deploymentManager.getAvailablePlatforms(),
    error: result.error,
  });
}