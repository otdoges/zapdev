// Comprehensive security system for zapdev
// Includes rate limiting, DDoS protection, API key management, and input validation

export {
  RateLimiter,
  getRateLimiter,
  createRateLimitingMiddleware,
  type RateLimitConfig,
  type RateLimitRule,
  type SubscriptionLimits,
  type RateLimitResult,
} from './rate-limiting';

export {
  SecurityManager,
  getSecurityManager,
  createSecurityMiddleware,
  type SecurityValidationRule,
  type SecurityAuditLog,
} from './security-middleware';

export {
  APIKeyManager,
  getAPIKeyManager,
  createAPIKeyAuthMiddleware,
  requirePermission,
  apiKeys,
  type APIKeyConfig,
  type APIKeyInfo,
  type APIKeyUsage,
} from './api-key-manager';

import { getSecurityManager } from './security-middleware';
import { getRateLimiter } from './rate-limiting';
import { getAPIKeyManager } from './api-key-manager';
import { getLogger } from '../monitoring/logger';

// Comprehensive security system initialization
export async function initializeSecuritySystem(options?: {
  rateLimiting?: {
    subscriptionLimits?: any;
    enableDDoSProtection?: boolean;
  };
  security?: {
    enableCSP?: boolean;
    enableHSTS?: boolean;
    corsOrigins?: string[];
    maxRequestSize?: number;
    blockedIPs?: string[];
  };
  apiKeys?: {
    enableUsageTracking?: boolean;
    enableAnomalyDetection?: boolean;
  };
}): Promise<{
  success: boolean;
  components: {
    rateLimiter: boolean;
    securityManager: boolean;
    apiKeyManager: boolean;
  };
  errors: string[];
}> {
  const logger = getLogger();
  const errors: string[] = [];
  let rateLimiterOk = false;
  let securityManagerOk = false;
  let apiKeyManagerOk = false;

  try {
    console.log('🔒 Initializing comprehensive security system...');

    // Initialize rate limiter
    try {
      const rateLimiter = getRateLimiter(options?.rateLimiting?.subscriptionLimits);
      rateLimiterOk = true;
      console.log('✅ Rate limiting system initialized');
      
      logger.info('Rate limiting system initialized', {
        subscriptionTiers: Object.keys(options?.rateLimiting?.subscriptionLimits || {}),
        ddosProtection: options?.rateLimiting?.enableDDoSProtection !== false,
      });
    } catch (error) {
      const errorMsg = `Rate limiter initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('⚠️ ', errorMsg);
    }

    // Initialize security manager
    try {
      const securityManager = getSecurityManager({
        corsOrigins: options?.security?.corsOrigins || [
          'http://localhost:3000',
          'https://*.zapdev.com',
          'https://*.vercel.app',
        ],
        maxRequestSize: options?.security?.maxRequestSize || 10 * 1024 * 1024,
        blockedIPs: new Set(options?.security?.blockedIPs || []),
        enableCSP: options?.security?.enableCSP !== false,
        enableHSTS: options?.security?.enableHSTS !== false,
        ...options?.security,
      });
      
      securityManagerOk = true;
      console.log('✅ Security middleware initialized');
      
      logger.info('Security middleware initialized', {
        csp: options?.security?.enableCSP !== false,
        hsts: options?.security?.enableHSTS !== false,
        corsOrigins: options?.security?.corsOrigins?.length || 0,
        maxRequestSize: options?.security?.maxRequestSize || 10 * 1024 * 1024,
      });
    } catch (error) {
      const errorMsg = `Security manager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('⚠️ ', errorMsg);
    }

    // Initialize API key manager
    try {
      const apiKeyManager = getAPIKeyManager();
      apiKeyManagerOk = true;
      console.log('✅ API key management initialized');
      
      logger.info('API key management initialized', {
        usageTracking: options?.apiKeys?.enableUsageTracking !== false,
        anomalyDetection: options?.apiKeys?.enableAnomalyDetection !== false,
      });
    } catch (error) {
      const errorMsg = `API key manager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('⚠️ ', errorMsg);
    }

    const success = errors.length === 0;
    
    if (success) {
      console.log('🎉 Security system initialization completed successfully');
      logger.info('Security system fully operational', {
        components: ['rateLimiter', 'securityManager', 'apiKeyManager'],
        errors: [],
      });
    } else {
      console.warn(`⚠️ Security system initialized with ${errors.length} warnings`);
      logger.warn('Security system initialized with issues', {
        errors,
        partiallyOperational: true,
        components: {
          rateLimiter: rateLimiterOk,
          securityManager: securityManagerOk,
          apiKeyManager: apiKeyManagerOk,
        },
      });
    }

    return {
      success,
      components: {
        rateLimiter: rateLimiterOk,
        securityManager: securityManagerOk,
        apiKeyManager: apiKeyManagerOk,
      },
      errors,
    };
  } catch (error) {
    const criticalError = `Critical security system failure: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('❌ ', criticalError);
    errors.push(criticalError);
    
    return {
      success: false,
      components: {
        rateLimiter: rateLimiterOk,
        securityManager: securityManagerOk,
        apiKeyManager: apiKeyManagerOk,
      },
      errors,
    };
  }
}

// Security middleware factory that combines all security measures
export function createComprehensiveSecurityMiddleware(options?: {
  rateLimiting?: any;
  security?: any;
  apiKeys?: boolean;
  validation?: {
    rules?: Record<string, any>;
    strict?: boolean;
  };
}) {
  const securityManager = getSecurityManager(options?.security);
  const rateLimiter = getRateLimiter(options?.rateLimiting?.subscriptionLimits);
  const apiKeyManager = options?.apiKeys ? getAPIKeyManager() : null;
  
  return async function comprehensiveSecurityMiddleware(req: any, res: any, next: any) {
    const startTime = Date.now();
    const logger = getLogger();
    
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || '';
      const method = req.method;
      const path = req.path || req.url;

      logger.debug('Security middleware processing request', {
        ip,
        method,
        path,
        userAgent: userAgent.substring(0, 100),
      });

      // 1. Security headers and basic protections
      const response = NextResponse.next();
      securityManager.setSecurityHeaders(response);

      // 2. IP reputation and blocking
      const ipCheck = await securityManager.checkIPReputation(ip);
      if (!ipCheck.allowed) {
        securityManager.recordIPAttempt(ip, false);
        return res.status(403).json({
          error: 'Access denied',
          message: ipCheck.reason,
          code: 'IP_BLOCKED',
        });
      }

      // 3. Request size validation
      const sizeCheck = securityManager.validateRequestSize(req);
      if (!sizeCheck.allowed) {
        return res.status(413).json({
          error: 'Request too large',
          message: `Request size exceeds limit`,
          code: 'REQUEST_TOO_LARGE',
        });
      }

      // 4. DDoS detection
      const ddosCheck = await securityManager.detectDDoSPattern(ip, path);
      if (ddosCheck.isDDoS) {
        return res.status(429).json({
          error: 'DDoS protection activated',
          message: 'Suspicious traffic pattern detected',
          code: 'DDOS_PROTECTION',
          retryAfter: Math.ceil((ddosCheck.blockedTime || 60000) / 1000),
        });
      }

      // 5. Rate limiting
      const identifier = req.user?.id || ip;
      const subscriptionTier = req.user?.subscription?.tier || 'free';
      
      const rateLimitResult = await rateLimiter.checkLimit(
        identifier,
        path,
        method,
        subscriptionTier
      );

      if (!rateLimitResult.allowed) {
        securityManager.recordIPAttempt(ip, false);
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', rateLimitResult.totalTime);
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.getTime());
        res.setHeader('Retry-After', rateLimitResult.retryAfter || 60);
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter,
          resetTime: rateLimitResult.resetTime,
        });
      }

      // 6. API key authentication (if enabled and key provided)
      if (apiKeyManager && (req.headers['x-api-key'] || req.query.api_key)) {
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        const validation = await apiKeyManager.validateAPIKey(apiKey);
        
        if (!validation.valid) {
          securityManager.recordIPAttempt(ip, false);
          return res.status(401).json({
            error: 'Invalid API key',
            message: validation.error,
            code: 'INVALID_API_KEY',
          });
        }

        req.apiKey = validation.keyInfo;
        req.user = req.user || { id: validation.keyInfo!.userId };
      }

      // 7. Input sanitization
      const sanitizationResult = securityManager.sanitizeRequest(req);
      if (sanitizationResult.warnings.length > 0) {
        req.securityWarnings = sanitizationResult.warnings;
        logger.warn('Request sanitized', {
          warnings: sanitizationResult.warnings,
          ip,
          path,
          method,
        });
      }

      // 8. Set security context for downstream middleware
      req.security = {
        ipRisk: ipCheck.risk,
        rateLimitRemaining: rateLimitResult.remaining,
        sanitized: sanitizationResult.sanitized,
        processingTime: Date.now() - startTime,
      };

      // Record successful security check
      securityManager.recordIPAttempt(ip, true);

      logger.debug('Security middleware completed successfully', {
        ip,
        path,
        method,
        processingTime: Date.now() - startTime,
        ipRisk: ipCheck.risk,
        rateLimitRemaining: rateLimitResult.remaining,
      });

      next();
    } catch (error) {
      logger.error('Security middleware error', error as Error, {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      // Fail secure - deny request on security error
      return res.status(500).json({
        error: 'Security error',
        message: 'Unable to process request securely',
        code: 'SECURITY_ERROR',
      });
    }
  };
}

