import { toast } from 'sonner';
import * as Sentry from '@sentry/react';

const { logger } = Sentry;

interface APIKeyStatus {
  configured: boolean;
  valid?: boolean;
  source: 'environment' | 'user' | 'none';
  error?: string;
}

interface APIKeyValidationResult {
  groq: APIKeyStatus;
  e2b: APIKeyStatus;
  openrouter: APIKeyStatus;
  convex: APIKeyStatus;
  clerk: APIKeyStatus;
  overall: {
    ready: boolean;
    criticalMissing: string[];
    warnings: string[];
  };
}

/**
 * Comprehensive API Key Manager for ZapDev
 * Handles validation, status checking, and user feedback
 */
export class APIKeyManager {
  private static instance: APIKeyManager;

  public static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  private constructor() {}

  /**
   * Validate API key format based on provider
   */
  private validateKeyFormat(key: string, provider: string): boolean {
    if (!key || key.trim().length === 0) return false;
    
    const trimmed = key.trim();
    
    // Check for placeholder values
    if (trimmed.includes('your-api-key') || trimmed.includes('YOUR_API_KEY') || 
        trimmed.includes('xxxxxx') || trimmed === '') {
      return false;
    }

    switch (provider) {
      case 'groq':
        return trimmed.startsWith('gsk_') && trimmed.length > 20;
      
      case 'e2b':
        return trimmed.startsWith('e2b_') && trimmed.length > 20;
      
      case 'openrouter':
        return (trimmed.startsWith('sk-or-') || trimmed.startsWith('sk_or_')) && trimmed.length > 20;
      
      case 'convex':
        return trimmed.includes('.convex.cloud') || trimmed.startsWith('https://');
      
      case 'clerk':
        return trimmed.startsWith('pk_') || trimmed.startsWith('clerk_');
      
      default:
        return trimmed.length > 10; // Basic length check
    }
  }

  /**
   * Get API key status for a specific provider
   */
  private getKeyStatus(envKey: string | undefined, provider: string): APIKeyStatus {
    if (!envKey) {
      return {
        configured: false,
        source: 'none',
        error: `${provider.toUpperCase()} API key not configured`
      };
    }

    const valid = this.validateKeyFormat(envKey, provider);
    
    return {
      configured: true,
      valid,
      source: 'environment',
      error: valid ? undefined : `Invalid ${provider.toUpperCase()} API key format`
    };
  }

  /**
   * Comprehensive validation of all API keys
   */
  public async validateAllKeys(): Promise<APIKeyValidationResult> {
    logger.info('Starting comprehensive API key validation');

    const groqStatus = this.getKeyStatus(
      import.meta.env.VITE_GROQ_API_KEY, 
      'groq'
    );

    const e2bStatus = this.getKeyStatus(
      import.meta.env.VITE_E2B_API_KEY, 
      'e2b'
    );

    const openrouterStatus = this.getKeyStatus(
      import.meta.env.VITE_OPENROUTER_API_KEY, 
      'openrouter'
    );

    const convexStatus = this.getKeyStatus(
      import.meta.env.VITE_CONVEX_URL, 
      'convex'
    );

    const clerkStatus = this.getKeyStatus(
      import.meta.env.VITE_CLERK_PUBLISHABLE_KEY, 
      'clerk'
    );

    // Determine critical missing keys
    const criticalMissing: string[] = [];
    const warnings: string[] = [];

    if (!groqStatus.configured || !groqStatus.valid) {
      criticalMissing.push('Groq AI API key (required for AI responses)');
    }

    if (!convexStatus.configured || !convexStatus.valid) {
      criticalMissing.push('Convex database URL (required for data storage)');
    }

    if (!clerkStatus.configured || !clerkStatus.valid) {
      criticalMissing.push('Clerk authentication key (required for user auth)');
    }

    if (!e2bStatus.configured || !e2bStatus.valid) {
      warnings.push('E2B API key (code execution will be limited)');
    }

    if (!openrouterStatus.configured || !openrouterStatus.valid) {
      warnings.push('OpenRouter API key (AI fallback unavailable)');
    }

    const result: APIKeyValidationResult = {
      groq: groqStatus,
      e2b: e2bStatus,
      openrouter: openrouterStatus,
      convex: convexStatus,
      clerk: clerkStatus,
      overall: {
        ready: criticalMissing.length === 0,
        criticalMissing,
        warnings
      }
    };

    logger.info('API key validation completed', {
      ready: result.overall.ready,
      criticalMissing: criticalMissing.length,
      warnings: warnings.length
    });

    return result;
  }

