import { NextRequest, NextResponse } from 'next/server';
import { MultiAgentCoordinator } from '@/lib/multi-agent-coordinator';

const coordinator = MultiAgentCoordinator.getInstance();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Block browser requests - only allow server-side calls
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');
    
    if (userAgent && (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) && referer) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = coordinator.getCoordinationStats();
        return NextResponse.json({ success: true, stats });

      case 'collaborations':
        const collaborations = coordinator.getActiveCollaborations();
        return NextResponse.json({ success: true, collaborations });

      case 'communications':
        const limit = parseInt(searchParams.get('limit') || '20');
        const communications = coordinator.getRecentCommunications(limit);
        return NextResponse.json({ success: true, communications });

      case 'conflicts':
        const status = searchParams.get('status') as any;
        const conflicts = coordinator.getConflicts(status);
        return NextResponse.json({ success: true, conflicts });

      case 'insights':
        const validated = searchParams.get('validated') === 'true';
        const insights = coordinator.getLearningInsights(validated);
        return NextResponse.json({ success: true, insights });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Multi-agent coordination API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Coordination operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Block browser requests - only allow server-side calls
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');
    
    if (userAgent && (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) && referer) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create-collaboration':
        if (!data.name || !data.taskIds) {
          return NextResponse.json(
            { success: false, error: 'Name and task IDs are required' },
            { status: 400 }
          );
        }
        
        const collaborationId = await coordinator.createCollaboration(
          data.name,
          data.description || '',
          data.taskIds,
          data.coordinationType || 'parallel'
        );
        
        return NextResponse.json({ success: true, collaborationId });

      case 'send-message':
        if (!data.fromAgentId || !data.toAgentId || !data.messageType) {
          return NextResponse.json(
            { success: false, error: 'From agent, to agent, and message type are required' },
            { status: 400 }
          );
        }
        
        const communicationId = await coordinator.sendAgentMessage(
          data.fromAgentId,
          data.toAgentId,
          data.messageType,
          data.content,
          data.priority || 'medium',
          data.requiresResponse || false
        );
        
        return NextResponse.json({ success: true, communicationId });

      case 'add-knowledge':
        if (!data.agentId || !data.domain) {
          return NextResponse.json(
            { success: false, error: 'Agent ID and domain are required' },
            { status: 400 }
          );
        }
        
        coordinator.addAgentKnowledge(
          data.agentId,
          data.domain,
          data.knowledge || {},
          data.confidence || 0.8
        );
        
        return NextResponse.json({ success: true, message: 'Knowledge added successfully' });

      case 'create-conflict':
        if (!data.type || !data.involvedAgents || !data.taskId) {
          return NextResponse.json(
            { success: false, error: 'Type, involved agents, and task ID are required' },
            { status: 400 }
          );
        }
        
        const conflictId = coordinator.createConflict(
          data.type,
          data.involvedAgents,
          data.taskId,
          data.description || ''
        );
        
        return NextResponse.json({ success: true, conflictId });

      case 'get-agent-knowledge':
        if (!data.agentId) {
          return NextResponse.json(
            { success: false, error: 'Agent ID is required' },
            { status: 400 }
          );
        }
        
        const knowledge = coordinator.getAgentKnowledge(data.agentId, data.domain);
        return NextResponse.json({ success: true, knowledge });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Multi-agent coordination API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Coordination operation failed' 
      },
      { status: 500 }
    );
  }
}
