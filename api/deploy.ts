/**
 * 🚀 Deployment API Endpoint
 * 
 * Handles deployment requests with Netlify and Vercel integration
 * Supports custom subdomain creation: nameoftheirchoice.zapdev.link
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ZapdevDeploymentManager } from '../lib/deployment/manager';
import {
  BaseDeploymentConfig,
  DeploymentPlatform,
  ZapdevDeploymentConfig,
  ZapdevDeploymentSecrets,
  DeploymentError,
  DomainConfigurationError,
  DeploymentAnalyticsEvent
} from '../lib/deployment/types';

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

      // Fire-and-forget analytics, but still await so errors bubble into the outer try/catch
      await fetch(`${this.host}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'zapdev-deployment-api/1.0.0',
        },
        body: JSON.stringify(payload),
      });    } catch {
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

// Runtime validation for critical environment variables
const validateEnvironmentVariables = (): {
  netlifyAccessToken: string;
  vercelAccessToken: string;
  defaultPlatform: DeploymentPlatform;
} => {
  const missingVars: string[] = [];
  
  const netlifyAccessToken = process.env.NETLIFY_ACCESS_TOKEN;
  const vercelAccessToken = process.env.VERCEL_ACCESS_TOKEN;
  const defaultPlatform = process.env.DEFAULT_DEPLOYMENT_PLATFORM as DeploymentPlatform;
  
  if (!netlifyAccessToken) {
    missingVars.push('NETLIFY_ACCESS_TOKEN');
  }
  
  if (!vercelAccessToken) {
    missingVars.push('VERCEL_ACCESS_TOKEN');
  }
  
  // Validate default platform if provided, otherwise default to 'vercel'
  const validPlatforms: DeploymentPlatform[] = ['netlify', 'vercel'];
  const finalDefaultPlatform = defaultPlatform && validPlatforms.includes(defaultPlatform) 
    ? defaultPlatform 
    : 'vercel';
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. ` +
      `Please set these variables before starting the deployment service.`;
    logger.error('Environment validation failed', new Error(errorMessage), { missingVars });
    throw new Error(errorMessage);
  }
  
  return {
    netlifyAccessToken: netlifyAccessToken!,
    vercelAccessToken: vercelAccessToken!,
    defaultPlatform: finalDefaultPlatform,
  };
};

// Validate environment variables
const validatedEnv = validateEnvironmentVariables();

// Extended configuration interface that includes runtime secrets
interface ZapdevDeploymentConfigWithSecrets extends ZapdevDeploymentConfig {
  netlify: {
    accessToken: string;
    teamId?: string;
  };
  vercel: {
    accessToken: string;
    teamId?: string;
  };
}

// Deployment manager configuration (with runtime secrets)
const deploymentConfig: ZapdevDeploymentConfigWithSecrets = {
  baseDomain: 'zapdev.link',
  netlify: {
    accessToken: validatedEnv.netlifyAccessToken,
    teamId: process.env.NETLIFY_TEAM_ID,
  },
  vercel: {
    accessToken: validatedEnv.vercelAccessToken,
    teamId: process.env.VERCEL_TEAM_ID,
  },
  defaults: {
    platform: validatedEnv.defaultPlatform,
    buildCommand: process.env.DEFAULT_BUILD_COMMAND || 'npm run build',
    outputDirectory: process.env.DEFAULT_OUTPUT_DIR || 'dist',
    nodeVersion: process.env.DEFAULT_NODE_VERSION || '18.x',
  },
};
// Deployment manager will be initialized in the handler
let deploymentManager: ZapdevDeploymentManager | null = null;


// Helper function to get or initialize deployment manager
function getDeploymentManager(): ZapdevDeploymentManager {
  if (!deploymentManager) {
    deploymentManager = new ZapdevDeploymentManager({
      config: deploymentConfig,
      analytics: { track: analytics.track.bind(analytics) },
      logger,
    });
  }
  return deploymentManager;
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

// Validation function to safely parse request body
function validateDeployRequest(body: unknown): DeployRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  
  const obj = body as Record<string, unknown>;
  
  // Action is required and must be one of the valid actions
  const validActions = ['deploy', 'status', 'setup-domain', 'verify-domain', 'delete', 'list'] as const;
  if (!obj.action || typeof obj.action !== 'string' || !(validActions as readonly string[]).includes(obj.action)) {
    return null;
  }
  
  // Validate optional fields with proper type checking
  const request: DeployRequest = {
    action: obj.action as DeployRequest['action']
  };
  
  if (obj.platform && typeof obj.platform === 'string') {
    const validPlatforms = ['netlify', 'vercel'];
    if (validPlatforms.includes(obj.platform)) {
      request.platform = obj.platform as DeploymentPlatform;
    }
  }
  
  if (obj.projectName && typeof obj.projectName === 'string') {
    request.projectName = obj.projectName;
  }
  
  if (obj.subdomain && typeof obj.subdomain === 'string') {
    request.subdomain = obj.subdomain;
  }
  
  if (obj.deploymentId && typeof obj.deploymentId === 'string') {
    request.deploymentId = obj.deploymentId;
  }
  
  if (obj.projectId && typeof obj.projectId === 'string') {
    request.projectId = obj.projectId;
  }
  
  if (obj.files && typeof obj.files === 'object' && obj.files !== null) {
    const files = obj.files as Record<string, unknown>;
    const validFiles = new Map<string, string>();
    for (const [key, value] of Object.entries(files)) {
      if (typeof key === 'string' && typeof value === 'string' && key.length > 0 && key.length < 256) {
        // Sanitize key to prevent object injection
        const sanitizedKey = key.replace(/[^a-zA-Z0-9._/-]/g, '');
        if (sanitizedKey === key) {
          validFiles.set(sanitizedKey, value);
        }
      }
    }
    if (validFiles.size > 0) {
      request.files = Object.fromEntries(validFiles);
    }
  }
  
  if (obj.gitRepo && typeof obj.gitRepo === 'object' && obj.gitRepo !== null) {
    const gitRepo = obj.gitRepo as Record<string, unknown>;
    if (gitRepo.url && typeof gitRepo.url === 'string') {
      request.gitRepo = {
        url: gitRepo.url,
      };
      
      if (gitRepo.branch && typeof gitRepo.branch === 'string') {
        request.gitRepo.branch = gitRepo.branch;
      }
      if (gitRepo.buildCommand && typeof gitRepo.buildCommand === 'string') {
        request.gitRepo.buildCommand = gitRepo.buildCommand;
      }
      if (gitRepo.outputDirectory && typeof gitRepo.outputDirectory === 'string') {
        request.gitRepo.outputDirectory = gitRepo.outputDirectory;
      }
    }
  }
  
  if (obj.environment && typeof obj.environment === 'object' && obj.environment !== null) {
    const environment = obj.environment as Record<string, unknown>;
    const validEnvironment = new Map<string, string>();
    for (const [key, value] of Object.entries(environment)) {
      if (typeof key === 'string' && typeof value === 'string' && key.length > 0 && key.length < 256) {
        // Sanitize key to prevent object injection
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '');
        if (sanitizedKey === key && sanitizedKey.length > 0) {
          validEnvironment.set(sanitizedKey, value);
        }
      }
    }
    if (validEnvironment.size > 0) {
      request.environment = Object.fromEntries(validEnvironment);
    }
  }
  
  return request;
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
    const body = req.method === 'POST' ? validateDeployRequest(req.body) : null;
    const action = body?.action || (req.query.action as string);
    
    // If POST method but body validation failed, return 400 error
    if (req.method === 'POST' && !body) {
      return res.status(400).json({ 
        error: 'Invalid request body format',
        details: 'Request body must be a valid JSON object with required fields'
      });
    }

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
        if (!body) {
          return res.status(400).json({ error: 'Deploy action requires valid POST body with required fields' });
        }
        return await handleDeploy(req, res, body);
      
      case 'status':
        return await handleStatus(req, res, body || { action: 'status' });
      
      case 'setup-domain':
        if (!body) {
          return res.status(400).json({ error: 'Setup-domain action requires valid POST body with required fields' });
        }
        return await handleSetupDomain(req, res, body);
      
      case 'verify-domain':
        if (!body) {
          return res.status(400).json({ error: 'Verify-domain action requires valid POST body with required fields' });
        }
        return await handleVerifyDomain(req, res, body);
      
      case 'delete':
        if (!body) {
          return res.status(400).json({ error: 'Delete action requires valid POST body with required fields' });
        }
        return await handleDelete(req, res, body);
      
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
  if (subdomain && (subdomain.length < 3 || subdomain.length > 63 || !/^[a-z0-9-]+$/i.test(subdomain) || subdomain.startsWith('-') || subdomain.endsWith('-'))) {
    return res.status(400).json({
      error: 'Invalid subdomain format. Must be 3-63 characters, alphanumeric and hyphens only, cannot start or end with hyphens.'
    });
  }

  const config: BaseDeploymentConfig = {
    platform,
    projectName,
    subdomain: subdomain || projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    files,
    gitRepo,
    environment,
  };

  const result = await getDeploymentManager().deploy(config);
  
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

  const result = await getDeploymentManager().getDeploymentStatus(platform, deploymentId);
  
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

  const result = await getDeploymentManager().setupCustomSubdomain(subdomain, platform, projectId);
  
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
  const result = await getDeploymentManager().verifyCustomDomain(domain, platform, projectId);
  
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

  const result = await getDeploymentManager().deleteDeployment(platform, deploymentId);
  
  return res.status(result.success ? 200 : 400).json({
    success: result.success,
    error: result.error,
  });
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  const limit = parseInt((req.query.limit as string) || '20');
  
  const manager = getDeploymentManager();
  const result = await manager.listAllDeployments(limit);
  
  return res.status(result.success ? 200 : 500).json({
    success: result.success,
    deployments: result.deployments,
    platforms: manager.getAvailablePlatforms(),
    error: result.error,
  });
}