  /**
   * Display user-friendly status messages
   */
  public async showStatus(): Promise<void> {
    const validation = await this.validateAllKeys();
    
    if (validation.overall.ready) {
      toast.success('🎉 All API keys configured correctly!');
      return;
    }

    if (validation.overall.criticalMissing.length > 0) {
      toast.error(
        `❌ Missing critical API keys: ${validation.overall.criticalMissing.join(', ')}`,
        {
          duration: 8000,
          description: 'Please configure these keys in your .env.local file to use the app.'
        }
      );
    }

    if (validation.overall.warnings.length > 0) {
      toast.warning(
        `⚠️ Optional API keys missing: ${validation.overall.warnings.join(', ')}`,
        {
          duration: 6000,
          description: 'Some features will be limited without these keys.'
        }
      );
    }
  }

  /**
   * Get setup instructions for missing keys
   */
  public getSetupInstructions(validation: APIKeyValidationResult): string {
    const instructions: string[] = [
      '# ZapDev API Key Setup Guide',
      '',
      'To get your app fully working, please add these API keys to your .env.local file:',
      ''
    ];

    if (!validation.groq.valid) {
      instructions.push(
        '## 1. Groq AI API Key (REQUIRED)',
        '- Visit: https://console.groq.com/keys',
        '- Create a new API key',
        '- Add to .env.local: VITE_GROQ_API_KEY=gsk_your_key_here',
        ''
      );
    }

    if (!validation.e2b.valid) {
      instructions.push(
        '## 2. E2B Code Execution API Key (RECOMMENDED)',
        '- Visit: https://e2b.dev/dashboard',
        '- Create a new API key (free tier: 100 hours/month)',
        '- Add to .env.local: VITE_E2B_API_KEY=e2b_your_key_here',
        ''
      );
    }

    if (!validation.convex.valid) {
      instructions.push(
        '## 3. Convex Database URL (REQUIRED)',
        '- Visit: https://dashboard.convex.dev',
        '- Create a new project',
        '- Add to .env.local: VITE_CONVEX_URL=https://your-project.convex.cloud',
        ''
      );
    }

    if (!validation.clerk.valid) {
      instructions.push(
        '## 4. Clerk Authentication (REQUIRED)',
        '- Visit: https://dashboard.clerk.com',
        '- Create a new application',
        '- Add to .env.local: VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here',
        ''
      );
    }

    if (!validation.openrouter.valid) {
      instructions.push(
        '## 5. OpenRouter API Key (OPTIONAL - AI Failsafe)',
        '- Visit: https://openrouter.ai/dashboard',
        '- Create a new API key',
        '- Add to .env.local: VITE_OPENROUTER_API_KEY=sk-or-your_key_here',
        ''
      );
    }

    instructions.push(
      '## After adding keys:',
      '1. Restart your development server: bun dev',
      '2. The app will automatically detect the new keys',
      '3. Test AI functionality in the chat interface',
      ''
    );

    return instructions.join('\n');
  }

  /**
   * Check if critical features are available
   */
  public async checkFeatureAvailability(): Promise<{
    aiChat: boolean;
    codeExecution: boolean;
    userAuth: boolean;
    dataStorage: boolean;
  }> {
    const validation = await this.validateAllKeys();
    
    return {
      aiChat: validation.groq.valid === true,
      codeExecution: validation.e2b.valid === true,
      userAuth: validation.clerk.valid === true,
      dataStorage: validation.convex.valid === true
    };
  }
}

// Export singleton instance
export const apiKeyManager = APIKeyManager.getInstance();

// Export validation result type for use in components
export type { APIKeyValidationResult };