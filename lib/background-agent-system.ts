import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

interface BackgroundAgentContext {
  userId: string;
  conversationId?: string;
  userMessage: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  scrapedData?: Array<{
    url: string;
    content: any;
    timestamp: Date;
  }>;
}

interface AgentDecision {
  shouldExecute: boolean;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
  parameters?: Record<string, any>;
}

interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  reasoning: string;
  executionTime: number;
}

interface BackgroundAgent {
  name: string;
  description: string;
  decide(context: BackgroundAgentContext): Promise<AgentDecision>;
  execute(context: BackgroundAgentContext, parameters?: Record<string, any>): Promise<AgentResult>;
}

class DesignTeamAgent implements BackgroundAgent {
  name = 'design-team';
  description = 'Provides design consultation and recommendations using AI design characters';

  async decide(context: BackgroundAgentContext): Promise<AgentDecision> {
    const designKeywords = [
      'design', 'ui', 'ux', 'layout', 'color', 'typography', 'branding',
      'visual', 'aesthetic', 'look', 'feel', 'style', 'modern', 'clean',
      'beautiful', 'responsive', 'mobile', 'desktop', 'dashboard', 'landing',
      'homepage', 'interface', 'user experience', 'user interface', 'theme',
      'spacing', 'margin', 'padding', 'component', 'button', 'form', 'card',
      'modal', 'navigation', 'sidebar', 'header', 'footer', 'menu', 'dropdown'
    ];

    const messageContent = context.userMessage.toLowerCase();
    const hasDesignKeywords = designKeywords.some(keyword => 
      messageContent.includes(keyword)
    );

    const isDesignRequest = hasDesignKeywords || 
      messageContent.includes('how should') ||
      messageContent.includes('what would look good') ||
      messageContent.includes('make it look') ||
      messageContent.includes('design advice') ||
      messageContent.includes('design help') ||
      messageContent.includes('improve the') ||
      messageContent.includes('better') ||
      messageContent.includes('prettier') ||
      messageContent.includes('styling') ||
      messageContent.includes('css') ||
      messageContent.includes('tailwind');

    // Higher priority for explicit design requests
    const priority = messageContent.includes('design') || messageContent.includes('ui') || messageContent.includes('ux') 
      ? 'high' : 'medium';

    if (isDesignRequest) {
      return {
        shouldExecute: true,
        priority,
        reasoning: `Design-related request detected: ${designKeywords.filter(k => messageContent.includes(k)).join(', ')}`,
        parameters: {
          designFocus: this.extractDesignFocus(messageContent),
          projectType: this.inferProjectType(messageContent)
        }
      };
    }

    return {
      shouldExecute: false,
      priority: 'low',
      reasoning: 'No design-related keywords or requests detected'
    };
  }

  private extractDesignFocus(message: string): string[] {
    const focuses = [];
    if (message.includes('color') || message.includes('palette')) focuses.push('color');
    if (message.includes('layout') || message.includes('structure')) focuses.push('layout');
    if (message.includes('typography') || message.includes('font')) focuses.push('typography');
    if (message.includes('mobile') || message.includes('responsive')) focuses.push('responsive');
    if (message.includes('brand') || message.includes('logo')) focuses.push('branding');
    return focuses.length > 0 ? focuses : ['general'];
  }

  private inferProjectType(message: string): string {
    if (message.includes('dashboard')) return 'dashboard';
    if (message.includes('landing')) return 'landing-page';
    if (message.includes('mobile') || message.includes('app')) return 'mobile-app';
    if (message.includes('website') || message.includes('web')) return 'web-app';
    if (message.includes('brand') || message.includes('logo')) return 'brand-system';
    return 'web-app';
  }

  async execute(context: BackgroundAgentContext, parameters?: Record<string, any>): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const designPrompt = `You are a collaborative design team consisting of multiple AI design experts with different specializations. Analyze the user's request and provide comprehensive design advice.

User Request: "${context.userMessage}"

Project Type: ${parameters?.projectType || 'web-app'}
Design Focus: ${parameters?.designFocus?.join(', ') || 'general'}

Please provide:
1. Initial design assessment and recommendations
2. Color palette suggestions with hex codes
3. Typography recommendations
4. Layout structure suggestions
5. User experience considerations
6. Mobile responsiveness guidelines
7. Accessibility recommendations

Format your response as practical, actionable design advice that can be directly implemented.`;

