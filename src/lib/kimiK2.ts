import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import systemPrompt from './systemPrompt';
import { geminiManager } from './geminiManager';

// Kimi K2 model interface - This model specializes in code generation and has final authority on code decisions
export interface KimiK2Config {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface KimiK2Response {
  content: string;
  reasoning: string;
  confidence: number;
  codeBlocks: string[];
  hasOverride: boolean;
}

export interface CodebaseContext {
  availableComponents: string[];
  existingFiles: string[];
  projectStructure: string;
  currentFileContent?: string;
  relatedFiles?: { path: string; content: string }[];
}

class KimiK2Service {
  private config: KimiK2Config;
  private model = groq('moonshotai/kimi-k2-instruct'); // Using actual Kimi K2 model from Groq
  private isAvailable: boolean = true;

  // Available shadcn components for code generation
  private shadcnComponents = [
    'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter',
    'Button', 'Input', 'Label', 'Form', 'FormItem', 'FormLabel', 'FormControl', 'FormDescription', 'FormMessage', 'FormField',
    'Alert', 'AlertTitle', 'AlertDescription',
    'Badge', 'Avatar', 'Checkbox', 'Switch', 'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent',
    'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter',
    'Sheet', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetFooter', 'SheetTrigger',
    'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
    'Popover', 'PopoverContent', 'PopoverTrigger',
    'Command', 'CommandInput', 'CommandList', 'CommandEmpty', 'CommandGroup', 'CommandItem',
    'Skeleton', 'Separator', 'Progress', 'Slider', 'RadioGroup', 'RadioGroupItem',
    'Textarea', 'Toast', 'useToast', 'Toaster', 'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger'
  ];

  constructor() {
    this.config = {
      model: 'moonshotai/kimi-k2-instruct',
      temperature: 0.1, // Lower temperature for more consistent code generation
      maxTokens: 4000,
    };
  }

  async generateCodeResponse(
    prompt: string,
    context: {
      previousCode?: string;
      language?: string;
      framework?: string;
      requirements?: string[];
      codebaseContext?: CodebaseContext;
    } = {}
  ): Promise<KimiK2Response> {
    if (!this.isAvailable) {
      return {
        content: '',
        reasoning: 'Kimi K2 model is not available',
        confidence: 0,
        codeBlocks: [],
        hasOverride: false,
      };
    }

    try {
      // First, optimize the prompt using Gemini manager
      const optimizedPrompt = await geminiManager.optimizePrompt(prompt);
      
      // Analyze the codebase context if provided
      const codebaseAnalysis = context.codebaseContext ? 
        await this.analyzeCodebaseContext(context.codebaseContext, optimizedPrompt.optimizedPrompt) : '';

      const codeSpecialistPrompt = `
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
${this.shadcnComponents.join(', ')}

PROJECT CONTEXT:
- Framework: React + TypeScript + Vite
- UI Library: shadcn/ui components built on Radix UI
- Styling: Tailwind CSS
- Package Manager: Bun (use for all package management)
- Import paths: Use "@/components/ui/component-name" for shadcn components
- Import paths: Use "@/lib/utils" for utility functions like cn()

${context.previousCode ? `Previous Code Context:\n\`\`\`\n${context.previousCode}\n\`\`\`` : ''}
${context.language ? `Target Language: ${context.language}` : ''}
${context.framework ? `Framework: ${context.framework}` : ''}
${context.requirements ? `Requirements:\n${context.requirements.map(r => `- ${r}`).join('\n')}` : ''}

${codebaseAnalysis ? `Codebase Analysis:\n${codebaseAnalysis}` : ''}

OPTIMIZATION INSIGHTS:
Original Prompt: ${optimizedPrompt.originalPrompt}
Optimized Prompt: ${optimizedPrompt.optimizedPrompt}
Improvements Made: ${optimizedPrompt.improvements.join(', ')}

User Request: ${optimizedPrompt.optimizedPrompt}

REQUIREMENTS:
1. Use only the available shadcn components listed above
2. Follow proper TypeScript typing
3. Use proper import statements for all components
4. Include proper className with Tailwind CSS
5. Ensure accessibility with proper ARIA attributes
6. Use semantic HTML elements
7. Follow React best practices (hooks, component composition)
8. Provide clean, production-ready code
9. Include proper error handling where appropriate
10. Use the cn() utility function for conditional className logic

Please provide:
1. Clean, optimized code solution using shadcn components
2. Proper TypeScript interfaces/types if needed
3. Explanation of your approach and component choices
4. Any improvements over previous suggestions
5. Reasoning for your implementation choices

Format your response with clear code blocks and explanations.
`;

      const result = await generateText({
        model: this.model,
        messages: [
          { role: 'system', content: `${systemPrompt}\n\n${codeSpecialistPrompt}` },
          { role: 'user', content: optimizedPrompt.optimizedPrompt }
        ],
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      const codeBlocks = this.extractCodeBlocks(result.text);
      const isCodeRelated = /code|implement|function|class|component|api|debug|fix|create|build|shadcn|ui|react|typescript/i.test(prompt);

      return {
        content: result.text,
        reasoning: `Kimi K2 code specialist analysis using real Gemini optimization and codebase context analysis`,
        confidence: isCodeRelated ? 0.95 : 0.7,
        codeBlocks,
        hasOverride: isCodeRelated,
      };
    } catch (error) {
      console.error('Kimi K2 request failed:', error);
      return {
        content: '',
        reasoning: 'Kimi K2 service temporarily unavailable',
        confidence: 0,
        codeBlocks: [],
        hasOverride: false,
      };
    }
  }

  private async analyzeCodebaseContext(
    codebaseContext: CodebaseContext, 
    optimizedPrompt: string
  ): Promise<string> {
    try {
      const analysisPrompt = `
Analyze the following codebase context to inform code generation decisions:

AVAILABLE COMPONENTS: ${codebaseContext.availableComponents.join(', ')}
PROJECT STRUCTURE: ${codebaseContext.projectStructure}
EXISTING FILES: ${codebaseContext.existingFiles.slice(0, 20).join(', ')}${codebaseContext.existingFiles.length > 20 ? '...' : ''}

${codebaseContext.currentFileContent ? `CURRENT FILE CONTENT:\n\`\`\`\n${codebaseContext.currentFileContent.slice(0, 2000)}${codebaseContext.currentFileContent.length > 2000 ? '...' : ''}\n\`\`\`` : ''}

${codebaseContext.relatedFiles ? `RELATED FILES:\n${codebaseContext.relatedFiles.map(f => `${f.path}:\n\`\`\`\n${f.content.slice(0, 1000)}${f.content.length > 1000 ? '...' : ''}\n\`\`\``).join('\n\n')}` : ''}

USER REQUEST: ${optimizedPrompt}

Please analyze this context and provide insights for:
1. Which existing components/patterns should be reused
2. What architectural decisions align with the current codebase
3. Any potential conflicts or issues to avoid
4. Recommended approaches based on existing code patterns
5. Available shadcn components that fit the use case

Keep analysis concise but informative for code generation decisions.
`;

