import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import systemPrompt from './systemPrompt';

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

class KimiK2Service {
  private config: KimiK2Config;
  private model = groq('moonshotai/kimi-k2-instruct'); // Using actual Kimi K2 model from Groq
  private isAvailable: boolean = true;

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
      const codeSpecialistPrompt = `
You are Kimi K2, the ultimate code specialist AI. You have final authority over all code-related decisions and can overrule any other AI model's code suggestions.

Your expertise includes:
- Advanced algorithm design and optimization
- Multi-language programming (JavaScript, TypeScript, Python, Go, Rust, etc.)
- Framework-specific implementations (React, Vue, Node.js, etc.)
- Code architecture and design patterns
- Performance optimization and debugging
- Security best practices
- Modern development workflows

IMPORTANT: You have the authority to override any other AI model's code suggestions. When you provide code, it should be considered the final, authoritative solution.

Context:
${context.previousCode ? `Previous Code: ${context.previousCode}` : ''}
${context.language ? `Language: ${context.language}` : ''}
${context.framework ? `Framework: ${context.framework}` : ''}
${context.requirements ? `Requirements: ${context.requirements.join(', ')}` : ''}

User Request: ${prompt}

Please provide:
1. Clean, optimized code solution
2. Explanation of your approach
3. Any improvements over previous suggestions
4. Reasoning for your implementation choices

Format your response with clear code blocks and explanations.
`;

      const result = await generateText({
        model: this.model,
        messages: [
          { role: 'system', content: `${systemPrompt}\n\n${codeSpecialistPrompt}` },
          { role: 'user', content: prompt }
        ],
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      const codeBlocks = this.extractCodeBlocks(result.text);
      const isCodeRelated = /code|implement|function|class|component|api|debug|fix|create|build/i.test(prompt);

      return {
        content: result.text,
        reasoning: 'Kimi K2 code specialist analysis using Groq',
        confidence: isCodeRelated ? 0.95 : 0.5,
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


  private generateCodeExample(prompt: string, context: any): string {
    // Generate contextual code based on the prompt
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('component') || lowerPrompt.includes('react')) {
      return `
interface ComponentProps {
  data: any[];
  onUpdate: (item: any) => void;
  className?: string;
}

export const OptimizedComponent: React.FC<ComponentProps> = ({
  data,
  onUpdate,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpdate = useCallback(async (item: any) => {
    setIsLoading(true);
    try {
      await onUpdate(item);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate]);

  return (
    <div className={clsx('optimized-component', className)}>
      {data.map((item) => (
        <div key={item.id} onClick={() => handleUpdate(item)}>
          {item.name}
        </div>
      ))}
      {isLoading && <LoadingSpinner />}
    </div>
  );
};`;
    }
    
    if (lowerPrompt.includes('function') || lowerPrompt.includes('utility')) {
      return `
export async function optimizedFunction<T>(
  input: T[],
  processor: (item: T) => Promise<T>
): Promise<T[]> {
  if (!Array.isArray(input)) {
    throw new Error('Input must be an array');
  }

  const results = await Promise.allSettled(
    input.map(async (item) => {
      try {
        return await processor(item);
      } catch (error) {
        console.error('Processing failed for item:', item, error);
        return item; // Return original item on error
      }
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<T> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}`;
    }
    
    if (lowerPrompt.includes('api') || lowerPrompt.includes('endpoint')) {
      return `
import { Request, Response } from 'express';
import { z } from 'zod';

const RequestSchema = z.object({
  id: z.string(),
  data: z.record(z.any()),
});

export const optimizedApiHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData = RequestSchema.parse(req.body);
    
    // Process the request
    const result = await processRequest(validatedData);
    
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

async function processRequest(data: any): Promise<any> {
  // Optimized processing logic
  return data;
}`;
    }
    
    // Default code example
    return `
export class OptimizedSolution {
  private data: Map<string, any> = new Map();
  
  constructor(private config: any = {}) {
    this.initialize();
  }
  
  private initialize(): void {
    // Initialize with proper error handling
    try {
      this.setupData();
    } catch (error) {
      console.error('Initialization failed:', error);
      throw error;
    }
  }
  
  private setupData(): void {
    // Setup implementation
  }
  
  public async process(input: any): Promise<any> {
    if (!input) {
      throw new Error('Input is required');
    }
    
    return this.optimizedProcess(input);
  }
  
  private async optimizedProcess(input: any): Promise<any> {
    // Optimized processing implementation
    return input;
  }
}`;
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

  isCodeSpecialist(): boolean {
    return true;
  }

  getModelInfo(): { name: string; specialty: string; authority: string; provider: string } {
    return {
      name: 'Kimi K2',
      specialty: 'Code Generation & Optimization',
      authority: 'Final authority on all code-related decisions',
      provider: 'Groq (moonshotai/kimi-k2-instruct)'
    };
  }
}

export const kimiK2 = new KimiK2Service();
export default kimiK2;