import { NextRequest, NextResponse } from 'next/server';
import { getAPIKeyManager } from '@/lib/security/api-key-manager';
import { getSecurityManager } from '@/lib/security/security-middleware';
import { getLogger } from '@/lib/monitoring/logger';
import { auth } from '@clerk/nextjs/server';

const logger = getLogger();
const apiKeyManager = getAPIKeyManager();
const securityManager = getSecurityManager();

// List user's API keys
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    logger.info('API keys list requested', { userId });

    const apiKeys = await apiKeyManager.listAPIKeys(userId);
    
    // Remove sensitive information
    const sanitizedKeys = apiKeys.map(key => ({
      id: key.id,
      keyId: key.keyId,
      name: key.name,
      scope: key.scope,
      isActive: key.isActive,
      lastUsed: key.lastUsed,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      usage: key.usage,
      // Don't return the actual key or hash
    }));

    return NextResponse.json({
      apiKeys: sanitizedKeys,
      total: sanitizedKeys.length,
      active: sanitizedKeys.filter(k => k.isActive).length,
    });
  } catch (error) {
    logger.error('Failed to list API keys', error as Error);
    return NextResponse.json(
      { error: 'Failed to retrieve API keys' },
      { status: 500 }
    );
  }
}

// Create new API key
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = securityManager.validateAndSanitizeInput(body, [
      {
        field: 'name',
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 100,
        sanitize: true,
      },
      {
        field: 'scope',
        type: 'array',
        required: true,
        customValidator: (scopes) => {
          if (!Array.isArray(scopes) || scopes.length === 0) {
            return 'At least one scope is required';
          }
          
          const validScopes = [
            'read', 'write', 'delete',
            'read:*', 'write:*',
            'ai:generate', 'ai:analyze',
            'sandbox:create', 'sandbox:manage',
            'files:read', 'files:write',
            'admin:*', // Only for admin users
          ];
          
          for (const scope of scopes) {
            if (typeof scope !== 'string') {
              return 'All scopes must be strings';
            }
            
            // Allow wildcard patterns
            const isValidPattern = validScopes.some(validScope => {
              if (validScope.endsWith('*')) {
                return scope.startsWith(validScope.slice(0, -1));
              }
              return scope === validScope;
            });
            
            if (!isValidPattern) {
              return `Invalid scope: ${scope}`;
            }
          }
          
          return true;
        },
      },
      {
        field: 'expiresInDays',
        type: 'number',
        required: false,
        customValidator: (days) => {
          if (days !== undefined && (days < 1 || days > 365)) {
            return 'Expiration must be between 1 and 365 days';
          }
          return true;
        },
      },
      {
        field: 'customRateLimit',
        type: 'json',
        required: false,
        customValidator: (limit) => {
          if (limit && (!limit.requests || !limit.windowMs)) {
            return 'Custom rate limit must include requests and windowMs';
          }
          return true;
        },
      },
      {
        field: 'metadata',
        type: 'json',
        required: false,
      },
    ]);

    if (!validation.valid) {
      logger.warn('API key creation validation failed', {
        userId,
        errors: validation.errors,
      });
      
      return NextResponse.json({
        error: 'Invalid input',
        errors: validation.errors,
      }, { status: 400 });
    }

    const { name, scope, expiresInDays, customRateLimit, metadata } = validation.sanitized;

    // Check for admin scopes
    const hasAdminScope = scope.some((s: string) => s.includes('admin'));
    if (hasAdminScope) {
      // In a real app, check if user is admin
      // For now, reject admin scopes
      return NextResponse.json({
        error: 'Admin scopes not allowed',
        message: 'Contact support for admin API access',
      }, { status: 403 });
    }

    // Check existing API key limit (e.g., max 10 per user)
    const existingKeys = await apiKeyManager.listAPIKeys(userId);
    if (existingKeys.length >= 10) {
      return NextResponse.json({
        error: 'API key limit reached',
        message: 'Maximum 10 API keys per user. Please delete unused keys.',
        current: existingKeys.length,
        limit: 10,
      }, { status: 429 });
    }

    // Generate new API key
    const keyData = await apiKeyManager.generateAPIKey({
      name,
      userId,
      scope,
      expiresInDays,
      customRateLimit,
      metadata,
    });

    logger.info('API key created', {
      userId,
      keyId: keyData.keyId,
      name,
      scope,
      expiresInDays,
    });

    // Return the API key (only time it's shown in full)
    return NextResponse.json({
      message: 'API key created successfully',
      apiKey: {
        keyId: keyData.keyId,
        key: keyData.key, // Full key - only shown once
        name,
        scope,
        expiresInDays,
      },
      warning: 'Store this key securely. It will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create API key', error as Error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// Update API key
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID required' },
        { status: 400 }
      );
    }

    // Validate input
    const validation = securityManager.validateAndSanitizeInput(body, [
      {
        field: 'name',
        type: 'string',
        required: false,
        minLength: 1,
        maxLength: 100,
        sanitize: true,
      },
      {
        field: 'scope',
        type: 'array',
        required: false,
      },
      {
        field: 'metadata',
        type: 'json',
        required: false,
      },
    ]);

    if (!validation.valid) {
      return NextResponse.json({
        error: 'Invalid input',
        errors: validation.errors,
      }, { status: 400 });
    }

    const updates = validation.sanitized;

    const success = await apiKeyManager.updateAPIKey(keyId, userId, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update API key or key not found' },
        { status: 404 }
      );
    }

    logger.info('API key updated', {
      userId,
      keyId,
      updates: Object.keys(updates),
    });

    return NextResponse.json({
      message: 'API key updated successfully',
      keyId,
    });
  } catch (error) {
    logger.error('Failed to update API key', error as Error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// Delete/revoke API key
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID required' },
        { status: 400 }
      );
    }

    const success = await apiKeyManager.revokeAPIKey(keyId, userId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke API key or key not found' },
        { status: 404 }
      );
    }

    logger.info('API key revoked', {
      userId,
      keyId,
    });

    return NextResponse.json({
      message: 'API key revoked successfully',
      keyId,
    });
  } catch (error) {
    logger.error('Failed to revoke API key', error as Error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}