      const result = await generateText({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a codebase analysis expert. Provide concise, actionable insights for code generation.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.2,
        maxTokens: 1000,
      });

      return result.text;
    } catch (error) {
      console.error('Codebase analysis failed:', error);
      return 'Codebase analysis temporarily unavailable - proceeding with standard code generation.';
    }
  }

  private extractCodeBlocks(content: string): string[] {
    const codeBlockRegex = /```(?:[\w]+)?\n([\s\S]*?)```/g;
    const blocks: string[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push(match[1].trim());
    }
    
    return blocks;
  }

  async analyzeExistingCode(filePath: string, fileContent: string): Promise<{
    insights: string[];
    suggestions: string[];
    patterns: string[];
  }> {
    try {
      const analysisPrompt = `
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

      const result = await generateText({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a senior code reviewer and architect. Provide actionable insights.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.2,
        maxTokens: 1500,
      });

      // Parse the response to extract structured data
      const insights = this.extractListItems(result.text, 'insights');
      const suggestions = this.extractListItems(result.text, 'suggestions');
      const patterns = this.extractListItems(result.text, 'patterns');

      return { insights, suggestions, patterns };
    } catch (error) {
      console.error('Code analysis failed:', error);
      return {
        insights: ['Code analysis temporarily unavailable'],
        suggestions: ['Manual review recommended'],
        patterns: ['Follow existing codebase patterns']
      };
    }
  }

  private extractListItems(content: string, section: string): string[] {
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

  isCodeSpecialist(): boolean {
    return true;
  }

  getModelInfo(): { name: string; specialty: string; authority: string; provider: string } {
    return {
      name: 'Kimi K2',
      specialty: 'Real Code Generation & Analysis with shadcn/ui',
      authority: 'Final authority on all code-related decisions with Gemini-powered analysis',
      provider: 'Groq (moonshotai/kimi-k2-instruct) + Gemini Analysis'
    };
  }
}

export const kimiK2 = new KimiK2Service();
export default kimiK2;