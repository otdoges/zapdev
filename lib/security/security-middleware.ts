import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '../monitoring/logger';
import { getRateLimiter } from './rate-limiting';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableFrameGuard: boolean;
  enableContentTypeSniffing: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  corsOrigins: string[];
  trustedProxies: string[];
  maxRequestSize: number;
  enableRequestLogging: boolean;
  enableIPBlocking: boolean;
  blockedIPs: Set<string>;
  suspiciousPatterns: RegExp[];
}

interface SecurityValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'url' | 'json' | 'array';
  required: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  allowHTML?: boolean;
  customValidator?: (value: any) => boolean | string;
}

interface SecurityAuditLog {
  timestamp: Date;
  type: 'blocked_request' | 'validation_error' | 'rate_limit' | 'suspicious_activity';
  identifier: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityManager {
  private config: SecurityConfig;
  private logger = getLogger();
  private auditLogs: SecurityAuditLog[] = [];
  private ipAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableCSP: true,
      enableHSTS: true,
      enableXSSProtection: true,
      enableFrameGuard: true,
      enableContentTypeSniffing: false,
      enableReferrerPolicy: true,
      enablePermissionsPolicy: true,
      corsOrigins: [
        'http://localhost:3000',
        'https://*.zapdev.com',
        'https://*.vercel.app',
      ],
      trustedProxies: ['127.0.0.1', '::1'],
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      enableRequestLogging: true,
      enableIPBlocking: true,
      blockedIPs: new Set(),
      suspiciousPatterns: [
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /setTimeout\s*\(/gi,
        /setInterval\s*\(/gi,
        /(union|select|insert|update|delete|drop|create|alter)\s+/gi,
        /'/gi, // SQL injection attempt
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi,
      ],
      ...config,
    };
  }

  // Security headers middleware
  setSecurityHeaders(response: NextResponse): NextResponse {
    const headers = new Map<string, string>();

    // Content Security Policy
    if (this.config.enableCSP) {
      headers.set('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.clerk.dev https://*.posthog.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' https://*.stripe.com https://*.clerk.dev https://*.posthog.com wss://*.convex.cloud; " +
        "frame-src https://js.stripe.com https://*.clerk.dev; " +
        "object-src 'none'; " +
        "base-uri 'self';"
      );
    }

    // HTTP Strict Transport Security
    if (this.config.enableHSTS) {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // X-XSS-Protection
    if (this.config.enableXSSProtection) {
      headers.set('X-XSS-Protection', '1; mode=block');
    }

    // X-Frame-Options
    if (this.config.enableFrameGuard) {
      headers.set('X-Frame-Options', 'DENY');
    }

    // X-Content-Type-Options
    if (!this.config.enableContentTypeSniffing) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (this.config.enableReferrerPolicy) {
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Permissions Policy
    if (this.config.enablePermissionsPolicy) {
      headers.set('Permissions-Policy', 
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
      );
    }

    // Additional security headers
    headers.set('X-DNS-Prefetch-Control', 'off');
    headers.set('X-Download-Options', 'noopen');
    headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    // Apply headers to response
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // Input validation and sanitization
  validateAndSanitizeInput(
    data: any,
    rules: SecurityValidationRule[]
  ): { valid: boolean; sanitized: any; errors: string[] } {
    const errors: string[] = [];
    const sanitized: any = {};

    for (const rule of rules) {
      const value = data[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${rule.field}' is required`);
        continue;
      }

      // Skip validation for optional empty fields
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      let processedValue = value;

      // Type validation and conversion
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Field '${rule.field}' must be a string`);
            continue;
          }
          break;

        case 'number':
          processedValue = Number(value);
          if (isNaN(processedValue)) {
            errors.push(`Field '${rule.field}' must be a number`);
            continue;
          }
          break;

        case 'email':
          if (!this.isValidEmail(value)) {
            errors.push(`Field '${rule.field}' must be a valid email`);
            continue;
          }
          break;

        case 'url':
          if (!this.isValidUrl(value)) {
            errors.push(`Field '${rule.field}' must be a valid URL`);
            continue;
          }
          break;

        case 'json':
          try {
            processedValue = typeof value === 'string' ? JSON.parse(value) : value;
          } catch {
            errors.push(`Field '${rule.field}' must be valid JSON`);
            continue;
          }
          break;

        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`Field '${rule.field}' must be an array`);
            continue;
          }
          break;
      }

      // Length validation
      if (rule.type === 'string' && typeof processedValue === 'string') {
        if (rule.minLength && processedValue.length < rule.minLength) {
          errors.push(`Field '${rule.field}' must be at least ${rule.minLength} characters`);
          continue;
        }
        if (rule.maxLength && processedValue.length > rule.maxLength) {
          errors.push(`Field '${rule.field}' must be no more than ${rule.maxLength} characters`);
          continue;
        }
      }

      // Pattern validation
      if (rule.pattern && typeof processedValue === 'string') {
        if (!rule.pattern.test(processedValue)) {
          errors.push(`Field '${rule.field}' does not match required pattern`);
          continue;
        }
      }

      // Custom validation
      if (rule.customValidator) {
        const validationResult = rule.customValidator(processedValue);
        if (validationResult !== true) {
          errors.push(typeof validationResult === 'string' 
            ? validationResult 
            : `Field '${rule.field}' failed custom validation`
          );
          continue;
        }
      }

      // Sanitization
      if (rule.sanitize && typeof processedValue === 'string') {
        if (rule.allowHTML) {
          // Sanitize HTML but allow safe tags
          processedValue = purify.sanitize(processedValue, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
            ALLOWED_ATTR: ['href', 'target'],
          });
        } else {
          // Strip all HTML
          processedValue = purify.sanitize(processedValue, { ALLOWED_TAGS: [] });
        }

        // Check for suspicious patterns
        for (const pattern of this.config.suspiciousPatterns) {
          if (pattern.test(processedValue)) {
            this.logSuspiciousActivity('suspicious_input', {
              field: rule.field,
              pattern: pattern.toString(),
              value: processedValue.substring(0, 100),
            });
            
            // Remove suspicious content
            processedValue = processedValue.replace(pattern, '');
          }
        }
      }

      sanitized[rule.field] = processedValue;
    }

    return {
      valid: errors.length === 0,
      sanitized,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // IP blocking and reputation
  async checkIPReputation(ip: string): Promise<{
    allowed: boolean;
    reason?: string;
    risk: 'low' | 'medium' | 'high';
  }> {
    // Check blocked IPs
    if (this.config.blockedIPs.has(ip)) {
      return {
        allowed: false,
        reason: 'IP address is blocked',
        risk: 'high',
      };
    }

    // Check attempt history
    const attempts = this.ipAttempts.get(ip);
    if (attempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      const recentAttempts = timeSinceLastAttempt < 60000; // Last minute
      
      if (recentAttempts && attempts.count > 50) {
        return {
          allowed: false,
          reason: 'Too many recent attempts from this IP',
          risk: 'high',
        };
      }
      
      if (attempts.count > 20) {
        return {
          allowed: true,
          risk: 'medium',
        };
      }
    }

    return {
      allowed: true,
      risk: 'low',
    };
  }

  recordIPAttempt(ip: string, success: boolean): void {
    const current = this.ipAttempts.get(ip) || { count: 0, lastAttempt: new Date() };
    
    current.count += 1;
    current.lastAttempt = new Date();
    
    this.ipAttempts.set(ip, current);

    // Auto-block IPs with too many failed attempts
    if (!success && current.count > 100) {
      this.config.blockedIPs.add(ip);
      this.logSuspiciousActivity('ip_auto_blocked', {
        ip,
        attemptCount: current.count,
        reason: 'Too many failed attempts',
      });
    }

    // Clean up old attempts (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [ipAddress, attempts] of this.ipAttempts.entries()) {
      if (attempts.lastAttempt.getTime() < oneHourAgo) {
        this.ipAttempts.delete(ipAddress);
      }
    }
  }

  // API key management
  generateAPIKey(userId: string, scope: string[] = ['read']): {
    keyId: string;
    key: string;
    hashedKey: string;
  } {
    const keyId = `key_${randomBytes(8).toString('hex')}`;
    const key = `zap_${randomBytes(32).toString('hex')}`;
    const hashedKey = createHash('sha256').update(key).digest('hex');

    this.logger.info('API key generated', {
      userId,
      keyId,
      scope,
      hashedKeyPrefix: hashedKey.substring(0, 8),
    });

    return { keyId, key, hashedKey };
  }

  validateAPIKey(providedKey: string, storedHashedKey: string): boolean {
    try {
      const providedHash = createHash('sha256').update(providedKey).digest('hex');
      const providedBuffer = Buffer.from(providedHash, 'hex');
      const storedBuffer = Buffer.from(storedHashedKey, 'hex');
      
      if (providedBuffer.length !== storedBuffer.length) {
        return false;
      }
      
      return timingSafeEqual(providedBuffer, storedBuffer);
    } catch (error) {
      this.logger.error('API key validation error', error as Error);
      return false;
    }
  }

  // Request sanitization
  sanitizeRequest(req: any): {
    sanitized: boolean;
    originalBody?: any;
    sanitizedBody?: any;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let sanitized = false;
    const originalBody = req.body;
    let sanitizedBody = req.body;

    if (req.body && typeof req.body === 'object') {
      sanitizedBody = this.deepSanitize(req.body, warnings);
      sanitized = warnings.length > 0;
    }

    // Sanitize query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          const sanitizedValue = purify.sanitize(value, { ALLOWED_TAGS: [] });
          if (sanitizedValue !== value) {
            req.query[key] = sanitizedValue;
            warnings.push(`Query parameter '${key}' was sanitized`);
            sanitized = true;
          }
        }
      }
    }

    if (sanitized) {
      req.body = sanitizedBody;
      this.logSuspiciousActivity('request_sanitized', {
        warnings,
        originalBodyType: typeof originalBody,
        url: req.url,
        method: req.method,
      });
    }

    return {
      sanitized,
      originalBody,
      sanitizedBody,
      warnings,
    };
  }

  private deepSanitize(obj: any, warnings: string[], path = ''): any {
    if (typeof obj === 'string') {
      const sanitized = purify.sanitize(obj, { ALLOWED_TAGS: [] });
      if (sanitized !== obj) {
        warnings.push(`Field '${path}' was sanitized`);
      }
      return sanitized;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        this.deepSanitize(item, warnings, `${path}[${index}]`)
      );
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        sanitized[key] = this.deepSanitize(value, warnings, fieldPath);
      }
      return sanitized;
    }

    return obj;
  }

  // DDoS protection
  async detectDDoSPattern(ip: string, path: string): Promise<{
    isDDoS: boolean;
    confidence: number;
    blockedTime?: number;
  }> {
    try {
      const redis = getRedisClient();
      if (!redis.isConnected()) {
        return { isDDoS: false, confidence: 0 };
      }

      const windowMs = 60 * 1000; // 1 minute window
      const key = `ddos:${ip}:${Math.floor(Date.now() / windowMs)}`;
      
      const requestCount = await redis.increment(key, 1);
      await redis.expire(key, Math.ceil(windowMs / 1000));

      // Simple DDoS detection based on request volume
      let confidence = 0;
      let isDDoS = false;
      let blockedTime = 0;

      if (requestCount > 1000) { // Very high volume
        confidence = 0.9;
        isDDoS = true;
        blockedTime = 60 * 60 * 1000; // Block for 1 hour
      } else if (requestCount > 500) { // High volume
        confidence = 0.7;
        isDDoS = true;
        blockedTime = 15 * 60 * 1000; // Block for 15 minutes
      } else if (requestCount > 200) { // Moderate volume
        confidence = 0.5;
        isDDoS = true;
        blockedTime = 5 * 60 * 1000; // Block for 5 minutes
      }

      if (isDDoS) {
        // Block the IP temporarily
        await redis.set(`blocked:${ip}`, Date.now() + blockedTime, blockedTime / 1000);
        
        this.logSuspiciousActivity('ddos_detected', {
          ip,
          path,
          requestCount,
          confidence,
          blockedTime: `${blockedTime / 1000}s`,
        });
      }

      return { isDDoS, confidence, blockedTime };
    } catch (error) {
      this.logger.error('DDoS detection error', error as Error);
      return { isDDoS: false, confidence: 0 };
    }
  }

  // Check if IP is temporarily blocked
  async isIPBlocked(ip: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      if (!redis.isConnected()) {
        return this.config.blockedIPs.has(ip);
      }

      const blockedUntil = await redis.get(`blocked:${ip}`);
      if (blockedUntil && parseInt(blockedUntil) > Date.now()) {
        return true;
      }

      return this.config.blockedIPs.has(ip);
    } catch (error) {
      this.logger.error('IP block check error', error as Error);
      return false;
    }
  }

  // Request size validation
  validateRequestSize(req: any): { allowed: boolean; size: number; limit: number } {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const allowed = contentLength <= this.config.maxRequestSize;

    if (!allowed) {
      this.logSuspiciousActivity('request_too_large', {
        size: contentLength,
        limit: this.config.maxRequestSize,
        url: req.url,
        method: req.method,
      });
    }

    return {
      allowed,
      size: contentLength,
      limit: this.config.maxRequestSize,
    };
  }

  // CORS validation
  validateCORS(origin: string | undefined): boolean {
    if (!origin) return true; // Same-origin requests

    // Check if origin is in allowed list
    return this.config.corsOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.includes('*')) {
        const regex = new RegExp(allowed.replace(/\*/g, '.*'));
        return regex.test(origin);
      }
      return allowed === origin;
    });
  }

  // Log suspicious activity
  private logSuspiciousActivity(
    type: SecurityAuditLog['type'],
    details: Record<string, any>,
    severity: SecurityAuditLog['severity'] = 'medium'
  ): void {
    const auditLog: SecurityAuditLog = {
      timestamp: new Date(),
      type,
      identifier: details.ip || details.userId || 'unknown',
      details,
      severity,
    };

    this.auditLogs.push(auditLog);

    // Keep only last 1000 audit logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-500);
    }

    this.logger.warn(`Security event: ${type}`, details, {
      securityAudit: true,
      type,
      severity,
    });
  }

  // Get security statistics
  getSecurityStats(): {
    auditLogs: number;
    blockedIPs: number;
    suspiciousActivity: {
      last24h: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
    };
    ipAttempts: number;
  } {
    const last24h = this.auditLogs.filter(log => 
      log.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const log of last24h) {
      byType[log.type] = (byType[log.type] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    }

    return {
      auditLogs: this.auditLogs.length,
      blockedIPs: this.config.blockedIPs.size,
      suspiciousActivity: {
        last24h: last24h.length,
        byType,
        bySeverity,
      },
      ipAttempts: this.ipAttempts.size,
    };
  }

  // Get audit logs
  getAuditLogs(filters?: {
    type?: SecurityAuditLog['type'];
    severity?: SecurityAuditLog['severity'];
    identifier?: string;
    limit?: number;
  }): SecurityAuditLog[] {
    let filtered = [...this.auditLogs];

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(log => log.type === filters.type);
      }
      if (filters.severity) {
        filtered = filtered.filter(log => log.severity === filters.severity);
      }
      if (filters.identifier) {
        filtered = filtered.filter(log => log.identifier === filters.identifier);
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  // Cleanup and maintenance
  cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    // Clean up old IP attempts
    for (const [ip, attempts] of this.ipAttempts.entries()) {
      if (attempts.lastAttempt.getTime() < oneHourAgo) {
        this.ipAttempts.delete(ip);
      }
    }

    // Clean up old audit logs (keep last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.auditLogs = this.auditLogs.filter(log => 
      log.timestamp.getTime() > oneDayAgo
    );
  }
}

// Global security manager instance
let globalSecurityManager: SecurityManager | undefined;

export function getSecurityManager(config?: Partial<SecurityConfig>): SecurityManager {
  if (!globalSecurityManager) {
    globalSecurityManager = new SecurityManager(config);
    
    // Start cleanup interval
    setInterval(() => {
      globalSecurityManager?.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  return globalSecurityManager;
}

// Security middleware factory
export function createSecurityMiddleware(config?: Partial<SecurityConfig>) {
  const securityManager = getSecurityManager(config);
  const rateLimiter = getRateLimiter();
  
  return async function securityMiddleware(req: any, res: any, next: any) {
    const startTime = Date.now();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const origin = req.headers.origin;

    try {
      // Security headers
      const response = NextResponse.next();
      securityManager.setSecurityHeaders(response);

      // IP reputation check
      const ipCheck = await securityManager.checkIPReputation(ip);
      if (!ipCheck.allowed) {
        securityManager.recordIPAttempt(ip, false);
        return res.status(403).json({
          error: 'Access denied',
          message: ipCheck.reason,
          code: 'IP_BLOCKED',
        });
      }

      // Request size validation
      const sizeCheck = securityManager.validateRequestSize(req);
      if (!sizeCheck.allowed) {
        return res.status(413).json({
          error: 'Request too large',
          message: `Request size ${sizeCheck.size} exceeds limit of ${sizeCheck.limit} bytes`,
          code: 'REQUEST_TOO_LARGE',
        });
      }

      // CORS validation
      if (origin && !securityManager.validateCORS(origin)) {
        securityManager.logSuspiciousActivity('cors_violation', {
          origin,
          path: req.path,
          method: req.method,
          ip,
        });
        
        return res.status(403).json({
          error: 'CORS policy violation',
          message: 'Origin not allowed',
          code: 'CORS_VIOLATION',
        });
      }

      // DDoS detection
      const ddosCheck = await securityManager.detectDDoSPattern(ip, req.path);
      if (ddosCheck.isDDoS) {
        return res.status(429).json({
          error: 'DDoS protection activated',
          message: 'Too many requests from your IP address',
          code: 'DDOS_PROTECTION',
          retryAfter: Math.ceil((ddosCheck.blockedTime || 60000) / 1000),
        });
      }

      // Check if IP is blocked
      const isBlocked = await securityManager.isIPBlocked(ip);
      if (isBlocked) {
        securityManager.recordIPAttempt(ip, false);
        return res.status(403).json({
          error: 'IP address blocked',
          message: 'Your IP address has been temporarily blocked due to suspicious activity',
          code: 'IP_BLOCKED',
        });
      }

      // Rate limiting
      const identifier = req.user?.id || ip;
      const subscriptionTier = req.user?.subscription?.tier || 'free';
      
      const rateLimitResult = await rateLimiter.checkLimit(
        identifier,
        req.path,
        req.method,
        subscriptionTier
      );

      if (!rateLimitResult.allowed) {
        securityManager.recordIPAttempt(ip, false);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter,
          resetTime: rateLimitResult.resetTime,
        });
      }

      // Request sanitization
      const sanitizationResult = securityManager.sanitizeRequest(req);
      if (sanitizationResult.warnings.length > 0) {
        req.securityWarnings = sanitizationResult.warnings;
      }

      // Log security-relevant requests
      if (config?.enableRequestLogging) {
        securityManager.logger.debug('Security middleware passed', {
          ip,
          path: req.path,
          method: req.method,
          userAgent,
          identifier,
          subscriptionTier,
          rateLimitResult: {
            remaining: rateLimitResult.remaining,
            totalHits: rateLimitResult.totalHits,
          },
          sanitized: sanitizationResult.sanitized,
          warnings: sanitizationResult.warnings,
          processingTime: Date.now() - startTime,
        });
      }

      // Record successful attempt
      securityManager.recordIPAttempt(ip, true);

      next();
    } catch (error) {
      securityManager.logger.error('Security middleware error', error as Error, {
        ip,
        path: req.path,
        method: req.method,
      });

      securityManager.recordIPAttempt(ip, false);
      
      // Fail secure - deny request on security middleware error
      return res.status(500).json({
        error: 'Security check failed',
        message: 'Unable to process request securely',
        code: 'SECURITY_ERROR',
      });
    }
  };
}