// Security monitoring and reporting
export class SecurityMonitor {
  private securityManager = getSecurityManager();
  private rateLimiter = getRateLimiter();
  private apiKeyManager = getAPIKeyManager();

  async generateSecurityReport(): Promise<{
    overview: {
      status: 'secure' | 'warning' | 'critical';
      score: number;
      lastUpdated: Date;
    };
    rateLimiting: any;
    apiKeys: any;
    threats: {
      blockedIPs: number;
      ddosAttempts: number;
      suspiciousActivity: number;
    };
    recommendations: string[];
  }> {
    try {
      const [rateLimitStats, apiKeyStats, securityStats] = await Promise.all([
        this.rateLimiter.getStatistics(),
        this.apiKeyManager.getAPIKeyStatistics(),
        this.securityManager.getSecurityStats(),
      ]);

      const recommendations: string[] = [];
      let securityScore = 100;

      // Analyze security posture
      if (securityStats.blockedIPs > 10) {
        recommendations.push('High number of blocked IPs detected - consider investigating source');
        securityScore -= 10;
      }

      if (securityStats.suspiciousActivity.last24h > 50) {
        recommendations.push('High suspicious activity - consider tightening security policies');
        securityScore -= 15;
      }

      if (apiKeyStats.expired > 0) {
        recommendations.push('Remove expired API keys to improve security');
        securityScore -= 5;
      }

      if (rateLimitStats.limitedRequests / rateLimitStats.totalRequests > 0.1) {
        recommendations.push('High rate limiting activity - consider adjusting limits or investigating abuse');
        securityScore -= 10;
      }

      const status = securityScore >= 90 ? 'secure' : 
                    securityScore >= 70 ? 'warning' : 'critical';

      return {
        overview: {
          status,
          score: Math.max(0, securityScore),
          lastUpdated: new Date(),
        },
        rateLimiting: rateLimitStats,
        apiKeys: apiKeyStats,
        threats: {
          blockedIPs: securityStats.blockedIPs,
          ddosAttempts: 0, // Would be tracked separately
          suspiciousActivity: securityStats.suspiciousActivity.last24h,
        },
        recommendations,
      };
    } catch (error) {
      console.error('Failed to generate security report:', error);
      throw error;
    }
  }

