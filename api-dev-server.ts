import { createServer, IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import * as path from 'path';
import { existsSync, readdirSync } from 'fs';
import cluster from 'cluster';
import os from 'os';
import { logger } from './src/lib/error-handler.js';

// Security-first configuration with PostHog Analytics
const CONFIG = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENABLE_CLUSTERING: process.env.ENABLE_CLUSTERING === 'true',
  ENABLE_ANALYTICS: process.env.NODE_ENV !== 'production' ? false : (process.env.POSTHOG_API_KEY ? true : false),
  MAX_WORKERS: Number(process.env.MAX_WORKERS) || Math.min(4, os.cpus().length),
  TIMEOUT: Number(process.env.REQUEST_TIMEOUT) || 30000,
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
  RATE_LIMIT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // per IP
  },
  METRICS_INTERVAL: 60000, // 1 minute
};

// PostHog Analytics Integration (server-only, secure configuration)
class PostHogAnalytics {
  private readonly apiKey: string;
  private readonly host: string;
  private readonly MAX_PAYLOAD_SIZE = 32 * 1024; // 32KB limit
  
  constructor() {
    this.apiKey = process.env.POSTHOG_API_KEY || '';
    this.host = process.env.POSTHOG_HOST || 'https://app.posthog.com';
  }
  
