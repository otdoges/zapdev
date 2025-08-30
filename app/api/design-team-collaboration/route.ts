import { NextRequest, NextResponse } from 'next/server';
import { DesignTeamCoordinator } from '@/lib/design-team-coordinator';
import { DesignWorkflowEngine } from '@/lib/design-workflow-engine';
import { DesignTeamRequest } from '@/lib/design-character-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...requestData } = body;

    const designEngine = DesignWorkflowEngine.getInstance();
    const designCoordinator = DesignTeamCoordinator.getDesignInstance();

    switch (action) {
      case 'start-design-session': {
        const designRequest: DesignTeamRequest = {
          designBrief: requestData.designBrief,
          projectType: requestData.projectType || 'web-app',
          targetAudience: requestData.targetAudience,
          brandGuidelines: requestData.brandGuidelines,
          constraints: requestData.constraints,
          preferredCharacters: requestData.preferredCharacters,
          discussionStyle: requestData.discussionStyle || 'collaborative'
        };

        const sessionId = await designCoordinator.startDesignSession(designRequest, {
          discussionRounds: requestData.discussionRounds || 3,
          consensusThreshold: requestData.consensusThreshold || 0.7,
          allowDebate: requestData.allowDebate ?? true,
          facilitatorMode: requestData.facilitatorMode || 'lead-driven'
        });

        return NextResponse.json({
          success: true,
          sessionId,
          message: 'Design session started successfully'
        });
      }

      case 'facilitate-discussion': {
        const { sessionId, designRequest } = requestData;
        
        const teamResponse = await designCoordinator.facilitateDiscussion(sessionId, designRequest);
        
        return NextResponse.json({
          success: true,
          teamResponse
        });
      }

      case 'process-design-request': {
        const designRequest: DesignTeamRequest = {
          designBrief: requestData.userQuery || requestData.designBrief,
          projectType: requestData.projectType || 'web-app',
          targetAudience: requestData.targetAudience,
          brandGuidelines: requestData.brandGuidelines,
          constraints: requestData.constraints,
          preferredCharacters: requestData.preferredCharacters,
          discussionStyle: requestData.discussionStyle || 'collaborative'
        };

        const processResult = await designEngine.processDesignRequest(
          designRequest.designBrief,
          designRequest,
          requestData.userId
        );

        if (processResult.useDesignWorkflow) {
          // Execute the design workflow
          const workflowExecution = await designEngine.executeWorkflow(
            processResult.workflowId!,
            designRequest,
            requestData.userId
          );

          return NextResponse.json({
            success: true,
            useDesignWorkflow: true,
            workflowExecution,
            selectedCharacters: processResult.selectedCharacters,
            estimatedTime: processResult.estimatedTime
          });
        } else {
          return NextResponse.json({
            success: true,
            useDesignWorkflow: false,
            message: 'Request does not require design team workflow'
          });
        }
      }

      case 'get-available-workflows': {
        const workflows = designEngine.getAvailableWorkflows();
        
        return NextResponse.json({
          success: true,
          workflows: workflows.map(w => ({
            id: w.id,
            name: w.name,
            description: w.description,
            estimatedDuration: w.estimatedDuration,
            requiredCharacters: w.requiredCharacters,
            outputType: w.outputType
          }))
        });
      }

      case 'get-design-characters': {
        const characterSystem = designEngine['characterSystem']; // Access private property
        const characters = characterSystem.getCharacters();
        
        return NextResponse.json({
          success: true,
          characters: characters.map(c => ({
            id: c.id,
            name: c.name,
            role: c.role,
            personality: c.personality,
            expertise: c.expertise,
            designPhilosophy: c.designPhilosophy
          }))
        });
      }

      case 'get-session-stats': {
        const { sessionId } = requestData;
        const stats = designCoordinator.getSessionStats(sessionId);
        
        return NextResponse.json({
          success: true,
          stats
        });
      }

      case 'switch-character': {
        const { sessionId, characterId } = requestData;
        const success = designEngine.switchActiveCharacter(sessionId, characterId);
        
        return NextResponse.json({
          success,
          message: success ? 'Character switched successfully' : 'Failed to switch character'
        });
      }

      case 'get-workflow-metrics': {
        const metrics = designEngine.getDesignWorkflowMetrics();
        
        return NextResponse.json({
          success: true,
          metrics
        });
      }

      case 'create-integrated-response': {
        const designRequest: DesignTeamRequest = {
          designBrief: requestData.designBrief,
          projectType: requestData.projectType || 'web-app',
          targetAudience: requestData.targetAudience,
          brandGuidelines: requestData.brandGuidelines,
          constraints: requestData.constraints,
          preferredCharacters: requestData.preferredCharacters,
          discussionStyle: requestData.discussionStyle || 'collaborative'
        };

        const teamResponse = await designEngine.createIntegratedResponse(designRequest, requestData.userId);
        
        return NextResponse.json({
          success: true,
          teamResponse
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Design team collaboration error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process design team request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const designEngine = DesignWorkflowEngine.getInstance();

    switch (action) {
      case 'available-workflows':
        const workflows = designEngine.getAvailableWorkflows();
        return NextResponse.json({
          success: true,
          workflows: workflows.map(w => ({
            id: w.id,
            name: w.name,
            description: w.description,
            estimatedDuration: w.estimatedDuration,
            outputType: w.outputType
          }))
        });

      case 'design-characters':
        const characterSystem = designEngine['characterSystem'];
        const characters = characterSystem.getCharacters();
        return NextResponse.json({
          success: true,
          characters: characters.map(c => ({
            id: c.id,
            name: c.name,
            role: c.role,
            expertise: c.expertise
          }))
        });

      case 'workflow-metrics':
        const metrics = designEngine.getDesignWorkflowMetrics();
        return NextResponse.json({
          success: true,
          metrics
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Design team GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process design team request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}