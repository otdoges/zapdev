import { createHash, randomBytes, createHmac } from 'crypto';
import * as bcrypt from 'bcrypt';
import { withDrizzle } from '../database/connection-enhanced';
import { getLogger } from '../monitoring/logger';
import { getCache } from '../cache/multi-layer-cache';
import { createId } from '@paralleldrive/cuid2';
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// API Keys schema
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  keyId: text('key_id').notNull().unique(),
  name: text('name').notNull(),
  hashedKey: text('hashed_key').notNull(),
  userId: text('user_id').notNull(),
  scope: text('scope').notNull(), // JSON array of permissions
  rateLimit: text('rate_limit'), // JSON object with custom rate limits
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastUsed: integer('last_used', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  metadata: text('metadata'), // JSON object for additional data
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export interface APIKeyConfig {
  name: string;
  userId: string;
  scope: string[];
  expiresInDays?: number;
  customRateLimit?: {
    requests: number;
    windowMs: number;
  };
  metadata?: Record<string, any>;
}

export interface APIKeyInfo {
  id: string;
  keyId: string;
  name: string;
  userId: string;
  scope: string[];
  isActive: boolean;
  lastUsed?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  usage?: {
    totalRequests: number;
    lastRequest?: Date;
    dailyUsage: Record<string, number>;
  };
}

export interface APIKeyUsage {
  keyId: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  success: boolean;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ip?: string;
}

export class APIKeyManager {
  private logger = getLogger();
  private cache = getCache({ namespace: 'apikeys' });
  private usageCache = getCache({ namespace: 'apikey_usage' });

  constructor() {
    // Initialize cleanup interval
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredKeys();
    }, 60 * 60 * 1000); // Every hour
  }

  // Generate new API key
  async generateAPIKey(config: APIKeyConfig): Promise<{
    keyId: string;
    key: string;
    hashedKey: string;
  }> {
    try {
      // Generate key components
      const keyId = `zap_${randomBytes(8).toString('hex')}`;
      const keySecret = randomBytes(32).toString('hex');
      const fullKey = `${keyId}.${keySecret}`;
      
      // Create secure hash
      const hashedKey = createHash('sha256').update(fullKey).digest('hex');
      
      // Calculate expiration
      const expiresAt = config.expiresInDays 
        ? new Date(Date.now() + config.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      // Store in database
      await withDrizzle(async (drizzle) => {
        await drizzle.insert(apiKeys).values({
          keyId,
          name: config.name,
          hashedKey,
          userId: config.userId,
          scope: JSON.stringify(config.scope),
          rateLimit: config.customRateLimit ? JSON.stringify(config.customRateLimit) : null,
          expiresAt,
          metadata: config.metadata ? JSON.stringify(config.metadata) : null,
        });
      });

      // Cache the key info
      await this.cache.set(`key:${keyId}`, {
        keyId,
        hashedKey,
        userId: config.userId,
        scope: config.scope,
        isActive: true,
        expiresAt,
        customRateLimit: config.customRateLimit,
      }, { ttl: 3600 }); // Cache for 1 hour

      this.logger.info('API key generated', {
        keyId,
        userId: config.userId,
        name: config.name,
        scope: config.scope,
        expiresAt,
      });

      return {
        keyId,
        key: fullKey,
        hashedKey,
      };
    } catch (error) {
      this.logger.error('Failed to generate API key', error as Error, config);
      throw error;
    }
  }

  // Validate API key
  async validateAPIKey(providedKey: string): Promise<{
    valid: boolean;
    keyInfo?: APIKeyInfo;
    error?: string;
  }> {
    try {
      if (!providedKey || !providedKey.includes('.')) {
        return { valid: false, error: 'Invalid key format' };
      }

      const [keyId] = providedKey.split('.');
      
      // Try cache first
      let keyData = await this.cache.get(`key:${keyId}`);
      
      if (!keyData) {
        // Fetch from database
        keyData = await withDrizzle(async (drizzle) => {
          const result = await drizzle
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.keyId, keyId))
            .limit(1);
          
          return result[0] || null;
        });

        if (keyData) {
          // Cache the result
          await this.cache.set(`key:${keyId}`, keyData, { ttl: 3600 });
        }
      }

      if (!keyData) {
        return { valid: false, error: 'API key not found' };
      }

      // Check if key is active
      if (!keyData.isActive) {
        return { valid: false, error: 'API key is inactive' };
      }

      // Check expiration
      if (keyData.expiresAt && new Date(keyData.expiresAt) <= new Date()) {
        return { valid: false, error: 'API key has expired' };
      }

      // Validate the key hash (use bcrypt for secure comparison)
      const storedHash = keyData.hashedKey;

      if (!bcrypt.compareSync(providedKey, storedHash)) {
        // Log potential security issue
        this.logger.warn('API key validation failed - hash mismatch', {
          keyId,
          providedHashPrefix: providedKey.substring(0, 8),
          storedHashPrefix: storedHash.substring(0, 8),
        });
        
        return { valid: false, error: 'Invalid API key' };
      }

      // Update last used timestamp
      await this.updateLastUsed(keyId);

      const keyInfo: APIKeyInfo = {
        id: keyData.id,
        keyId: keyData.keyId,
        name: keyData.name,
        userId: keyData.userId,
        scope: JSON.parse(keyData.scope),
        isActive: keyData.isActive,
        lastUsed: keyData.lastUsed ? new Date(keyData.lastUsed) : undefined,
        expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt) : undefined,
        metadata: keyData.metadata ? JSON.parse(keyData.metadata) : undefined,
        createdAt: new Date(keyData.createdAt),
      };

      return { valid: true, keyInfo };
    } catch (error) {
      this.logger.error('API key validation error', error as Error, { keyPrefix: providedKey.substring(0, 20) });
      return { valid: false, error: 'Validation error' };
    }
  }

  // Update last used timestamp
  private async updateLastUsed(keyId: string): Promise<void> {
    try {
      const now = new Date();
      
      // Update in database (async, don't wait)
      withDrizzle(async (drizzle) => {
        await drizzle
          .update(apiKeys)
          .set({ lastUsed: now, updatedAt: now })
          .where(eq(apiKeys.keyId, keyId));
      }).catch(error => {
        this.logger.error('Failed to update last used timestamp', error, { keyId });
      });

      // Update cache
      const cached = await this.cache.get(`key:${keyId}`);
      if (cached) {
        cached.lastUsed = now;
        await this.cache.set(`key:${keyId}`, cached, { ttl: 3600 });
      }
    } catch (error) {
      this.logger.error('Failed to update API key last used', error as Error, { keyId });
    }
  }

  // Record API key usage
  async recordUsage(keyId: string, usage: Omit<APIKeyUsage, 'keyId'>): Promise<void> {
    try {
      const usageRecord: APIKeyUsage = {
        keyId,
        ...usage,
      };

      // Store in cache for real-time stats
      const today = new Date().toISOString().split('T')[0];
      const usageKey = `usage:${keyId}:${today}`;
      
      const dailyUsage = await this.usageCache.get(usageKey) || [];
      dailyUsage.push(usageRecord);
      
      await this.usageCache.set(usageKey, dailyUsage, { ttl: 86400 }); // 24 hours

      // Log usage for monitoring
      this.logger.debug('API key usage recorded', {
        keyId,
        endpoint: usage.endpoint,
        method: usage.method,
        success: usage.success,
        responseTime: usage.responseTime,
        statusCode: usage.statusCode,
      });
    } catch (error) {
      this.logger.error('Failed to record API key usage', error as Error, { keyId });
    }
  }

  // Get API key usage statistics
  async getUsageStats(keyId: string, days = 7): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    dailyBreakdown: Array<{
      date: string;
      requests: number;
      avgResponseTime: number;
    }>;
    endpointUsage: Record<string, number>;
  }> {
    try {
      const stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        dailyBreakdown: [] as any[],
        endpointUsage: {} as Record<string, number>,
      };

      const responseTimes: number[] = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const usageKey = `usage:${keyId}:${dateStr}`;
        const dailyUsage = await this.usageCache.get(usageKey) as APIKeyUsage[] || [];
        
        const dailyRequests = dailyUsage.length;
        const dailyResponseTimes = dailyUsage.map(u => u.responseTime);
        const avgResponseTime = dailyResponseTimes.length > 0
          ? dailyResponseTimes.reduce((a, b) => a + b, 0) / dailyResponseTimes.length
          : 0;
        
        stats.dailyBreakdown.push({
          date: dateStr,
          requests: dailyRequests,
          avgResponseTime: Math.round(avgResponseTime),
        });

        // Aggregate totals
        stats.totalRequests += dailyRequests;
        stats.successfulRequests += dailyUsage.filter(u => u.success).length;
        stats.failedRequests += dailyUsage.filter(u => !u.success).length;
        responseTimes.push(...dailyResponseTimes);

        // Endpoint usage
        for (const usage of dailyUsage) {
          const endpoint = `${usage.method} ${usage.endpoint}`;
          stats.endpointUsage[endpoint] = (stats.endpointUsage[endpoint] || 0) + 1;
        }
      }

      stats.averageResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      return stats;
    } catch (error) {
      this.logger.error('Failed to get API key usage stats', error as Error, { keyId });
      throw error;
    }
  }

  // List API keys for a user
  async listAPIKeys(userId: string): Promise<APIKeyInfo[]> {
    try {
      const keys = await withDrizzle(async (drizzle) => {
        return drizzle
          .select({
            id: apiKeys.id,
            keyId: apiKeys.keyId,
            name: apiKeys.name,
            userId: apiKeys.userId,
            scope: apiKeys.scope,
            isActive: apiKeys.isActive,
            lastUsed: apiKeys.lastUsed,
            expiresAt: apiKeys.expiresAt,
            metadata: apiKeys.metadata,
            createdAt: apiKeys.createdAt,
          })
          .from(apiKeys)
          .where(eq(apiKeys.userId, userId))
          .orderBy(desc(apiKeys.createdAt));
      });

      const keyInfos: APIKeyInfo[] = [];

      for (const key of keys) {
        const keyInfo: APIKeyInfo = {
          id: key.id,
          keyId: key.keyId,
          name: key.name,
          userId: key.userId,
          scope: JSON.parse(key.scope),
          isActive: key.isActive,
          lastUsed: key.lastUsed ? new Date(key.lastUsed) : undefined,
          expiresAt: key.expiresAt ? new Date(key.expiresAt) : undefined,
          metadata: key.metadata ? JSON.parse(key.metadata) : undefined,
          createdAt: new Date(key.createdAt),
        };

        // Add usage statistics
        try {
          const usage = await this.getUsageStats(key.keyId, 1); // Last day
          keyInfo.usage = {
            totalRequests: usage.totalRequests,
            lastRequest: usage.totalRequests > 0 ? new Date() : undefined,
            dailyUsage: {},
          };
        } catch (error) {
          // Don't fail if usage stats can't be retrieved
        }

        keyInfos.push(keyInfo);
      }

      return keyInfos;
    } catch (error) {
      this.logger.error('Failed to list API keys', error as Error, { userId });
      throw error;
    }
  }

  // Revoke API key
  async revokeAPIKey(keyId: string, userId: string): Promise<boolean> {
    try {
      const result = await withDrizzle(async (drizzle) => {
        const updateResult = await drizzle
          .update(apiKeys)
          .set({ 
            isActive: false, 
            updatedAt: new Date() 
          })
          .where(and(
            eq(apiKeys.keyId, keyId),
            eq(apiKeys.userId, userId)
          ));
        
        return updateResult;
      });

      // Remove from cache
      await this.cache.del(`key:${keyId}`);

      this.logger.info('API key revoked', { keyId, userId });
      return true;
    } catch (error) {
      this.logger.error('Failed to revoke API key', error as Error, { keyId, userId });
      return false;
    }
  }

  // Update API key
  async updateAPIKey(
    keyId: string, 
    userId: string, 
    updates: {
      name?: string;
      scope?: string[];
      customRateLimit?: { requests: number; windowMs: number };
      metadata?: Record<string, any>;
    }
  ): Promise<boolean> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.scope) updateData.scope = JSON.stringify(updates.scope);
      if (updates.customRateLimit) updateData.rateLimit = JSON.stringify(updates.customRateLimit);
      if (updates.metadata) updateData.metadata = JSON.stringify(updates.metadata);

      await withDrizzle(async (drizzle) => {
        await drizzle
          .update(apiKeys)
          .set(updateData)
          .where(and(
            eq(apiKeys.keyId, keyId),
            eq(apiKeys.userId, userId)
          ));
      });

      // Invalidate cache
      await this.cache.del(`key:${keyId}`);

      this.logger.info('API key updated', { keyId, userId, updates });
      return true;
    } catch (error) {
      this.logger.error('Failed to update API key', error as Error, { keyId, userId });
      return false;
    }
  }

  // Cleanup expired keys
  async cleanupExpiredKeys(): Promise<number> {
    try {
      const now = new Date();
      
      const result = await withDrizzle(async (drizzle) => {
        // Find expired keys
        const expiredKeys = await drizzle
          .select({ keyId: apiKeys.keyId })
          .from(apiKeys)
          .where(and(
            eq(apiKeys.isActive, true),
            lte(apiKeys.expiresAt, now)
          ));

        if (expiredKeys.length === 0) {
          return 0;
        }

        // Deactivate expired keys
        await drizzle
          .update(apiKeys)
          .set({ isActive: false, updatedAt: now })
          .where(and(
            eq(apiKeys.isActive, true),
            lte(apiKeys.expiresAt, now)
          ));

        // Remove from cache
        for (const key of expiredKeys) {
          await this.cache.del(`key:${key.keyId}`);
        }

        return expiredKeys.length;
      });

      if (result > 0) {
        this.logger.info('Expired API keys cleaned up', { count: result });
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to cleanup expired API keys', error as Error);
      return 0;
    }
  }

  // Check if key has permission for specific scope
  hasPermission(keyInfo: APIKeyInfo, requiredScope: string): boolean {
    // Check if key has wildcard permission
    if (keyInfo.scope.includes('*')) {
      return true;
    }

    // Check exact match
    if (keyInfo.scope.includes(requiredScope)) {
      return true;
    }

    // Check pattern match (e.g., 'read:*' matches 'read:posts')
    for (const scope of keyInfo.scope) {
      if (scope.endsWith('*')) {
        const prefix = scope.slice(0, -1);
        if (requiredScope.startsWith(prefix)) {
          return true;
        }
      }
    }

    return false;
  }

  // Get API key statistics
  async getAPIKeyStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
    usage: {
      last24h: number;
      last7days: number;
      topKeys: Array<{ keyId: string; name: string; requests: number }>;
    };
  }> {
    try {
      const [dbStats, usageStats] = await Promise.all([
        // Database statistics
        withDrizzle(async (drizzle) => {
          const total = await drizzle
            .select({ count: apiKeys.id })
            .from(apiKeys);
          
          const active = await drizzle
            .select({ count: apiKeys.id })
            .from(apiKeys)
            .where(eq(apiKeys.isActive, true));
          
          const expired = await drizzle
            .select({ count: apiKeys.id })
            .from(apiKeys)
            .where(and(
              eq(apiKeys.isActive, true),
              lte(apiKeys.expiresAt, new Date())
            ));

          return {
            total: total.length,
            active: active.length,
            expired: expired.length,
          };
        }),

        // Usage statistics from cache
        this.getOverallUsageStats(),
      ]);

      return {
        ...dbStats,
        usage: usageStats,
      };
    } catch (error) {
      this.logger.error('Failed to get API key statistics', error as Error);
      throw error;
    }
  }

  private async getOverallUsageStats(): Promise<{
    last24h: number;
    last7days: number;
    topKeys: Array<{ keyId: string; name: string; requests: number }>;
  }> {
    // This would require aggregating usage data from cache
    // For now, return mock data
    return {
      last24h: 0,
      last7days: 0,
      topKeys: [],
    };
  }

  // Security monitoring for API keys
  async detectAnomalousUsage(keyId: string): Promise<{
    anomalous: boolean;
    indicators: string[];
    riskScore: number;
  }> {
    try {
      const usage = await this.getUsageStats(keyId, 7);
      const indicators: string[] = [];
      let riskScore = 0;

      // Check for unusual patterns
      if (usage.totalRequests > 10000) {
        indicators.push('High request volume');
        riskScore += 0.3;
      }

      if (usage.failedRequests / usage.totalRequests > 0.5) {
        indicators.push('High error rate');
        riskScore += 0.4;
      }

      if (usage.averageResponseTime > 5000) {
        indicators.push('Slow response times');
        riskScore += 0.2;
      }

      // Check for suspicious endpoint patterns
      const suspiciousEndpoints = Object.keys(usage.endpointUsage).filter(endpoint =>
        endpoint.includes('admin') || 
        endpoint.includes('delete') || 
        endpoint.includes('sensitive')
      );

      if (suspiciousEndpoints.length > 0) {
        indicators.push('Access to sensitive endpoints');
        riskScore += 0.5;
      }

      return {
        anomalous: riskScore > 0.6,
        indicators,
        riskScore: Math.min(riskScore, 1.0),
      };
    } catch (error) {
      this.logger.error('Failed to detect anomalous usage', error as Error, { keyId });
      return {
        anomalous: false,
        indicators: [],
        riskScore: 0,
      };
    }
  }
}