  capture(event: { event: string; properties?: Record<string, unknown> }): void {
    if (!CONFIG.ENABLE_ANALYTICS || !this.apiKey) return;
    
    // Sanitize and limit payload size
    const sanitizedProperties = this.sanitizeProperties(event.properties || {});
    
    const payload = {
      api_key: this.apiKey,
      event: event.event,
      properties: {
        ...sanitizedProperties,
        timestamp: new Date().toISOString(),
        server_instance: 'universal-api-server',
        environment: CONFIG.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    };
    
    // Check payload size before sending
    const payloadString = JSON.stringify(payload);
    if (payloadString.length > this.MAX_PAYLOAD_SIZE) {
      logger.warn('PostHog payload too large, truncating', { size: payloadString.length });
      // Truncate properties if payload is too large
      const truncatedPayload = {
        ...payload,
        properties: {
          ...payload.properties,
          _truncated: true,
          _original_size: payloadString.length
        }
      };
      const truncatedString = JSON.stringify(truncatedPayload);
      if (truncatedString.length <= this.MAX_PAYLOAD_SIZE) {
        this.sendPayload(truncatedString);
        return;
      }
    }
    
    this.sendPayload(payloadString);
  }
  
  private sendPayload(payloadString: string): void {
    // Fire-and-forget analytics (non-blocking)
    fetch(`${this.host}/capture/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': payloadString.length.toString()
      },
      body: payloadString,
    }).catch(error => {
      logger.warn('PostHog capture failed', error);
    });
  }
  
  private sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const PII_PATTERNS = [
      /email/i,
      /password/i, 
      /token/i,
      /key/i,
      /secret/i,
      /auth/i,
      /credit/i,
      /card/i,
      /ssn/i,
      /social/i,
      /phone/i,
      /address/i
    ];
    
    for (const [key, value] of Object.entries(properties)) {
      // Skip potentially sensitive keys
      const isSensitive = PII_PATTERNS.some(pattern => pattern.test(key));
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Sanitize string values
      if (typeof value === 'string') {
        // Truncate very long strings
        if (value.length > 1000) {
          // eslint-disable-next-line security/detect-object-injection
          sanitized[key] = value.substring(0, 1000) + '[TRUNCATED]';
        } else {
          // eslint-disable-next-line security/detect-object-injection
          sanitized[key] = value;
        }
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[key] = value;
      } else if (value === null || value === undefined) {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[key] = value;
      } else {
        // For objects/arrays, convert to string and truncate
        try {
          const stringified = JSON.stringify(value);
          // eslint-disable-next-line security/detect-object-injection
          sanitized[key] = stringified.length > 500 
            ? stringified.substring(0, 500) + '[TRUNCATED]'
            : stringified;
        } catch {
          // eslint-disable-next-line security/detect-object-injection
          sanitized[key] = '[INVALID_JSON]';
        }
      }
    }
    
    return sanitized;
  }
  
  trackApiRequest(data: {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    userAgent?: string;
    ip?: string;
  }): void {
    this.capture({
      event: 'api_request',
      properties: {
        endpoint: data.endpoint,
        method: data.method,
        status_code: data.statusCode,
        duration_ms: Math.round(data.duration),
        user_agent: data.userAgent,
        ip_hash: data.ip ? this.hashIP(data.ip) : undefined,
        success: data.statusCode < 400,
      },
    });
  }
  
  trackServerMetrics(metrics: ServerMetrics): void {
    this.capture({
      event: 'server_metrics',
      properties: {
        total_requests: metrics.totalRequests,
        successful_requests: metrics.successfulRequests,
        failed_requests: metrics.failedRequests,
        avg_response_time_ms: Math.round(metrics.averageResponseTime),
        uptime_ms: Date.now() - metrics.startTime,
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        cpu_usage: process.cpuUsage(),
      },
    });
  }
  
  private hashIP(ip: string): string {
    // Simple hash for privacy
    return Buffer.from(ip).toString('base64').substring(0, 8);
  }
}

const analytics = new PostHogAnalytics();

// Utility function to sanitize error messages for client responses
function sanitizeErrorForClient(error: Error | unknown, isDevelopment: boolean = false): { error: string; code?: string } {
  if (!error) {
    return { error: 'Unknown error occurred' };
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // In development, provide more details (but still sanitized)
  if (isDevelopment && CONFIG.NODE_ENV === 'development') {
    // Remove sensitive paths and internal details but keep useful info
    const sanitized = errorMessage
      .replace(/\/[^/\s]*\/([^/\s]*\/)*[^/\s]*(\.(js|ts|json))/g, '[FILE_PATH]')
      .replace(/at\s+[^\s]+\s+\([^)]+\)/g, '[STACK_TRACE]')
      .replace(/ENOENT.*'/g, 'File not found')
      .replace(/EACCES.*'/g, 'Permission denied')
      .replace(/Error:\s*/g, '');
    
    return { 
      error: sanitized.length > 200 ? sanitized.substring(0, 200) + '...' : sanitized,
      code: 'DEVELOPMENT_ERROR'
    };
  }
  
  // In production, return generic errors for security
  const commonErrors: Record<string, string> = {
    'Request timeout': 'Request timed out',
    'Invalid API handler export': 'Service temporarily unavailable',
    'ENOENT': 'Resource not found',
    'EACCES': 'Access denied',
    'ETIMEDOUT': 'Request timed out',
    'ECONNRESET': 'Connection interrupted'
  };
  
  // Check for known error patterns
  for (const [pattern, safeMessage] of Object.entries(commonErrors)) {
    if (errorMessage.includes(pattern)) {
      return { error: safeMessage };
    }
  }
  
  // Default safe error message
  return { error: 'Internal server error' };
}

// Rate limiting with secure IP validation and bounded storage
const MAX_RATE_LIMIT_ENTRIES = 10000; // Prevent unbounded growth
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Cleanup every minute

function validateAndNormalizeIP(ip: string): string | null {
  if (!ip || typeof ip !== 'string') return null;
  
  const trimmedIP = ip.trim();
  
  // Safe IPv4 validation using split and numeric validation
  if (validateIPv4(trimmedIP)) {
    return trimmedIP;
  }
  
  // Safe IPv6 validation using split and hex validation
  if (validateIPv6(trimmedIP)) {
    return trimmedIP;
  }
  
  return null;
}

// Safe IPv4 validation without regex DoS vulnerability
function validateIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  return parts.every(part => {
    if (!/^\d+$/.test(part)) return false; // Only digits allowed
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === num.toString(); // No leading zeros
  });
}

// Safe IPv6 validation without regex DoS vulnerability
function validateIPv6(ip: string): boolean {
  // Handle special cases
  if (ip === '::1' || ip === '::') return true;
  
  // Basic IPv6 structure validation without complex regex
  if (ip.includes('::')) {
    // Double colon can only appear once
    if (ip.split('::').length !== 2) return false;
    
    const parts = ip.split('::');
    const leftParts = parts[0] ? parts[0].split(':') : [];
    const rightParts = parts[1] ? parts[1].split(':') : [];
    
    // Total parts should not exceed 8
    if (leftParts.length + rightParts.length > 7) return false;
    
    return [...leftParts, ...rightParts].every(part => 
      part === '' || (part.length <= 4 && /^[0-9a-fA-F]+$/.test(part))
    );
  } else {
    // Standard IPv6 format (8 groups of 4 hex digits)
    const parts = ip.split(':');
    if (parts.length !== 8) return false;
    
    return parts.every(part => 
      part.length >= 1 && part.length <= 4 && /^[0-9a-fA-F]+$/.test(part)
    );
  }
}

function checkRateLimit(req: IncomingMessage): boolean {
  // Use trusted IP sources - prefer socket.remoteAddress over headers
  const rawIP = req.socket.remoteAddress || req.headers['x-forwarded-for'] as string || 'unknown';
  const validIP = validateAndNormalizeIP(Array.isArray(rawIP) ? rawIP[0] : rawIP);
  
  if (!validIP) {
    logger.warn('Invalid IP for rate limiting', { rawIP });
    return false; // Reject requests with invalid IPs
  }
  
  const now = Date.now();
  const key = validIP;
  const limit = rateLimitMap.get(key);
  
  // Enforce bounded storage - evict oldest entries if at limit
  if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES && !limit) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (oldestKey) {
      rateLimitMap.delete(oldestKey);
    }
  }
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + CONFIG.RATE_LIMIT.windowMs,
    });
    return true;
  }
  
  if (limit.count >= CONFIG.RATE_LIMIT.maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Server metrics tracking
interface ServerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  startTime: number;
}

const metrics: ServerMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  startTime: Date.now(),
};

// Enhanced Vercel Request with Security
interface VercelRequest {
  url: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: unknown): void;
  send(data: string | Buffer): void;
  end(): void;
  setHeader(name: string, value: string | number | readonly string[]): VercelResponse;
  redirect(statusOrUrl: string | number, url?: string): void;
  revalidate(): Promise<void>;
}

class EnhancedVercelRequest implements VercelRequest {
  public url: string;
  public method: string;
  public headers: Record<string, string | string[] | undefined>;
  public body: unknown;
  public query: Record<string, string | string[]>;
  public cookies: Record<string, string>;
  
  constructor(req: IncomingMessage, body: string) {
    this.url = req.url || '/';
    this.method = req.method || 'GET';
    
    // Safe header handling
    this.headers = {};
    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof key === 'string') {
          this.headers[key.toLowerCase()] = value;
        }
      }
    }
    
    const urlObj = new URL(this.url, `http://localhost:${CONFIG.PORT}`);
    this.query = this.parseQuery(urlObj.searchParams);
    this.cookies = this.parseCookies(req.headers.cookie);
    this.body = this.parseBody(body, this.headers['content-type'] as string);
  }
  
  async json(): Promise<unknown> {
    return Promise.resolve(this.body);
  }
  
  async text(): Promise<string> {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
  }
  
  private parseCookies(cookieHeader?: string): Record<string, string> {
    const cookies = Object.create(null) as Record<string, string>;
    if (!cookieHeader) return cookies;
    
    const COOKIE_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
    const MAX_NAME_LENGTH = 256;
    const MAX_VALUE_LENGTH = 4096;
    let skippedCount = 0;
    
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        const [name, ...rest] = parts;
        const trimmedName = name.trim();
        const rawValue = rest.join('=');
        
        // Validate cookie name against safe pattern
        if (!COOKIE_NAME_PATTERN.test(trimmedName)) {
          skippedCount++;
          return;
        }
        
        // Enforce length limits
        if (trimmedName.length > MAX_NAME_LENGTH || rawValue.length > MAX_VALUE_LENGTH) {
          skippedCount++;
          return;
        }
        
        // Attempt decoding, skip if it fails
        try {
          const decodedValue = decodeURIComponent(rawValue);
          // eslint-disable-next-line security/detect-object-injection
          cookies[trimmedName] = decodedValue;
        } catch {
          // Skip malformed cookies - do not use raw value
          skippedCount++;
        }
      }
    });
    
