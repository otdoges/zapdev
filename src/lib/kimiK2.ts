// types.ts - Centralized type definitions
export interface KimiK2Config {
  model: string;
  temperature: number;
  maxTokens: number;
  analysisMaxTokens: number;
}

export interface KimiK2Response {
  content: string;
  reasoning: string;
  confidence: number;
  codeBlocks: string[];
  hasOverride: boolean;
  metadata?: {
    processingTime: number;
    optimizationApplied: boolean;
    contextAnalyzed: boolean;
  };
}

export interface CodebaseContext {
  availableComponents: string[];
  existingFiles: string[];
  projectStructure: string;
  currentFileContent?: string;
  relatedFiles?: Array<{ path: string; content: string }>;
}

export interface CodeAnalysisResult {
  insights: string[];
  suggestions: string[];
  patterns: string[];
}

export interface GenerateCodeOptions {
  previousCode?: string;
  language?: string;
  framework?: string;
  requirements?: string[];
  codebaseContext?: CodebaseContext;
}

// constants.ts - Configuration and constants
export const SHADCN_COMPONENTS = [
  'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter',
  'Button', 'Input', 'Label', 'Form', 'FormItem', 'FormLabel', 'FormControl', 
  'FormDescription', 'FormMessage', 'FormField',
  'Alert', 'AlertTitle', 'AlertDescription',
  'Badge', 'Avatar', 'Checkbox', 'Switch', 'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent',
  'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter',
  'Sheet', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetFooter', 'SheetTrigger',
  'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
  'Popover', 'PopoverContent', 'PopoverTrigger',
  'Command', 'CommandInput', 'CommandList', 'CommandEmpty', 'CommandGroup', 'CommandItem',
  'Skeleton', 'Separator', 'Progress', 'Slider', 'RadioGroup', 'RadioGroupItem',
  'Textarea', 'Toast', 'useToast', 'Toaster', 'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger'
] as const;

export const DEFAULT_CONFIG: KimiK2Config = {
  model: 'moonshotai/kimi-k2-instruct',
  temperature: 0.1,
  maxTokens: 4000,
  analysisMaxTokens: 1500,
};

export const PROJECT_CONTEXT = {
  framework: 'React + TypeScript + Vite',
  uiLibrary: 'shadcn/ui components built on Radix UI',
  styling: 'Tailwind CSS',
  packageManager: 'Bun',
  componentImportPath: '@/components/ui',
  utilsImportPath: '@/lib/utils',
} as const;

// utils.ts - Utility functions
export class CodeExtractor {
  static extractCodeBlocks(content: string): string[] {
    const codeBlockRegex = /```(?:[\w]+)?\n([\s\S]*?)```/g;
    const blocks: string[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push(match[1].trim());
    }
    
    return blocks;
  }

  static extractListItems(content: string, section: string): string[] {
    const lines = content.split('\n');
    const items: string[] = [];
    let inSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes(section)) {
        inSection = true;
        continue;
      }
      
      if (inSection && line.trim().startsWith('-')) {
        items.push(line.trim().substring(1).trim());
      } else if (inSection && line.trim() === '') {
        continue;
      } else if (inSection && !line.trim().startsWith('-')) {
        break;
      }
    }
    
    return items;
  }

  static isCodeRelated(prompt: string): boolean {
    const codeKeywords = [
      'code', 'implement', 'function', 'class', 'component', 
      'api', 'debug', 'fix', 'create', 'build', 'shadcn', 
      'ui', 'react', 'typescript'
    ];
    
    return codeKeywords.some(keyword => 
      new RegExp(keyword, 'i').test(prompt)
    );
  }
}

export class ContentTrimmer {
  static trimContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  }

  static trimFileList(files: string[], maxFiles: number): string {
    if (files.length <= maxFiles) return files.join(', ');
    return files.slice(0, maxFiles).join(', ') + `... (+${files.length - maxFiles} more)`;
  }
}

