/**
 * 🚀 Deployment Service Types & Interfaces
 * 
 * Unified types for Netlify and Vercel deployment with custom subdomain support
 * 
 * SECURITY NOTE: This file contains configuration types. Sensitive credentials
 * are separated into runtime-only interfaces and must NEVER be serialized,
 * logged, or committed to version control. Use secure credential management.
 */

export type DeploymentPlatform = 'netlify' | 'vercel';
export type DeploymentStatus = 'pending' | 'building' | 'ready' | 'error' | 'cancelled';

// Base deployment configuration
export interface BaseDeploymentConfig {
  platform: DeploymentPlatform;
  projectName: string;
  // Optional to allow platform defaults; validated where used
  subdomain?: string; // e.g., "myproject" for "myproject.zapdev.link"
  gitRepo?: {
    url: string;
    branch?: string;
    buildCommand?: string;
    outputDirectory?: string;
  };
  files?: {
    [path: string]: string; // path -> content
  };
  environment?: Record<string, string>;
}

// Deployment result
export interface DeploymentResult {
  success: boolean;
  deploymentId?: string;
  url?: string;
  customDomain?: string; // e.g., "myproject.zapdev.link"
  status: DeploymentStatus;
  logs?: string[];
  error?: string;
  platform: DeploymentPlatform;
  metadata?: Record<string, unknown>;
}

// Domain configuration for custom subdomains
export interface CustomDomainConfig {
  subdomain: string; // "myproject"
  fullDomain: string; // "myproject.zapdev.link"
  verified: boolean;
  dnsRecords?: {
    type: string;
    name: string;
    value: string;
  }[];
}

// Deployment service interface
export interface IDeploymentService {
  platform: DeploymentPlatform;
  
  // Deploy a project
  deploy(config: BaseDeploymentConfig): Promise<DeploymentResult>;
  
  // Get deployment status
  getDeploymentStatus(deploymentId: string): Promise<DeploymentResult>;
  
  // Setup custom subdomain
  setupCustomDomain(config: CustomDomainConfig, projectId?: string): Promise<{
    success: boolean;
    domain?: string;
    verified?: boolean;
    dnsRecords?: CustomDomainConfig['dnsRecords'];
    error?: string;
  }>;
  
  // Verify custom domain
  verifyCustomDomain(domain: string, projectId?: string): Promise<{
    success: boolean;
    verified: boolean;
    error?: string;
  }>;
  
  // Delete deployment/project
  deleteDeployment(deploymentId: string): Promise<{ success: boolean; error?: string }>;
  
  // List deployments
  listDeployments(limit?: number): Promise<{
    success: boolean;
    deployments?: Array<{
      id: string;
      name: string;
      url: string;
      status: DeploymentStatus;
      createdAt: Date;
    }>;
    error?: string;
  }>;
}

// Sensitive deployment secrets - DO NOT SERIALIZE OR LOG
// These should be retrieved from secure storage at runtime
export interface ZapdevDeploymentSecrets {
  netlify: {
    /** 
     * @secret Netlify access token - retrieve from secure storage
     * NEVER serialize, log, or commit this value
     */
    accessToken: string;
    teamId?: string;
  };
  vercel: {
    /** 
     * @secret Vercel access token - retrieve from secure storage  
     * NEVER serialize, log, or commit this value
     */
    accessToken: string;
    teamId?: string;
  };
  
  // DNS configuration secrets
  dns?: {
    provider: 'cloudflare' | 'route53' | 'manual';
    /** 
     * @secret DNS provider API key - retrieve from secure storage
     * NEVER serialize, log, or commit this value
     */
    apiKey?: string;
    zoneId?: string;
  };
}

// Platform-specific configurations (without sensitive data)
export interface NetlifyConfig extends BaseDeploymentConfig {
  platform: 'netlify';
  netlify?: {
    siteId?: string;
    // Note: accessToken moved to ZapdevDeploymentSecrets
    teamId?: string;
  };
}

export interface VercelConfig extends BaseDeploymentConfig {
  platform: 'vercel';
  vercel?: {
    projectId?: string;
    // Note: accessToken moved to ZapdevDeploymentSecrets
    teamId?: string;
  };
}

// Analytics events for PostHog
export interface DeploymentAnalyticsEvent {
  event: 'deployment_started' | 'deployment_completed' | 'deployment_failed' | 'domain_configured' | 'domain_verified';
  properties: {
    platform: DeploymentPlatform;
    project_name: string;
    subdomain: string;
    deployment_id?: string;
    duration_ms?: number;
    error_message?: string;
    success?: boolean;
    custom_domain?: string;
    [key: string]: unknown;
  };
}

// Configuration for zapdev deployment service (non-sensitive settings)
export interface ZapdevDeploymentConfig {
  // Include sensitive deployment configuration
  netlify: {
    accessToken: string;
    teamId?: string;
  };
  vercel: {
    accessToken: string;
    teamId?: string;
  };
  // Main domain for custom subdomains
  baseDomain: string; // "zapdev.link"
  
  // Reference to secure credential storage
  // Secrets must be retrieved from ZapdevDeploymentSecrets at runtime
  secretsRef?: string; // Optional reference to secret storage key
  
  // Default deployment settings
  defaults: {
    platform: DeploymentPlatform;
    buildCommand: string;
    outputDirectory: string;
    nodeVersion: string;
  };
  
  // Non-sensitive DNS configuration
  dns?: {
    provider: 'cloudflare' | 'route53' | 'manual';
    // Note: apiKey and sensitive data moved to ZapdevDeploymentSecrets
    zoneId?: string; // Zone ID is generally not secret
  };
}

// Error types
export class DeploymentError extends Error {
  constructor(
    message: string,
    public platform: DeploymentPlatform,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DeploymentError';
  }
}

export class DomainConfigurationError extends Error {
  constructor(
    message: string,
    public domain: string,
    public platform: DeploymentPlatform,
    public code?: string
  ) {
    super(message);
    this.name = 'DomainConfigurationError';
  }
}