    // Log skipped entries for telemetry
    if (skippedCount > 0) {
      logger.debug(`Skipped ${skippedCount} malformed/invalid cookies`);
    }
    
    return cookies;
  }

  private parseQuery(searchParams: URLSearchParams): { [key: string]: string | string[] } {
    const query: { [key: string]: string | string[] } = {};
    for (const [key, value] of searchParams.entries()) {
      const safeKey = String(key);
      const existingValue = query[safeKey];
      if (existingValue) {
        if (Array.isArray(existingValue)) {
          (existingValue as string[]).push(value);
        } else {
          query[safeKey] = [existingValue as string, value];
        }
      } else {
        query[safeKey] = value;
      }
    }
    return query;
  }

  private parseBody(body: string, contentType?: string): unknown {
    if (!body) return undefined;
    try {
      if (contentType?.includes('application/json') || body.trim().startsWith('{')) {
        return JSON.parse(body);
      }
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(body);
        const result: Record<string, string> = {};
        for (const [key, value] of params.entries()) {
          const safeKey = String(key);
          result[safeKey] = value;
        }
        return result;
      }
      return body;
    } catch {
      return body;
    }
  }
}

// 🚀 Enhanced VercelResponse with Analytics & Security
class EnhancedVercelResponse implements VercelResponse {
  private res: ServerResponse;
  private statusCode: number = 200;
  private headers: { [key: string]: string } = {};
  private startTime: number;
  private endpoint: string;
  
