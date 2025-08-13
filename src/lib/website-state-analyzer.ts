import { braveSearchService, type WebsiteAnalysis } from './search-service';
import { SuggestionContext } from './suggestion-types';
import * as Sentry from '@sentry/react';

const { logger } = Sentry;

export interface EnhancedWebsiteAnalysis extends WebsiteAnalysis {
  framework?: string;
  buildTool?: string;
  styling?: {
    framework?: 'tailwind' | 'bootstrap' | 'material-ui' | 'custom';
    preprocessor?: 'sass' | 'less' | 'stylus' | 'css';
    hasCustomCSS: boolean;
  };
  accessibility?: {
    hasAriaLabels: boolean;
    hasSemanticHTML: boolean;
    colorContrastIssues: boolean;
  };
  performance?: {
    hasOptimizations: boolean;
    bundleSize?: 'small' | 'medium' | 'large';
    loadingSpeed?: 'fast' | 'medium' | 'slow';
  };
  modernization?: {
    frameworkVersion?: string;
    needsUpdate: boolean;
    hasModernFeatures: boolean;
  };
  patterns?: {
    designSystem: boolean;
    componentLibrary?: string;
    stateManagement?: string;
  };
}

export interface CodeAnalysis {
  language: string;
  framework?: string;
  patterns: string[];
  issues: CodeIssue[];
  suggestions: string[];
}

export interface CodeIssue {
  type: 'warning' | 'error' | 'info';
  message: string;
  line?: number;
  severity: 'low' | 'medium' | 'high';
}

class WebsiteStateAnalyzer {
  async analyzeWebsite(url: string): Promise<EnhancedWebsiteAnalysis> {
    try {
      logger.info('Starting enhanced website analysis', { url });
      
      // Get basic analysis from existing service
      const basicAnalysis = await braveSearchService.analyzeWebsite(url);
      
      // Enhance with additional analysis
      const enhanced = await this.enhanceAnalysis(basicAnalysis);
      
      logger.info('Enhanced website analysis completed', { 
        url, 
        framework: enhanced.framework,
        styling: enhanced.styling?.framework 
      });
      
      return enhanced;
    } catch (error) {
      logger.error('Enhanced website analysis failed', { 
        error: error instanceof Error ? error.message : String(error),
        url 
      });
      throw error;
    }
  }

  private async enhanceAnalysis(basic: WebsiteAnalysis): Promise<EnhancedWebsiteAnalysis> {
    const enhanced: EnhancedWebsiteAnalysis = {
      ...basic,
      framework: this.detectFramework(basic),
      buildTool: this.detectBuildTool(basic),
      styling: this.analyzeStyling(basic),
      accessibility: this.analyzeAccessibility(basic),
      performance: this.analyzePerformance(basic),
      modernization: this.analyzeModernization(basic),
      patterns: this.analyzePatterns(basic),
    };

    return enhanced;
  }

  private detectFramework(analysis: WebsiteAnalysis): string | undefined {
    const content = analysis.content?.toLowerCase() || '';
    const technologies = analysis.technologies || [];
    
    // Check technologies array first
    for (const tech of technologies) {
      const techLower = tech.toLowerCase();
      if (techLower.includes('react')) return 'React';
      if (techLower.includes('vue')) return 'Vue.js';
      if (techLower.includes('angular')) return 'Angular';
      if (techLower.includes('svelte')) return 'Svelte';
      if (techLower.includes('next')) return 'Next.js';
      if (techLower.includes('nuxt')) return 'Nuxt.js';
      if (techLower.includes('gatsby')) return 'Gatsby';
    }

    // Check content for framework indicators
    if (content.includes('__next_data__') || content.includes('_next/')) return 'Next.js';
    if (content.includes('__nuxt__')) return 'Nuxt.js';
    if (content.includes('react') && content.includes('jsx')) return 'React';
    if (content.includes('vue')) return 'Vue.js';
    if (content.includes('ng-') || content.includes('angular')) return 'Angular';
    
    return undefined;
  }

  private detectBuildTool(analysis: WebsiteAnalysis): string | undefined {
    const content = analysis.content?.toLowerCase() || '';
    
    if (content.includes('webpack')) return 'Webpack';
    if (content.includes('vite')) return 'Vite';
    if (content.includes('parcel')) return 'Parcel';
    if (content.includes('rollup')) return 'Rollup';
    if (content.includes('esbuild')) return 'ESBuild';
    
    return undefined;
  }

