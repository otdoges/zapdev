/**
 * 🌐 Domains API Endpoint
 * 
 * Dedicated endpoint for managing zapdev.link subdomains
 * Supports both Netlify and Vercel platform integration
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ZapdevDeploymentManager } from '../lib/deployment/manager';
import {
  DeploymentPlatform,
  ZapdevDeploymentConfig,
  ZapdevDeploymentSecrets,
  DomainConfigurationError,
  DeploymentAnalyticsEvent
} from '../lib/deployment/types';

// PostHog Analytics Integration
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
          $lib: 'zapdev-domains-api',
          $lib_version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
        distinct_id: event.properties.user_id || 'domains-api',
      };

      fetch(`${this.host}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'zapdev-domains-api/1.0.0',
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

// Logger
const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`🟢 [${timestamp}] DOMAINS-API INFO: ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(`🟡 [${timestamp}] DOMAINS-API WARN: ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`🔴 [${timestamp}] DOMAINS-API ERROR: ${message} - ${errorMsg}`, meta ? JSON.stringify(meta) : '');
  },
};

// Initialize analytics
const analytics = new PostHogAnalytics();

// Security constants for subdomain validation
const SUBDOMAIN_MIN_LENGTH = 3;
const SUBDOMAIN_MAX_LENGTH = 63;
// Simple safe regex pattern - no quantifiers with potential backtracking
const SUBDOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i;
const RESERVED_SUBDOMAINS = [
  'api', 'www', 'mail', 'ftp', 'admin', 'app', 'dev', 'test', 'staging',
  'blog', 'docs', 'help', 'support', 'status', 'portal', 'dashboard'
];

// Deployment manager configuration
const deploymentConfig: ZapdevDeploymentConfig = {
  baseDomain: 'zapdev.link',
  netlify: {
    teamId: process.env.NETLIFY_TEAM_ID,
  },
  vercel: {
    teamId: process.env.VERCEL_TEAM_ID,
  },
  defaults: {
    platform: (process.env.DEFAULT_DEPLOYMENT_PLATFORM as DeploymentPlatform) || 'vercel',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    nodeVersion: '18.x',
  },
};

// Deployment secrets (sensitive data)
const deploymentSecrets: ZapdevDeploymentSecrets = {
  netlify: {
    accessToken: process.env.NETLIFY_ACCESS_TOKEN || '',
    teamId: process.env.NETLIFY_TEAM_ID,
  },
  vercel: {
    accessToken: process.env.VERCEL_ACCESS_TOKEN || '',
    teamId: process.env.VERCEL_TEAM_ID,
  },
};

// Initialize deployment manager
let deploymentManager: ZapdevDeploymentManager;

try {
  deploymentManager = new ZapdevDeploymentManager({
    config: deploymentConfig,
    secrets: deploymentSecrets,
    analytics: { track: analytics.track.bind(analytics) },
    logger,
  });
} catch (error) {
  logger.error('Failed to initialize deployment manager', error);
  // Will handle error in the main handler function
}
interface DomainRequest {
  action: 'check' | 'setup' | 'verify' | 'instructions' | 'validate' | 'suggestions';
  subdomain?: string;
  platform?: DeploymentPlatform;
  projectId?: string;
  siteId?: string;
}

// Validation function to safely parse request body
function validateRequestBody(body: unknown): DomainRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  
  const obj = body as Record<string, unknown>;
  
  // Action is required and must be one of the valid actions
  const validActions = ['check', 'setup', 'verify', 'instructions', 'validate', 'suggestions'] as const;
  if (!obj.action || typeof obj.action !== 'string' || !(validActions as readonly string[]).includes(obj.action)) {
    return null;
  }
  
  // Validate optional fields with proper type checking
  const request: DomainRequest = {
    action: obj.action as DomainRequest['action']
  };
  
  if (obj.subdomain && typeof obj.subdomain === 'string') {
    request.subdomain = obj.subdomain;
  }
  
  if (obj.platform && typeof obj.platform === 'string') {
    const validPlatforms = ['netlify', 'vercel'];
    if (validPlatforms.includes(obj.platform)) {
      request.platform = obj.platform as DeploymentPlatform;
    }
  }
  
  if (obj.projectId && typeof obj.projectId === 'string') {
    request.projectId = obj.projectId;
  }
  
  if (obj.siteId && typeof obj.siteId === 'string') {
    request.siteId = obj.siteId;
  }
  
  return request;
}

interface SubdomainSuggestion {
  subdomain: string;
  available: boolean;
  domain: string;
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
  
  // Check if deployment manager is initialized
  if (!deploymentManager) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Deployment manager initialization failed. Please check server configuration.'
    });
  }
  try {
    const body = req.method === 'POST' ? validateRequestBody(req.body) : null;
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
        availableActions: ['check', 'setup', 'verify', 'instructions', 'validate', 'suggestions']
      });
    }

    logger.info('Domains API request', { 
      action, 
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
    });

    switch (action) {
      case 'check':
        return await handleCheckSubdomain(req, res, body || { action: 'check' });
      
      case 'setup':
        if (!body) {
          return res.status(400).json({ error: 'Setup action requires POST method with body' });
        }
        return await handleSetupDomain(req, res, body);
      
      case 'verify':
        if (!body) {
          return res.status(400).json({ error: 'Verify action requires POST method with body' });
        }
        return await handleVerifyDomain(req, res, body);
      
      case 'instructions':
        return await handleGetInstructions(req, res, body || { action: 'instructions' });
      
      case 'validate':
        return await handleValidateSubdomain(req, res, body || { action: 'validate' });
      
      case 'suggestions':
        return await handleSuggestions(req, res, body || { action: 'suggestions' });
      
      default:
        return res.status(400).json({ 
          error: `Unknown action: ${action}`,
          availableActions: ['check', 'setup', 'verify', 'instructions', 'validate', 'suggestions']
        });
    }
  } catch (error) {
    logger.error('Domains API request failed', error);
    
    if (error instanceof DomainConfigurationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code || 'DOMAIN_ERROR',
        platform: error.platform,
        domain: error.domain
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleCheckSubdomain(req: VercelRequest, res: VercelResponse, body: DomainRequest) {
  const subdomain = body.subdomain || (req.query.subdomain as string);

  if (!subdomain) {
    return res.status(400).json({
      error: 'Missing subdomain parameter'
    });
  }

  const fullDomain = `${subdomain}.zapdev.link`;
  
  // Validate subdomain format
  const isValid = isValidSubdomain(subdomain);
  
  if (!isValid) {
    return res.status(400).json({
      error: 'Invalid subdomain format',
      valid: false,
      domain: fullDomain,
      rules: getSubdomainRules()
    });
  }

  // Check if subdomain is available (simplified check)
  const isAvailable = await checkSubdomainAvailability(subdomain);

  return res.status(200).json({
    subdomain,
    domain: fullDomain,
    valid: isValid,
    available: isAvailable,
    message: isAvailable ? 
      `${subdomain}.zapdev.link is available!` : 
      `${subdomain}.zapdev.link is already taken`,
  });
}

async function handleSetupDomain(req: VercelRequest, res: VercelResponse, body: DomainRequest) {
  const { subdomain, platform, projectId, siteId } = body;

  if (!subdomain || !platform) {
    return res.status(400).json({
      error: 'Missing required fields: subdomain, platform'
    });
  }

  if (!isValidSubdomain(subdomain)) {
    return res.status(400).json({
      error: 'Invalid subdomain format',
      rules: getSubdomainRules()
    });
  }

  const id = projectId || siteId;
  const result = await deploymentManager.setupCustomSubdomain(subdomain, platform, id);
  
  return res.status(result.success ? 200 : 400).json({
    success: result.success,
    subdomain,
    domain: result.domain,
    platform,
    dnsInstructions: result.dnsInstructions,
    error: result.error,
    message: result.success ? 
      `Custom subdomain ${subdomain}.zapdev.link has been configured!` :
      'Failed to configure custom subdomain'
  });
}

async function handleVerifyDomain(req: VercelRequest, res: VercelResponse, body: DomainRequest) {
  const { subdomain, platform, projectId, siteId } = body;
  
  if (!subdomain || !platform) {
    return res.status(400).json({
      error: 'Missing required fields: subdomain, platform'
    });
  }

  const domain = `${subdomain}.zapdev.link`;
  const id = projectId || siteId;
  const result = await deploymentManager.verifyCustomDomain(domain, platform, id);
  
  return res.status(200).json({
    success: result.success,
    verified: result.verified,
    subdomain,
    domain,
    platform,
    error: result.error,
    message: result.verified ? 
      `${domain} is verified and active!` :
      result.success ? 
        `${domain} is not yet verified. Please check DNS settings.` :
        'Verification failed'
  });
}

async function handleGetInstructions(req: VercelRequest, res: VercelResponse, body: DomainRequest) {
  const platform = body.platform || (req.query.platform as DeploymentPlatform);
  const subdomain = body.subdomain || (req.query.subdomain as string);

  if (!platform) {
    return res.status(400).json({
      error: 'Missing platform parameter'
    });
  }

  const instructions = generatePlatformInstructions(platform, subdomain);
  
  return res.status(200).json({
    platform,
    subdomain,
    domain: subdomain ? `${subdomain}.zapdev.link` : null,
    instructions,
    supportedPlatforms: deploymentManager.getAvailablePlatforms()
  });
}

async function handleValidateSubdomain(req: VercelRequest, res: VercelResponse, body: DomainRequest) {
  const subdomain = body.subdomain || (req.query.subdomain as string);

  if (!subdomain) {
    return res.status(400).json({
      error: 'Missing subdomain parameter'
    });
  }

  const validation = validateSubdomainDetailed(subdomain);
  
  return res.status(200).json({
    subdomain,
    domain: `${subdomain}.zapdev.link`,
    ...validation
  });
}

async function handleSuggestions(req: VercelRequest, res: VercelResponse, body: DomainRequest) {
  const baseSubdomain = body.subdomain || (req.query.subdomain as string) || 'myproject';
  
  const suggestions = await generateSubdomainSuggestions(baseSubdomain);
  
  return res.status(200).json({
    baseSubdomain,
    suggestions,
    total: suggestions.length,
    available: suggestions.filter(s => s.available).length
  });
}

// Helper functions
function isValidSubdomain(subdomain: string): boolean {
  if (subdomain.length < SUBDOMAIN_MIN_LENGTH || subdomain.length > SUBDOMAIN_MAX_LENGTH) return false;
  return SUBDOMAIN_PATTERN.test(subdomain);
}

function validateSubdomainDetailed(subdomain: string) {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (subdomain.length < SUBDOMAIN_MIN_LENGTH) {
    errors.push(`Subdomain must be at least ${SUBDOMAIN_MIN_LENGTH} characters long`);
  }
  
  if (subdomain.length > SUBDOMAIN_MAX_LENGTH) {
    errors.push(`Subdomain cannot exceed ${SUBDOMAIN_MAX_LENGTH} characters`);
  }
  
  if (!SUBDOMAIN_PATTERN.test(subdomain)) {
    errors.push('Subdomain can only contain letters, numbers, and hyphens, and cannot start or end with hyphens');
  }
  
  if (subdomain.includes('--')) {
    warnings.push('Consecutive hyphens may cause confusion');
  }
  
  if (/^\d+$/.test(subdomain)) {
    warnings.push('Numeric-only subdomains may be confusing');
  }
  
  // Check for reserved words using constants
  const lowerSubdomain = subdomain.toLowerCase();
  if (RESERVED_SUBDOMAINS.includes(lowerSubdomain)) {
    warnings.push('This subdomain uses a reserved word and may cause conflicts');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rules: getSubdomainRules()
  };
}

function getSubdomainRules() {
  return {
    minLength: SUBDOMAIN_MIN_LENGTH,
    maxLength: SUBDOMAIN_MAX_LENGTH,
    allowedCharacters: 'letters (a-z), numbers (0-9), and hyphens (-)',
    restrictions: [
      'Cannot start or end with hyphens',
      'Cannot contain consecutive hyphens',
      'Cannot use reserved words (api, www, mail, etc.)'
    ],
    examples: ['myproject', 'awesome-app', 'portfolio2024']
  };
}

async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  // This is a simplified check. In a real implementation, you might:
  // 1. Check against a database of registered subdomains
  // 2. Query DNS to see if the subdomain already exists
  // 3. Check both Netlify and Vercel for existing projects
  
  // For now, we'll just check against reserved subdomains using constants
  return !RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase());
}

async function generateSubdomainSuggestions(baseSubdomain: string): Promise<SubdomainSuggestion[]> {
  const suggestions: SubdomainSuggestion[] = [];
  const cleanBase = baseSubdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Original
  if (isValidSubdomain(cleanBase)) {
    suggestions.push({
      subdomain: cleanBase,
      available: await checkSubdomainAvailability(cleanBase),
      domain: `${cleanBase}.zapdev.link`
    });
  }
  
  // With numbers
  const withNumbers = [`${cleanBase}1`, `${cleanBase}2`, `${cleanBase}2024`, `${cleanBase}app`];
  for (const suggestion of withNumbers) {
    if (isValidSubdomain(suggestion)) {
      suggestions.push({
        subdomain: suggestion,
        available: await checkSubdomainAvailability(suggestion),
        domain: `${suggestion}.zapdev.link`
      });
    }
  }
  
  // With common prefixes/suffixes
  const variants = [
    `my-${cleanBase}`,
    `${cleanBase}-app`,
    `${cleanBase}-web`,
    `${cleanBase}-site`,
    `${cleanBase}-dev`,
    `awesome-${cleanBase}`,
    `${cleanBase}-prod`
  ];
  
  for (const variant of variants) {
    if (isValidSubdomain(variant)) {
      suggestions.push({
        subdomain: variant,
        available: await checkSubdomainAvailability(variant),
        domain: `${variant}.zapdev.link`
      });
    }
  }
  
  return suggestions.slice(0, 10); // Limit to 10 suggestions
}

function generatePlatformInstructions(platform: DeploymentPlatform, subdomain?: string) {
  const baseInstructions = {
    netlify: {
      title: 'Netlify Deployment with Custom Subdomain',
      steps: [
        'Deploy your site to Netlify',
        'Get your Netlify site URL (e.g., awesome-site-123.netlify.app)',
        `Configure ${subdomain ? `${subdomain}.zapdev.link` : 'yourname.zapdev.link'} to point to your Netlify site`,
        'Add the custom domain in your Netlify site settings',
        'Wait for DNS propagation (usually 5-10 minutes)'
      ],
      dnsConfiguration: {
        type: 'CNAME',
        name: subdomain || 'yourname',
        value: 'your-netlify-site.netlify.app',
        description: 'Point your subdomain to your Netlify site URL'
      }
    },
    vercel: {
      title: 'Vercel Deployment with Custom Subdomain',
      steps: [
        'Deploy your project to Vercel',
        'Get your Vercel project URL (e.g., myproject.vercel.app)',
        `Configure ${subdomain ? `${subdomain}.zapdev.link` : 'yourname.zapdev.link'} to point to Vercel`,
        'Add the custom domain in your Vercel project settings',
        'Verify the domain and wait for SSL certificate provisioning'
      ],
      dnsConfiguration: {
        type: 'CNAME',
        name: subdomain || 'yourname',
        value: 'cname.vercel-dns.com',
        description: 'Point your subdomain to Vercel\'s CDN'
      }
    }
  };

  const validPlatforms = ['netlify', 'vercel'] as const;
  type Platform = typeof validPlatforms[number];
  
  function isPlatform(p: unknown): p is Platform {
    return typeof p === 'string' && validPlatforms.includes(p as Platform);
  }
  
  const safePlatform: Platform = isPlatform(platform) ? platform : 'netlify';
  
  // Use explicit mapping to prevent object injection
  if (safePlatform === 'netlify') {
    return baseInstructions.netlify;
  } else if (safePlatform === 'vercel') {
    return baseInstructions.vercel;
  } else {
    return {
      title: 'Platform not supported',
      steps: [],
      dnsConfiguration: null
    };
  }
}