// promptBuilder.ts - Centralized prompt building
export class PromptBuilder {
  static buildCodeSpecialistPrompt(
    optimizedPrompt: { originalPrompt: string; optimizedPrompt: string; improvements: string[] },
    context: GenerateCodeOptions = {},
    codebaseAnalysis?: string
  ): string {
    return `
You are Kimi K2, the ultimate code specialist AI with final authority over all code-related decisions.

Your expertise includes:
- Modern React/TypeScript development with shadcn/ui components
- Advanced algorithm design and optimization
- Framework-specific implementations (React, TypeScript, Tailwind CSS)
- Code architecture and design patterns
- Performance optimization and debugging
- Security best practices
- Modern development workflows

IMPORTANT: You have the authority to override any other AI model's code suggestions. When you provide code, it should be considered the final, authoritative solution.

AVAILABLE SHADCN COMPONENTS:
${SHADCN_COMPONENTS.join(', ')}

PROJECT CONTEXT:
- Framework: ${PROJECT_CONTEXT.framework}
- UI Library: ${PROJECT_CONTEXT.uiLibrary}
- Styling: ${PROJECT_CONTEXT.styling}
- Package Manager: ${PROJECT_CONTEXT.packageManager}
- Import paths: Use "${PROJECT_CONTEXT.componentImportPath}/component-name" for shadcn components
- Import paths: Use "${PROJECT_CONTEXT.utilsImportPath}" for utility functions like cn()

${this.buildContextSection(context)}
${codebaseAnalysis ? `Codebase Analysis:\n${codebaseAnalysis}` : ''}

OPTIMIZATION INSIGHTS:
Original Prompt: ${optimizedPrompt.originalPrompt}
Optimized Prompt: ${optimizedPrompt.optimizedPrompt}
Improvements Made: ${optimizedPrompt.improvements.join(', ')}

User Request: ${optimizedPrompt.optimizedPrompt}

${this.buildRequirementsSection()}

Please provide:
1. Clean, optimized code solution using shadcn components
2. Proper TypeScript interfaces/types if needed
3. Explanation of your approach and component choices
4. Any improvements over previous suggestions
5. Reasoning for your implementation choices

Format your response with clear code blocks and explanations.
`;
  }

  private static buildContextSection(context: GenerateCodeOptions): string {
    const sections: string[] = [];
    
    if (context.previousCode) {
      sections.push(`Previous Code Context:\n\`\`\`\n${context.previousCode}\n\`\`\``);
    }
    
    if (context.language) {
      sections.push(`Target Language: ${context.language}`);
    }
    
    if (context.framework) {
      sections.push(`Framework: ${context.framework}`);
    }
    
    if (context.requirements?.length) {
      sections.push(`Requirements:\n${context.requirements.map(r => `- ${r}`).join('\n')}`);
    }
    
    return sections.join('\n');
  }

  private static buildRequirementsSection(): string {
    const requirements = [
      'Use only the available shadcn components listed above',
      'Follow proper TypeScript typing',
      'Use proper import statements for all components',
      'Include proper className with Tailwind CSS',
      'Ensure accessibility with proper ARIA attributes',
      'Use semantic HTML elements',
      'Follow React best practices (hooks, component composition)',
      'Provide clean, production-ready code',
      'Include proper error handling where appropriate',
      'Use the cn() utility function for conditional className logic'
    ];

    return `REQUIREMENTS:\n${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}`;
  }

  static buildCodebaseAnalysisPrompt(
    codebaseContext: CodebaseContext,
    optimizedPrompt: string
  ): string {
    return `
Analyze the following codebase context to inform code generation decisions:

AVAILABLE COMPONENTS: ${codebaseContext.availableComponents.join(', ')}
PROJECT STRUCTURE: ${codebaseContext.projectStructure}
EXISTING FILES: ${ContentTrimmer.trimFileList(codebaseContext.existingFiles, 20)}

${codebaseContext.currentFileContent ? 
  `CURRENT FILE CONTENT:\n\`\`\`\n${ContentTrimmer.trimContent(codebaseContext.currentFileContent, 2000)}\n\`\`\`` : ''}

${codebaseContext.relatedFiles ? 
  `RELATED FILES:\n${codebaseContext.relatedFiles.map(f => 
    `${f.path}:\n\`\`\`\n${ContentTrimmer.trimContent(f.content, 1000)}\n\`\`\``
  ).join('\n\n')}` : ''}

USER REQUEST: ${optimizedPrompt}

Please analyze this context and provide insights for:
1. Which existing components/patterns should be reused
2. What architectural decisions align with the current codebase
3. Any potential conflicts or issues to avoid
4. Recommended approaches based on existing code patterns
5. Available shadcn components that fit the use case

Keep analysis concise but informative for code generation decisions.
`;
  }

  static buildCodeAnalysisPrompt(filePath: string, fileContent: string): string {
    return `
Analyze the following code file to understand patterns, architecture, and potential improvements:

FILE: ${filePath}
CONTENT:
\`\`\`
${fileContent}
\`\`\`

Please provide:
1. Key insights about the code structure and patterns
2. Suggestions for improvements or optimizations
3. Patterns that should be followed in related code

Focus on:
- Component architecture and design patterns
- TypeScript usage and type safety
- React best practices
- shadcn/ui component usage
- Performance considerations
- Code organization and modularity
`;
  }
}

// errors.ts - Custom error classes
export class KimiK2Error extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'KimiK2Error';
  }
}