  private analyzeStyling(analysis: WebsiteAnalysis): EnhancedWebsiteAnalysis['styling'] {
    const content = analysis.content?.toLowerCase() || '';
    const technologies = analysis.technologies || [];
    
    let framework: 'tailwind' | 'bootstrap' | 'material-ui' | 'custom' | undefined;
    let preprocessor: 'sass' | 'less' | 'stylus' | 'css' | undefined = 'css';
    
    // Detect CSS framework
    if (technologies.some(t => t.toLowerCase().includes('tailwind')) || content.includes('tailwind')) {
      framework = 'tailwind';
    } else if (technologies.some(t => t.toLowerCase().includes('bootstrap')) || content.includes('bootstrap')) {
      framework = 'bootstrap';
    } else if (content.includes('material-ui') || content.includes('mui')) {
      framework = 'material-ui';
    } else {
      framework = 'custom';
    }
    
    // Detect preprocessor
    if (content.includes('sass') || content.includes('scss')) preprocessor = 'sass';
    else if (content.includes('less')) preprocessor = 'less';
    else if (content.includes('stylus')) preprocessor = 'stylus';
    
    return {
      framework,
      preprocessor,
      hasCustomCSS: framework === 'custom' || content.includes('<style>') || content.includes('.css'),
    };
  }

  private analyzeAccessibility(analysis: WebsiteAnalysis): EnhancedWebsiteAnalysis['accessibility'] {
    const content = analysis.content || '';
    
    return {
      hasAriaLabels: content.includes('aria-') || content.includes('role='),
      hasSemanticHTML: /(<header|<nav|<main|<section|<article|<aside|<footer)/i.test(content),
      colorContrastIssues: this.detectColorContrastIssues(analysis.colorScheme || []),
    };
  }