// Global API key manager instance
let globalAPIKeyManager: APIKeyManager | undefined;

export function getAPIKeyManager(): APIKeyManager {
  if (!globalAPIKeyManager) {
    globalAPIKeyManager = new APIKeyManager();
  }
  return globalAPIKeyManager;
}

// API key authentication middleware
export function createAPIKeyAuthMiddleware() {
  const apiKeyManager = getAPIKeyManager();
  
  return async function apiKeyAuthMiddleware(req: any, res: any, next: any) {
    try {
      const apiKey = req.headers['x-api-key'] || 
                   req.headers['authorization']?.replace('Bearer ', '') ||
                   req.query.api_key;

      if (!apiKey) {
        return res.status(401).json({
          error: 'API key required',
          message: 'Please provide a valid API key',
          code: 'MISSING_API_KEY',
        });
      }

      const validation = await apiKeyManager.validateAPIKey(apiKey);
      
      if (!validation.valid) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: validation.error,
          code: 'INVALID_API_KEY',
        });
      }

      // Attach key info to request
      req.apiKey = validation.keyInfo;
      req.user = req.user || { id: validation.keyInfo!.userId };

      // Record usage (async, don't wait)
      const startTime = Date.now();
      const originalEnd = res.end;
      
      res.end = function(...args: any[]) {
        const responseTime = Date.now() - startTime;
        
        apiKeyManager.recordUsage(validation.keyInfo!.keyId, {
          endpoint: req.path || req.url,
          method: req.method,
          timestamp: new Date(),
          success: res.statusCode < 400,
          responseTime,
          statusCode: res.statusCode,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        });
        
        return originalEnd.apply(this, args);
      };

      next();
    } catch (error) {
      console.error('API key authentication error:', error);
      return res.status(500).json({
        error: 'Authentication error',
        message: 'Unable to validate API key',
        code: 'AUTH_ERROR',
      });
    }
  };
}

// Permission checking middleware
export function requirePermission(scope: string | string[]) {
  return function permissionMiddleware(req: any, res: any, next: any) {
    const requiredScopes = Array.isArray(scope) ? scope : [scope];
    const apiKeyInfo = req.apiKey;

    if (!apiKeyInfo) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'API key authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const apiKeyManager = getAPIKeyManager();
    
    for (const requiredScope of requiredScopes) {
      if (!apiKeyManager.hasPermission(apiKeyInfo, requiredScope)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required permission: ${requiredScope}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredScope,
          availableScopes: apiKeyInfo.scope,
        });
      }
    }

    next();
  };
}