  async getSecurityMetrics(): Promise<{
    requests: {
      total: number;
      blocked: number;
      limited: number;
      successful: number;
    };
    apiKeys: {
      total: number;
      active: number;
      usage: number;
    };
    threats: {
      ips: number;
      patterns: number;
      severity: Record<string, number>;
    };
  }> {
    const [rateLimitStats, apiKeyStats, securityStats] = await Promise.all([
      this.rateLimiter.getStatistics(),
      this.apiKeyManager.getAPIKeyStatistics(),
      this.securityManager.getSecurityStats(),
    ]);

    return {
      requests: {
        total: rateLimitStats.totalRequests,
        blocked: 0, // Would need to track this
        limited: rateLimitStats.limitedRequests,
        successful: rateLimitStats.totalRequests - rateLimitStats.limitedRequests,
      },
      apiKeys: {
        total: apiKeyStats.total,
        active: apiKeyStats.active,
        usage: apiKeyStats.usage.last24h,
      },
      threats: {
        ips: securityStats.blockedIPs,
        patterns: securityStats.suspiciousActivity.last24h,
        severity: securityStats.suspiciousActivity.bySeverity,
      },
    };
  }
}

// Global security monitor instance
let globalSecurityMonitor: SecurityMonitor | undefined;

export function getSecurityMonitor(): SecurityMonitor {
  if (!globalSecurityMonitor) {
    globalSecurityMonitor = new SecurityMonitor();
  }
  return globalSecurityMonitor;
}

// Main security middleware that can be used in Next.js middleware
export function createMainSecurityMiddleware(options?: any) {
  return createComprehensiveSecurityMiddleware(options);
}

// Utility functions
export async function getSecurityOverview(): Promise<{
  healthy: boolean;
  components: string[];
  issues: string[];
  metrics: any;
}> {
  try {
    const securityMonitor = getSecurityMonitor();
    const report = await securityMonitor.generateSecurityReport();
    const metrics = await securityMonitor.getSecurityMetrics();

    return {
      healthy: report.overview.status === 'secure',
      components: ['rateLimiter', 'securityManager', 'apiKeyManager'],
      issues: report.recommendations,
      metrics,
    };
  } catch (error) {
    return {
      healthy: false,
      components: [],
      issues: ['Security system error'],
      metrics: null,
    };
  }
}