      const response = await generateText({
        model: groq('moonshotai/kimi-k2-instruct-0905'),
        prompt: designPrompt,
        temperature: 0.7
      });

      return {
        success: true,
        data: {
          designAdvice: response.text,
          projectType: parameters?.projectType,
          designFocus: parameters?.designFocus,
          recommendations: this.parseRecommendations(response.text)
        },
        reasoning: 'Successfully generated design team consultation',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Failed to generate design consultation',
        executionTime: Date.now() - startTime
      };
    }
  }

  private parseRecommendations(text: string): Record<string, any> {
    const recommendations: Record<string, any> = {};
    
    // Extract color codes
    const colorMatches = text.match(/#[0-9A-Fa-f]{6}/g);
    if (colorMatches) {
      recommendations.colors = colorMatches;
    }

    // Extract key sections
    const sections = text.split(/\d+\./);
    sections.forEach(section => {
      if (section.toLowerCase().includes('color')) {
        recommendations.colorGuidance = section.trim();
      } else if (section.toLowerCase().includes('typography')) {
        recommendations.typographyGuidance = section.trim();
      } else if (section.toLowerCase().includes('layout')) {
        recommendations.layoutGuidance = section.trim();
      }
    });

    return recommendations;
  }
}

class SearchAgent implements BackgroundAgent {
  name = 'search';
  description = 'Automatically searches for relevant information to enhance responses';

  async decide(context: BackgroundAgentContext): Promise<AgentDecision> {
    const searchTriggers = [
      'what is', 'how to', 'best practices', 'examples of', 'latest',
      'current', 'trending', 'popular', 'find', 'search', 'look up',
      'research', 'information about', 'learn about', 'tell me about',
      'show me', 'explain', 'compare', 'vs', 'versus', 'tutorial',
      'guide', 'documentation', 'docs', 'api', 'reference'
    ];

    const messageContent = context.userMessage.toLowerCase();
    const hasSearchTriggers = searchTriggers.some(trigger => 
      messageContent.includes(trigger)
    );

    const isFactualQuery = messageContent.includes('?') && (
      messageContent.includes('when') ||
      messageContent.includes('where') ||
      messageContent.includes('who') ||
      messageContent.includes('what') ||
      messageContent.includes('why') ||
      messageContent.includes('how')
    );

    const needsCurrentInfo = messageContent.includes('latest') ||
      messageContent.includes('current') ||
      messageContent.includes('recent') ||
      messageContent.includes('new') ||
      messageContent.includes('2024') ||
      messageContent.includes('2025') ||
      messageContent.includes('today') ||
      messageContent.includes('now');

    const isLearningQuery = messageContent.includes('learn') ||
      messageContent.includes('tutorial') ||
      messageContent.includes('guide') ||
      messageContent.includes('how to') ||
      messageContent.includes('explain');

    if (hasSearchTriggers || isFactualQuery || needsCurrentInfo || isLearningQuery) {
      const priority = needsCurrentInfo ? 'high' : isLearningQuery ? 'medium' : 'medium';
      
      return {
        shouldExecute: true,
        priority,
        reasoning: `Search query detected: ${searchTriggers.filter(t => messageContent.includes(t)).join(', ')}`,
        parameters: {
          searchType: needsCurrentInfo ? 'current' : isLearningQuery ? 'educational' : 'general',
          query: this.extractSearchQuery(context.userMessage)
        }
      };
    }

    return {
      shouldExecute: false,
      priority: 'low',
      reasoning: 'No search triggers detected in user message'
    };
  }

  private extractSearchQuery(message: string): string {
    // Remove conversational fluff and extract the core search query
    const query = message
      .replace(/please|can you|could you|help me|i want to|i need to/gi, '')
      .replace(/\?/g, '')
      .trim();

    // If the message is short, use it as-is
    if (query.length < 50) {
      return query;
    }

    // For longer messages, try to extract the key terms
    const words = query.split(' ');
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !['with', 'that', 'this', 'they', 'have', 'been', 'will', 'from', 'into'].includes(word.toLowerCase())
    );

