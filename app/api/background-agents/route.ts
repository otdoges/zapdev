import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { backgroundAgentSystem } from '@/lib/background-agent-system';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      message, 
      conversationHistory = [], 
      scrapedData = [],
      conversationId 
    } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Process with background agents
    const agentContext = {
      userId,
      conversationId,
      userMessage: message,
      conversationHistory: conversationHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      })),
      scrapedData
    };

    const { agentResults, recommendations } = await backgroundAgentSystem.processMessage(agentContext);

    // Calculate if any agents were executed
    const executedAgents = Object.entries(agentResults)
      .filter(([_, result]) => result.success)
      .map(([name, result]) => ({
        name,
        executionTime: result.executionTime,
        reasoning: result.reasoning
      }));

    return NextResponse.json({
      success: true,
      agentResults,
      recommendations,
      executedAgents,
      summary: {
        totalAgentsExecuted: executedAgents.length,
        totalExecutionTime: executedAgents.reduce((sum, agent) => sum + agent.executionTime, 0),
        hasDesignAdvice: 'design-team' in agentResults && agentResults['design-team'].success,
        hasSearchResults: 'search' in agentResults && agentResults['search'].success
      }
    });

  } catch (error) {
    console.error('Background agents error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process with background agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return available agents
    const availableAgents = backgroundAgentSystem.getAvailableAgents();

    return NextResponse.json({
      success: true,
      agents: availableAgents
    });

  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { error: 'Failed to get available agents' },
      { status: 500 }
    );
  }
}