  constructor(res: ServerResponse, endpoint: string) {
    this.res = res;
    this.startTime = performance.now();
    this.endpoint = endpoint;
    this.setSecurityHeaders();
  }
  
  private setSecurityHeaders(): void {
    this.setHeader('X-Content-Type-Options', 'nosniff');
    this.setHeader('X-Frame-Options', 'DENY');
    this.setHeader('X-XSS-Protection', '1; mode=block');
    this.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    if (CONFIG.NODE_ENV === 'production') {
      this.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  }
  
  setHeader(name: string, value: string | number | readonly string[]): this {
    const headerName = String(name);
    const headerValue = String(value);
    this.headers[headerName] = headerValue;
    this.res.setHeader(headerName, value);
    return this;
  }
  
  status(code: number): this {
    this.statusCode = code;
    return this;
  }
  
  json(data: unknown): void {
    try {
      const jsonString = JSON.stringify(data, null, CONFIG.NODE_ENV === 'development' ? 2 : undefined);
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
      this.res.writeHead(this.statusCode, this.headers);
      this.res.end(jsonString);
      this.trackResponse(jsonString.length);
    } catch (error) {
      logger.error('JSON serialization failed', error);
      this.internalError('Serialization failed');
    }
  }
  
  send(data: string | Buffer): void {
    const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data as string, 'utf8');
    const contentType = this.headers['Content-Type'];
    if (!Buffer.isBuffer(data) && !contentType) {
      this.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    this.res.writeHead(this.statusCode, this.headers);
    this.res.end(data);
    this.trackResponse(size);
  }
  
  end(): void {
    this.res.writeHead(this.statusCode, this.headers);
    this.res.end();
    this.trackResponse(0);
  }
  
  redirect(statusOrUrl: string | number, url?: string): void {
    if (typeof statusOrUrl === 'number') {
      this.statusCode = statusOrUrl;
      this.setHeader('Location', url || '');
    } else {
      this.statusCode = 302;
      this.setHeader('Location', statusOrUrl);
    }
    this.end();
  }
  
  revalidate(): Promise<void> {
    return Promise.resolve();
  }
  
  private internalError(message: string): void {
    this.statusCode = 500;
    this.json({ error: 'Internal Server Error', message });
  }
  
  private trackResponse(size: number): void {
    const duration = performance.now() - this.startTime;
    
    // Update metrics
    metrics.totalRequests++;
    if (this.statusCode < 400) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + duration) / metrics.totalRequests;
    
    // Track with PostHog
    if (CONFIG.ENABLE_ANALYTICS) {
      analytics.trackApiRequest({
        endpoint: this.endpoint,
        method: this.res.req?.method || 'UNKNOWN',
        statusCode: this.statusCode,
        duration,
        userAgent: this.res.req?.headers['user-agent'] as string,
        ip: this.res.req?.socket.remoteAddress,
      });
    }
    
    logger.debug('API Response', {
      endpoint: this.endpoint,
      status: this.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      size: `${size}B`,
    });
  }
}

