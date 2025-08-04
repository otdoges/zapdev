/**
 * Simple HTML file generation utility
 * Replaces complex e2b and webcontainer setup with static HTML generation
 */

export interface HTMLGenerationOptions {
  title?: string;
  description?: string;
  styles?: string;
  scripts?: string;
  bodyContent: string;
  includeTailwind?: boolean;
  includeBootstrap?: boolean;
}

export class HTMLGenerator {
  private template: string;

  constructor() {
    this.template = this.createBaseTemplate();
  }

  private createBaseTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <meta name="description" content="{{DESCRIPTION}}">
    {{CSS_FRAMEWORKS}}
    <style>
        {{CUSTOM_STYLES}}
    </style>
</head>
<body>
    {{BODY_CONTENT}}
    {{SCRIPTS}}
</body>
</html>`;
  }

  generateHTML(options: HTMLGenerationOptions): string {
    let html = this.template;

    // Replace placeholders
    html = html.replace('{{TITLE}}', options.title || 'Generated HTML');
    html = html.replace('{{DESCRIPTION}}', options.description || 'Generated with ZapDev HTML Generator');
    html = html.replace('{{BODY_CONTENT}}', options.bodyContent);
    html = html.replace('{{CUSTOM_STYLES}}', options.styles || '');
    html = html.replace('{{SCRIPTS}}', options.scripts || '');

    // Add CSS frameworks
    let frameworks = '';
    if (options.includeTailwind) {
      frameworks += '    <script src="https://cdn.tailwindcss.com"></script>\n';
    }
    if (options.includeBootstrap) {
      frameworks += '    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">\n';
      frameworks += '    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>\n';
    }
    html = html.replace('{{CSS_FRAMEWORKS}}', frameworks);

    return html;
  }

  generateFromPrompt(prompt: string): HTMLGenerationOptions {
    // Simple prompt parsing - in a real implementation this would use AI
    const options: HTMLGenerationOptions = {
      title: 'Generated Page',
      bodyContent: `<div class="container mx-auto p-8">
        <h1 class="text-3xl font-bold mb-4">Generated Content</h1>
        <p class="text-gray-600 mb-4">Based on prompt: "${prompt}"</p>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p>This is a simple HTML page generated from your prompt. In a full implementation, AI would analyze your prompt and generate appropriate HTML/CSS/JS.</p>
        </div>
      </div>`,
      includeTailwind: true,
      styles: `
        body { 
          font-family: system-ui, -apple-system, sans-serif; 
          background-color: #f8fafc;
        }
        .container { 
          max-width: 1200px; 
        }
      `
    };

    return options;
  }

  saveHTML(html: string, filename: string = 'generated.html'): void {
    // In a browser environment, trigger download
    if (typeof window !== 'undefined') {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
}

// Factory function for easy use
export function createHTMLGenerator(): HTMLGenerator {
  return new HTMLGenerator();
}

// Utility functions
export function generateSimpleHTML(content: string, title?: string): string {
  const generator = new HTMLGenerator();
  return generator.generateHTML({
    title: title || 'Simple Page',
    bodyContent: content,
    includeTailwind: true,
  });
}

export function generateLandingPage(
  headline: string, 
  subtitle: string, 
  features: string[]
): string {
  const generator = new HTMLGenerator();
  
  const bodyContent = `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="container mx-auto px-4 py-16">
        <div class="text-center mb-16">
          <h1 class="text-5xl font-bold text-gray-900 mb-4">${headline}</h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">${subtitle}</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8 mb-16">
          ${features.map(feature => `
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-xl font-semibold mb-3">${feature}</h3>
              <p class="text-gray-600">Feature description would go here.</p>
            </div>
          `).join('')}
        </div>
        
        <div class="text-center">
          <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
            Get Started
          </button>
        </div>
      </div>
    </div>
  `;

  return generator.generateHTML({
    title: headline,
    bodyContent,
    includeTailwind: true,
  });
}