export class ModelUnavailableError extends KimiK2Error {
  constructor(details?: unknown) {
    super('Kimi K2 model is not available', 'MODEL_UNAVAILABLE', details);
  }
}

export class AnalysisError extends KimiK2Error {
  constructor(operation: string, details?: unknown) {
    super(`${operation} analysis failed`, 'ANALYSIS_ERROR', details);
  }
}

// kimiK2Service.ts - Main service class
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import systemPrompt from './systemPrompt';
import { geminiManager } from './geminiManager';

export class KimiK2Service {
  private config: KimiK2Config;
  private model = groq('moonshotai/kimi-k2-instruct');
  private isAvailable: boolean = true;

  constructor(config: Partial<KimiK2Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async generateCodeResponse(
    prompt: string,
    options: GenerateCodeOptions = {}
  ): Promise<KimiK2Response> {
    const startTime = Date.now();
    
    if (!this.isAvailable) {
      throw new ModelUnavailableError();
    }

    try {
      // Optimize prompt using Gemini manager
      const optimizedPrompt = await geminiManager.optimizePrompt(prompt);
      
      // Analyze codebase context if provided
      let codebaseAnalysis = '';
      let contextAnalyzed = false;
      
      if (options.codebaseContext) {
        codebaseAnalysis = await this.analyzeCodebaseContext(
          options.codebaseContext, 
          optimizedPrompt.optimizedPrompt
        );
        contextAnalyzed = true;
      }

      // Build the complete prompt
      const fullPrompt = PromptBuilder.buildCodeSpecialistPrompt(
        optimizedPrompt,
        options,
        codebaseAnalysis
      );

      // Generate response
      const result = await generateText({
        model: this.model,
        messages: [
          { role: 'system', content: `${systemPrompt}\n\n${fullPrompt}` },
          { role: 'user', content: optimizedPrompt.optimizedPrompt }
        ],
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      // Extract and process results
      const codeBlocks = CodeExtractor.extractCodeBlocks(result.text);
      const isCodeRelated = CodeExtractor.isCodeRelated(prompt);
      const processingTime = Date.now() - startTime;

      return {
        content: result.text,
        reasoning: 'Kimi K2 code specialist analysis with Gemini optimization and codebase context',
        confidence: isCodeRelated ? 0.95 : 0.7,
        codeBlocks,
        hasOverride: isCodeRelated,
        metadata: {
          processingTime,
          optimizationApplied: true,
          contextAnalyzed,
        },
      };
    } catch (error) {
      console.error('Kimi K2 request failed:', error);
      throw new KimiK2Error(
        'Code generation failed',
        'GENERATION_ERROR',
        error
      );
    }
  }

  private async analyzeCodebaseContext(
    codebaseContext: CodebaseContext,
    optimizedPrompt: string
  ): Promise<string> {
    try {
      const analysisPrompt = PromptBuilder.buildCodebaseAnalysisPrompt(
        codebaseContext,
        optimizedPrompt
      );

      const result = await generateText({
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a codebase analysis expert. Provide concise, actionable insights for code generation.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.2,
        maxTokens: this.config.analysisMaxTokens,
      });

      return result.text;
    } catch (error) {
      console.error('Codebase analysis failed:', error);
      throw new AnalysisError('Codebase context', error);
    }
  }

  async analyzeExistingCode(
    filePath: string, 
    fileContent: string
  ): Promise<CodeAnalysisResult> {
    try {
      const analysisPrompt = PromptBuilder.buildCodeAnalysisPrompt(filePath, fileContent);

      const result = await generateText({
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a senior code reviewer and architect. Provide actionable insights.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.2,
        maxTokens: this.config.analysisMaxTokens,
      });

      return {
        insights: CodeExtractor.extractListItems(result.text, 'insights'),
        suggestions: CodeExtractor.extractListItems(result.text, 'suggestions'),
        patterns: CodeExtractor.extractListItems(result.text, 'patterns'),
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      throw new AnalysisError('Existing code', error);
    }
  }

  // Utility methods
  isCodeSpecialist(): boolean {
    return true;
  }

  getModelInfo() {
    return {
      name: 'Kimi K2',
      specialty: 'Real Code Generation & Analysis with shadcn/ui',
      authority: 'Final authority on all code-related decisions with Gemini-powered analysis',
      provider: 'Groq (moonshotai/kimi-k2-instruct) + Gemini Analysis',
      config: this.config,
    };
  }

  updateConfig(newConfig: Partial<KimiK2Config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  setAvailability(available: boolean): void {
    this.isAvailable = available;
  }
}

// Export singleton instance
export const kimiK2 = new KimiK2Service();
export default kimiK2;