// Production-Ready Server with PostHog Analytics
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // Enhanced CORS
  const origin = req.headers.origin;
  const allowedOrigin = CONFIG.CORS_ORIGINS.includes('*') || 
    (origin && CONFIG.CORS_ORIGINS.includes(origin)) ? (origin || '*') : null;
  
  if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Rate limiting with secure IP validation
  if (!checkRateLimit(req)) {
    const ip = req.socket.remoteAddress || 'unknown';
    logger.warn('Rate limit exceeded', { ip, url: req.url });
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
    return;
  }
  
  const url = new URL(req.url || '', `http://localhost:${CONFIG.PORT}`);
  
  // Health check
  if (url.pathname === '/health') {
    const healthData = {
      status: 'healthy',
      uptime: Date.now() - metrics.startTime,
      metrics,
      environment: CONFIG.NODE_ENV,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData, null, 2));
    return;
  }
  
  // API routes only
  if (!url.pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found - API server only handles /api/* routes' }));
    return;
  }
  
  const endpoint = url.pathname.replace('/api/', '');
  
  // Strict endpoint validation - only allow safe characters
  if (!/^[A-Za-z0-9_-]+$/.test(endpoint)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid endpoint name' }));
    return;
  }
  
  // Reject any input with null bytes or path separators
  if (endpoint.includes('\0') || endpoint.includes('/') || endpoint.includes('\\') || endpoint.includes('..')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `API endpoint not found: ${endpoint}` }));
    return;
  }
  
  // Secure path resolution with validation
  const validApiPath = path.resolve(join(__dirname, 'api'));
  const resolvedApiPath = path.resolve(validApiPath, `${endpoint}.ts`);
  
  // Ensure the resolved path starts with the valid API path
  if (!resolvedApiPath.startsWith(validApiPath + path.sep) && resolvedApiPath !== validApiPath) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `API endpoint not found: ${endpoint}` }));
    return;
  }
  
  // Double-check with path.relative to prevent escaping
  const relativePath = path.relative(validApiPath, resolvedApiPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `API endpoint not found: ${endpoint}` }));
    return;
  }
  
  // Safe file existence check
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!existsSync(resolvedApiPath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `API endpoint not found: ${endpoint}` }));
    return;
  }
  
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
    if (body.length > 10485760) { // 10MB limit
      res.writeHead(413);
      res.end(JSON.stringify({ error: 'Request body too large' }));
    }
  });
  
  req.on('end', async () => {
    try {
      const mockReq = new EnhancedVercelRequest(req, body);
      const mockRes = new EnhancedVercelResponse(res, endpoint);
      
      logger.info('API Request', { method: req.method, endpoint, ip: req.socket.remoteAddress || 'unknown' });
      
      const moduleUrl = CONFIG.NODE_ENV === 'development' 
        ? `file://${resolvedApiPath}?t=${Date.now()}`
        : `file://${resolvedApiPath}`;
        
      const module = await import(moduleUrl);
      const handler = module.default;
      
      if (typeof handler !== 'function') {
        throw new Error('Invalid API handler export');
      }
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.TIMEOUT);
      });
      
      await Promise.race([handler(mockReq, mockRes), timeoutPromise]);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const ip = req.socket.remoteAddress || 'unknown';
      
      logger.error('API Handler Error', error, { endpoint, method: req.method, ip });
      
      if (CONFIG.ENABLE_ANALYTICS) {
        analytics.capture({
          event: 'api_error',
          properties: { endpoint, error_message: errorMsg, method: req.method, ip_address: ip },
        });
      }
      
      if (!res.headersSent) {
        // Use sanitized error message for client response
        const sanitizedError = sanitizeErrorForClient(error, CONFIG.NODE_ENV === 'development');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sanitizedError));
      }
    }
  });
});

// Start server with clustering support
if (CONFIG.ENABLE_CLUSTERING && cluster.isPrimary) {
  logger.info(`💻 Starting ${CONFIG.MAX_WORKERS} workers`);
  for (let i = 0; i < CONFIG.MAX_WORKERS; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    logger.warn(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  server.listen(CONFIG.PORT, () => {
    logger.info('🚀 Universal API Server with PostHog Analytics', {
      port: CONFIG.PORT,
      environment: CONFIG.NODE_ENV,
      analytics: CONFIG.ENABLE_ANALYTICS,
      clustering: CONFIG.ENABLE_CLUSTERING,
    });
    
    // List endpoints with additional security validation
    const apiDir = path.resolve(join(__dirname, 'api'));
    const validApiBaseDir = path.resolve(__dirname);
    
    // Ensure apiDir is within the expected directory structure
    if (typeof apiDir === 'string' && apiDir.length > 0 && 
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        apiDir.startsWith(validApiBaseDir) && existsSync(apiDir)) {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const endpoints = readdirSync(apiDir)
          .filter(file => {
            // Enhanced filtering for security
            return typeof file === 'string' &&
                   file.endsWith('.ts') && 
                   !file.startsWith('_') && 
                   !file.includes('..') &&
                   /^[A-Za-z0-9_-]+\.ts$/.test(file);
          })
          .map(file => file.replace('.ts', ''));
        
        console.log('\n📊 Available Endpoints:');
        endpoints.forEach(endpoint => {
          if (typeof endpoint === 'string' && /^[A-Za-z0-9_-]+$/.test(endpoint)) {
            console.log(`  • http://localhost:${CONFIG.PORT}/api/${endpoint}`);
          }
        });
      } catch (error) {
        logger.warn('Failed to list API endpoints safely', error);
      }
    }
    
    console.log(`\n🔍 Health: http://localhost:${CONFIG.PORT}/health`);
    console.log('🎉 Production Ready with PostHog Analytics!');
    
    // Start metrics reporting
    if (CONFIG.ENABLE_ANALYTICS) {
      setInterval(() => {
        analytics.trackServerMetrics(metrics);
        logger.info('Metrics reported to PostHog', {
          requests: metrics.totalRequests,
          uptime: `${((Date.now() - metrics.startTime) / 1000).toFixed(0)}s`
        });
      }, CONFIG.METRICS_INTERVAL);
      
      analytics.capture({
        event: 'server_started',
        properties: {
          environment: CONFIG.NODE_ENV,
          port: CONFIG.PORT,
          node_version: process.version,
        },
      });
    }
  });
  
  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    if (CONFIG.ENABLE_ANALYTICS) {
      analytics.capture({
        event: 'server_shutdown',
        properties: { signal, uptime: Date.now() - metrics.startTime },
      });
    }
    server.close(() => process.exit(0));
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}