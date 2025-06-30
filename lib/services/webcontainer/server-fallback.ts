import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export interface FallbackServerConfig {
  apiUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableSSR?: boolean;
}

export interface FallbackResult {
  success: boolean;
  content?: string;
  url?: string;
  error?: string;
  method: 'webcontainer' | 'server' | 'static';
}

export class ServerFallbackService {
  private config: FallbackServerConfig;
  private fallbackAttempts = 0;
  private maxAttempts = 3;

  constructor(config: FallbackServerConfig = {}) {
    this.config = {
      apiUrl: '/api/webcontainer/fallback',
      timeout: 30000,
      retryAttempts: 2,
      enableSSR: true,
      ...config,
    };
  }

  async executeWithFallback(
    primaryAction: () => Promise<FallbackResult>,
    code: string,
    projectType: 'html' | 'react' | 'vue' | 'svelte' = 'html'
  ): Promise<FallbackResult> {
    try {
      // Try primary WebContainer method first
      console.log('🚀 Attempting WebContainer execution...');
      const primaryResult = await this.withTimeout(primaryAction(), this.config.timeout!);
      
      if (primaryResult.success) {
        console.log('✅ WebContainer execution successful');
        return { ...primaryResult, method: 'webcontainer' };
      }
      
      throw new Error(primaryResult.error || 'WebContainer execution failed');
    } catch (error) {
      console.warn('⚠️ WebContainer failed, attempting server fallback...', error);
      return this.executeServerFallback(code, projectType);
    }
  }

  private async executeServerFallback(
    code: string,
    projectType: string
  ): Promise<FallbackResult> {
    if (!this.config.enableSSR) {
      return this.executeStaticFallback(code, projectType);
    }

    try {
      const response = await fetch(this.config.apiUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          projectType,
          fallbackAttempt: this.fallbackAttempts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server fallback failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Server fallback successful');
        return { ...result, method: 'server' };
      }
      
      throw new Error(result.error || 'Server fallback execution failed');
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Server fallback failed:', error);
      console.warn('⚠️ Server fallback failed, using static fallback...', error);
      return this.executeStaticFallback(code, projectType);
    }
  }

  private async executeStaticFallback(
    code: string,
    projectType: string
  ): Promise<FallbackResult> {
    try {
      console.log('📄 Using static fallback...');
      
      // Create a static HTML preview
      const staticHTML = this.generateStaticPreview(code, projectType);
      
      // Create a blob URL for preview
      const blob = new Blob([staticHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      console.log('✅ Static fallback ready');
      
      return {
        success: true,
        content: staticHTML,
        url,
        method: 'static',
      };
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Static fallback failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Static fallback failed',
        method: 'static',
      };
    }
  }

  private generateStaticPreview(code: string, projectType: string): string {
    switch (projectType) {
      case 'html':
        return this.enhanceHTMLCode(code);
      case 'react':
        return this.generateReactPreview(code);
      case 'vue':
        return this.generateVuePreview(code);
      case 'svelte':
        return this.generateSveltePreview(code);
      default:
        return this.enhanceHTMLCode(code);
    }
  }

  private enhanceHTMLCode(code: string): string {
    // If it's already a complete HTML document, enhance it
    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      return this.addFallbackStyles(code);
    }

    // Otherwise, wrap in a complete HTML document
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZapDev Preview (Static Mode)</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #0d0d10;
            color: #eaeaea;
        }
        .fallback-notice {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            text-align: center;
        }
        .fallback-notice h3 {
            margin: 0 0 8px 0;
            color: #fbbf24;
        }
        .fallback-notice p {
            margin: 0;
            font-size: 14px;
            opacity: 0.8;
        }
        ${this.getResponsiveStyles()}
    </style>
</head>
<body>
    <div class="fallback-notice">
        <h3>⚡ Static Preview Mode</h3>
        <p>WebContainer is not available. Showing static preview for better compatibility.</p>
    </div>
    ${code}
</body>
</html>
    `.trim();
  }

  private generateReactPreview(code: string): string {
    // Simple React to HTML conversion for static preview
    const htmlContent = code
      .replace(/import.*from.*;/g, '')
      .replace(/export default function.*{/, '<div>')
      .replace(/}$/, '</div>')
      .replace(/className=/g, 'class=')
      .replace(/{.*}/g, '[Dynamic Content]');

    return this.enhanceHTMLCode(htmlContent);
  }

  private generateVuePreview(code: string): string {
    // Extract template content from Vue SFC
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
    const htmlContent = templateMatch ? templateMatch[1] : code;
    
    return this.enhanceHTMLCode(htmlContent);
  }

  private generateSveltePreview(code: string): string {
    // Extract HTML content from Svelte component
    const htmlContent = code
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/\{.*?\}/g, '[Dynamic Content]');

    return this.enhanceHTMLCode(htmlContent);
  }

  private addFallbackStyles(html: string): string {
    const fallbackCSS = `
      <style>
        .webcontainer-fallback-notice {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(251, 191, 36, 0.9);
          color: #1a1a1a;
          padding: 12px 16px;
          border-radius: 8px;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          z-index: 10000;
          max-width: 300px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        ${this.getResponsiveStyles()}
      </style>
      <div class="webcontainer-fallback-notice">
        ⚡ Static Preview Mode Active
      </div>
    `;

    // Insert before closing head tag or at the beginning of body
    if (html.includes('</head>')) {
      return html.replace('</head>', `${fallbackCSS}</head>`);
    } else if (html.includes('<body>')) {
      return html.replace('<body>', `<body>${fallbackCSS}`);
    } else {
      return fallbackCSS + html;
    }
  }

  private getResponsiveStyles(): string {
    return `
      @media (max-width: 768px) {
        .fallback-notice,
        .webcontainer-fallback-notice {
          position: relative;
          top: auto;
          right: auto;
          margin: 10px;
        }
      }
      
      /* Ensure content is accessible */
      * {
        max-width: 100%;
      }
      
      img {
        height: auto;
      }
      
      /* Basic responsive grid */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }
    `;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  incrementFallbackAttempts(): void {
    this.fallbackAttempts++;
  }

  resetFallbackAttempts(): void {
    this.fallbackAttempts = 0;
  }

  getFallbackAttempts(): number {
    return this.fallbackAttempts;
  }

  isMaxAttemptsReached(): boolean {
    return this.fallbackAttempts >= this.maxAttempts;
  }
} 