    return importantWords.slice(0, 8).join(' ');
  }

  async execute(context: BackgroundAgentContext, parameters?: Record<string, any>): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const searchQuery = parameters?.query || context.userMessage;
      
      // Make search request to Brave API
      const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/brave-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: searchQuery,
          count: 5 
        }),
      });

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();

      if (!searchData.success) {
        throw new Error(searchData.error || 'Search failed');
      }

      // Process and summarize search results
      const results = searchData.results || [];
      const summary = await this.summarizeResults(results, context.userMessage);

      return {
        success: true,
        data: {
          searchQuery,
          results: results.slice(0, 3), // Top 3 results
          summary,
          totalResults: results.length
        },
        reasoning: `Successfully searched for "${searchQuery}" and found ${results.length} results`,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reasoning: 'Failed to perform web search',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async summarizeResults(results: any[], originalQuery: string): Promise<string> {
    if (results.length === 0) return 'No results found.';

    const resultsText = results.slice(0, 3).map(result => 
      `${result.title}: ${result.description}`
    ).join('\n\n');

    try {
      const response = await generateText({
        model: groq('moonshotai/kimi-k2-instruct-0905'),
        prompt: `Based on these search results for the query "${originalQuery}", provide a concise summary of the key information:

${resultsText}

Provide a 2-3 sentence summary that directly answers the user's question or provides the most relevant information.`,
        temperature: 0.3
      });

      return response.text;
    } catch (error) {
      // Fallback to simple concatenation if AI summarization fails
      return results.slice(0, 2).map(result => result.description).join(' ');
    }
  }
}

export class BackgroundAgentSystem {
  private agents: BackgroundAgent[] = [
    new DesignTeamAgent(),
    new SearchAgent()
  ];

  async processMessage(context: BackgroundAgentContext): Promise<{
    agentResults: Record<string, AgentResult>;
    recommendations: string[];
  }> {
    const agentResults: Record<string, AgentResult> = {};
    const recommendations: string[] = [];

    // Get decisions from all agents
    const decisions = await Promise.all(
      this.agents.map(async agent => ({
        agent,
        decision: await agent.decide(context)
      }))
    );

    // Execute agents that decided to act, prioritizing by priority
    const toExecute = decisions
      .filter(({ decision }) => decision.shouldExecute)
      .sort((a, b) => this.getPriorityWeight(b.decision.priority) - this.getPriorityWeight(a.decision.priority));

    for (const { agent, decision } of toExecute) {
      try {
        const result = await agent.execute(context, decision.parameters);
        agentResults[agent.name] = result;

        if (result.success) {
          recommendations.push(this.formatAgentRecommendation(agent, result));
        }
      } catch (error) {
        agentResults[agent.name] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          reasoning: 'Agent execution failed',
          executionTime: 0
        };
      }
    }

    return { agentResults, recommendations };
  }

  private getPriorityWeight(priority: 'low' | 'medium' | 'high'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private formatAgentRecommendation(agent: BackgroundAgent, result: AgentResult): string {
    switch (agent.name) {
      case 'design-team':
        return `🎨 **Design Team Consultation:**\n${result.data?.designAdvice || 'Design recommendations generated'}`;
      
      case 'search':
        const searchData = result.data;
        let recommendation = `🔍 **Web Search Results:**\n${searchData?.summary || 'Search completed'}`;
        
        if (searchData?.results?.length > 0) {
          recommendation += '\n\n**Top Sources:**';
          searchData.results.slice(0, 2).forEach((result: any, index: number) => {
            recommendation += `\n${index + 1}. [${result.title}](${result.url})`;
          });
        }
        
        return recommendation;
        
      default:
        return `🤖 **${agent.name}:** ${result.reasoning}`;
    }
  }

  getAvailableAgents(): Array<{ name: string; description: string }> {
    return this.agents.map(agent => ({
      name: agent.name,
      description: agent.description
    }));
  }
}

// Singleton instance
export const backgroundAgentSystem = new BackgroundAgentSystem();