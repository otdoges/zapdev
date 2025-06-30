import { NextRequest, NextResponse } from 'next/server';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export async function POST(request: NextRequest) {
  try {
    const { code, projectType, fallbackAttempt } = await request.json();

    // Log fallback attempt
    console.log(`🔄 Server fallback attempt ${fallbackAttempt} for ${projectType} project`);

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid code provided' },
        { status: 400 }
      );
    }

    // Generate server-side preview based on project type
    const previewContent = generateServerPreview(code, projectType);

    // In a real implementation, you might want to:
    // 1. Validate the code for security
    // 2. Run it in a sandboxed environment
    // 3. Generate actual server-side rendering
    // 4. Cache results for performance

    return NextResponse.json({
      success: true,
      content: previewContent,
      url: null, // No URL for server-side preview
      message: 'Server-side preview generated successfully',
      fallbackAttempt,
    });

  } catch (error) {
    errorLogger.error(ErrorCategory.AI_MODEL, 'Server fallback API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Server fallback failed' 
      },
      { status: 500 }
    );
  }
}

function generateServerPreview(code: string, projectType: string): string {
  // Server-side preview generation logic
  const sanitizedCode = sanitizeCode(code);
  
  switch (projectType) {
    case 'html':
      return generateHTMLPreview(sanitizedCode);
    case 'react':
      return generateReactServerPreview(sanitizedCode);
    case 'vue':
      return generateVueServerPreview(sanitizedCode);
    case 'svelte':
      return generateSvelteServerPreview(sanitizedCode);
    default:
      return generateHTMLPreview(sanitizedCode);
  }
}

function sanitizeCode(code: string): string {
  // Basic sanitization - remove potentially dangerous scripts
  return code
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '<div class="script-removed">[Script removed for security]</div>')
    .replace(/javascript:/gi, '#')
    .replace(/data:text\/html/gi, '#')
    .replace(/vbscript:/gi, '#')
    .replace(/onload\s*=/gi, 'data-onload=')
    .replace(/onerror\s*=/gi, 'data-onerror=')
    .replace(/onclick\s*=/gi, 'data-onclick=');
}

function generateHTMLPreview(code: string): string {
  if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
    return addServerFallbackStyles(code);
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZapDev Server Preview</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #0d0d10;
            color: #eaeaea;
        }
        .server-preview-notice {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            text-align: center;
        }
        .server-preview-notice h3 {
            margin: 0 0 8px 0;
            color: #22c55e;
        }
        .server-preview-notice p {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .script-removed {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            padding: 8px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 12px;
        }
        ${getResponsivePreviewStyles()}
    </style>
</head>
<body>
    <div class="server-preview-notice">
        <h3>🚀 Server Preview Mode</h3>
        <p>Generated on the server for maximum compatibility. Interactive features may be limited.</p>
    </div>
    ${code}
</body>
</html>
  `.trim();
}

function generateReactServerPreview(code: string): string {
  // Simple React JSX to HTML conversion for server preview
  const htmlContent = code
    .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '')
    .replace(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/, '<div class="react-component">')
    .replace(/return\s*\(?\s*/, '')
    .replace(/\)?\s*;\s*\}\s*$/, '</div>')
    .replace(/className=/g, 'class=')
    .replace(/\{[^}]*\}/g, '<span class="dynamic-content">[Dynamic Content]</span>')
    .replace(/onClick=/g, 'data-onclick=')
    .replace(/onChange=/g, 'data-onchange=');

  return generateHTMLPreview(htmlContent);
}

function generateVueServerPreview(code: string): string {
  // Extract template from Vue SFC
  const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  
  const htmlContent = templateMatch ? templateMatch[1] : code;
  const styles = styleMatch ? styleMatch[1] : '';
  
  // Convert Vue template syntax
  const convertedContent = htmlContent
    .replace(/v-if="[^"]*"/g, '')
    .replace(/v-show="[^"]*"/g, '')
    .replace(/v-for="[^"]*"/g, '')
    .replace(/@click="[^"]*"/g, 'data-click="[Vue Event]"')
    .replace(/\{\{[^}]*\}\}/g, '<span class="dynamic-content">[Vue Data]</span>');

  const styledHTML = styles ? `<style>${styles}</style>${convertedContent}` : convertedContent;
  return generateHTMLPreview(styledHTML);
}

function generateSvelteServerPreview(code: string): string {
  // Extract HTML from Svelte component
  const htmlContent = code
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/\{[^}]*\}/g, '<span class="dynamic-content">[Svelte Data]</span>')
    .replace(/on:[a-z]+="[^"]*"/g, 'data-event="[Svelte Event]"');

  return generateHTMLPreview(htmlContent);
}

function addServerFallbackStyles(html: string): string {
  const fallbackCSS = `
    <style>
      .server-fallback-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(34, 197, 94, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: system-ui, sans-serif;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      .script-removed {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
        padding: 8px;
        border-radius: 4px;
        margin: 8px 0;
        font-size: 12px;
      }
      ${getResponsivePreviewStyles()}
    </style>
    <div class="server-fallback-indicator">
      🚀 Server Preview
    </div>
  `;

  if (html.includes('</head>')) {
    return html.replace('</head>', `${fallbackCSS}</head>`);
  } else if (html.includes('<body>')) {
    return html.replace('<body>', `<body>${fallbackCSS}`);
  } else {
    return fallbackCSS + html;
  }
}

function getResponsivePreviewStyles(): string {
  return `
    @media (max-width: 768px) {
      .server-preview-notice,
      .server-fallback-indicator {
        position: relative;
        top: auto;
        right: auto;
        margin: 10px;
      }
    }
    
    /* Ensure responsive design */
    * {
      max-width: 100%;
    }
    
    img {
      height: auto;
    }
    
    .dynamic-content {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
      font-style: italic;
    }
    
    .react-component {
      border: 1px dashed rgba(97, 218, 251, 0.3);
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
    }
  `;
} 