  private detectColorContrastIssues(colors: string[]): boolean {
    // Simple heuristic: if we have very similar colors, there might be contrast issues
    if (colors.length < 2) return false;
    
    // Convert hex to RGB and check for low contrast pairs
    const rgbColors = colors.map(color => this.hexToRgb(color)).filter(Boolean);
    
    for (let i = 0; i < rgbColors.length; i++) {
      for (let j = i + 1; j < rgbColors.length; j++) {
        const contrast = this.calculateContrast(rgbColors[i]!, rgbColors[j]!);
        if (contrast < 3) return true; // Low contrast detected
      }
    }
    
    return false;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private calculateContrast(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  private getLuminance(color: { r: number; g: number; b: number }): number {
    const rs = color.r / 255;
    const gs = color.g / 255;
    const bs = color.b / 255;
    
    const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private analyzePerformance(analysis: WebsiteAnalysis): EnhancedWebsiteAnalysis['performance'] {
    const content = analysis.content || '';
    const technologies = analysis.technologies || [];
    
    // Basic performance indicators
    const hasOptimizations = 
      content.includes('lazy') || 
      content.includes('defer') || 
      content.includes('async') ||
      technologies.some(t => t.toLowerCase().includes('cdn'));
    
    // Estimate bundle size based on content length (rough heuristic)
    const contentSize = content.length;
    let bundleSize: 'small' | 'medium' | 'large';
    if (contentSize < 50000) bundleSize = 'small';
    else if (contentSize < 200000) bundleSize = 'medium';
    else bundleSize = 'large';
    
    return {
      hasOptimizations,
      bundleSize,
      loadingSpeed: bundleSize === 'small' ? 'fast' : bundleSize === 'medium' ? 'medium' : 'slow',
    };
  }

  private analyzeModernization(analysis: WebsiteAnalysis): EnhancedWebsiteAnalysis['modernization'] {
    const content = analysis.content || '';
    const technologies = analysis.technologies || [];
    
    // Check for modern features
    const hasModernFeatures = 
      content.includes('es6') || 
      content.includes('async/await') ||
      content.includes('const ') ||
      content.includes('let ') ||
      content.includes('=>') ||
      technologies.some(t => t.toLowerCase().includes('typescript'));
    
    // Detect potential outdated frameworks
    const needsUpdate = 
      content.includes('jquery') && !technologies.some(t => t.toLowerCase().includes('react')) ||
      content.includes('backbone') ||
      content.includes('knockout');
    
    return {
      needsUpdate,
      hasModernFeatures,
    };
  }

  private analyzePatterns(analysis: WebsiteAnalysis): EnhancedWebsiteAnalysis['patterns'] {
    const content = analysis.content || '';
    const components = analysis.components || [];
    
    // Detect design system usage
    const designSystem = 
      components.length > 5 || // Many reusable components
      content.includes('design-system') ||
      content.includes('component-library');
    
    // Detect component library
    let componentLibrary: string | undefined;
    if (content.includes('material-ui') || content.includes('mui')) componentLibrary = 'Material-UI';
    else if (content.includes('ant-design') || content.includes('antd')) componentLibrary = 'Ant Design';
    else if (content.includes('chakra')) componentLibrary = 'Chakra UI';
    else if (content.includes('mantine')) componentLibrary = 'Mantine';
    
    // Detect state management
    let stateManagement: string | undefined;
    if (content.includes('redux')) stateManagement = 'Redux';
    else if (content.includes('zustand')) stateManagement = 'Zustand';
    else if (content.includes('recoil')) stateManagement = 'Recoil';
    else if (content.includes('context')) stateManagement = 'React Context';
    
    return {
      designSystem,
      componentLibrary,
      stateManagement,
    };
  }

  analyzeCode(code: string, language: string): CodeAnalysis {
    const patterns: string[] = [];
    const issues: CodeIssue[] = [];
    const suggestions: string[] = [];
    
    // Detect patterns
    if (code.includes('useState')) patterns.push('React Hooks');
    if (code.includes('useEffect')) patterns.push('Side Effects');
    if (code.includes('async') && code.includes('await')) patterns.push('Async/Await');
    if (code.includes('=>')) patterns.push('Arrow Functions');
    if (code.includes('const ') || code.includes('let ')) patterns.push('Modern JS');
    
    // Detect issues
    if (code.includes('var ')) {
      issues.push({
        type: 'warning',
        message: 'Using var instead of const/let',
        severity: 'medium',
      });
      suggestions.push('Replace var with const or let for better scoping');
    }
    
    if (code.includes('document.getElementById') && !code.includes('useRef')) {
      issues.push({
        type: 'info',
        message: 'Direct DOM manipulation detected',
        severity: 'low',
      });
      suggestions.push('Consider using React refs instead of direct DOM manipulation');
    }
    
    if (code.includes('==') && !code.includes('===')) {
      issues.push({
        type: 'warning',
        message: 'Using loose equality (==) instead of strict (===)',
        severity: 'medium',
      });
      suggestions.push('Use strict equality (===) for safer comparisons');
    }
    
    // Detect framework
    let framework: string | undefined;
    if (patterns.includes('React Hooks') || code.includes('jsx') || code.includes('React')) {
      framework = 'React';
    } else if (code.includes('vue') || code.includes('@vue')) {
      framework = 'Vue.js';
    } else if (code.includes('angular') || code.includes('@angular')) {
      framework = 'Angular';
    }
    
    return {
      language,
      framework,
      patterns,
      issues,
      suggestions,
    };
  }

  buildSuggestionContext(
    websiteAnalysis?: EnhancedWebsiteAnalysis,
    chatHistory?: string[],
    codeContext?: { code: string; language: string },
    userPreferences?: {
      allowColorChanges?: boolean;
      preferredFramework?: string;
      developmentStage?: 'prototype' | 'development' | 'production';
    }
  ): SuggestionContext {
    const context: SuggestionContext = {
      websiteAnalysis: websiteAnalysis ? {
        title: websiteAnalysis.title,
        technologies: websiteAnalysis.technologies,
        layout: websiteAnalysis.layout,
        colorScheme: websiteAnalysis.colorScheme,
        components: websiteAnalysis.components,
      } : undefined,
      chatHistory: chatHistory ? {
        recentMessages: chatHistory,
        currentIntent: this.extractIntent(chatHistory),
      } : undefined,
      userPreferences: {
        allowColorChanges: userPreferences?.allowColorChanges ?? false,
        preferredFramework: userPreferences?.preferredFramework,
        developmentStage: userPreferences?.developmentStage ?? 'development',
      },
    };

    if (codeContext) {
      const analysis = this.analyzeCode(codeContext.code, codeContext.language);
      context.codeContext = {
        language: codeContext.language,
        framework: analysis.framework,
        recentCode: codeContext.code,
      };
    }

    return context;
  }

  private extractIntent(messages: string[]): string | undefined {
    const lastMessage = messages[messages.length - 1]?.toLowerCase();
    if (!lastMessage) return undefined;
    
    if (lastMessage.includes('build') || lastMessage.includes('create')) return 'build';
    if (lastMessage.includes('fix') || lastMessage.includes('error')) return 'fix';
    if (lastMessage.includes('improve') || lastMessage.includes('optimize')) return 'improve';
    if (lastMessage.includes('style') || lastMessage.includes('design')) return 'style';
    if (lastMessage.includes('responsive') || lastMessage.includes('mobile')) return 'responsive';
    
    return undefined;
  }
}

export const websiteStateAnalyzer = new WebsiteStateAnalyzer();