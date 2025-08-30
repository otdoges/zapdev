/**
 * Design Workflow Engine
 * Manages design-specific workflows and character switching logic for ZapDev AI
 */

import { DesignTeamCoordinator } from './design-team-coordinator';
import { DesignCharacterSystem, DesignTeamRequest, DesignTeamResponse } from './design-character-system';
import { ModelOrchestrator, TaskRequirements } from './model-orchestrator';
import { IntegratedAISystem, AIRequest } from './integrated-ai-system';

export interface DesignWorkflow {
  id: string;
  name: string;
  description: string;
  stages: DesignWorkflowStage[];
  estimatedDuration: number; // minutes
  requiredCharacters: string[];
  optionalCharacters: string[];
  outputType: 'design-system' | 'ui-components' | 'brand-guidelines' | 'prototype' | 'analysis';
}

export interface DesignWorkflowStage {
  id: string;
  name: string;
  description: string;
  primaryCharacter: string;
  supportingCharacters: string[];
  inputs: string[];
  outputs: string[];
  estimatedTime: number; // minutes
  dependencies: string[]; // stage IDs that must complete first
  characterSwitchTriggers?: string[]; // conditions that trigger character switching
}

export interface DesignWorkflowExecution {
  workflowId: string;
  sessionId: string;
  currentStage: string;
  completedStages: string[];
  stageOutputs: Record<string, any>;
  activeCharacter: string;
  teamDiscussion?: {
    messages: any[];
    consensus: string;
  };
  status: 'planning' | 'executing' | 'discussing' | 'completed' | 'failed';
  startTime: Date;
  estimatedCompletion: Date;
}

export const DESIGN_WORKFLOWS: Record<string, DesignWorkflow> = {
  'complete-design-system': {
    id: 'complete-design-system',
    name: 'Complete Design System Creation',
    description: 'Full design system with tokens, components, guidelines, and documentation',
    stages: [
      {
        id: 'discovery',
        name: 'Discovery & Research',
        description: 'User research, competitive analysis, and requirements gathering',
        primaryCharacter: 'alex',
        supportingCharacters: ['sam'],
        inputs: ['project brief', 'target audience', 'business requirements'],
        outputs: ['user personas', 'competitive analysis', 'design requirements'],
        estimatedTime: 30,
        dependencies: []
      },
      {
        id: 'brand-foundation',
        name: 'Brand Foundation',
        description: 'Establish brand voice, personality, and core identity elements',
        primaryCharacter: 'jordan',
        supportingCharacters: ['maya'],
        inputs: ['design requirements', 'brand brief'],
        outputs: ['brand guidelines', 'voice and tone', 'messaging framework'],
        estimatedTime: 25,
        dependencies: ['discovery']
      },
      {
        id: 'visual-system',
        name: 'Visual Design System',
        description: 'Color palettes, typography, spacing, and visual hierarchy',
        primaryCharacter: 'maya',
        supportingCharacters: ['jordan', 'sam'],
        inputs: ['brand guidelines', 'design requirements'],
        outputs: ['design tokens', 'color system', 'typography scale', 'spacing system'],
        estimatedTime: 40,
        dependencies: ['brand-foundation']
      },
      {
        id: 'component-design',
        name: 'Component Library Design',
        description: 'Core UI components with accessibility and interaction patterns',
        primaryCharacter: 'sam',
        supportingCharacters: ['maya', 'rio'],
        inputs: ['design tokens', 'user requirements'],
        outputs: ['component library', 'accessibility guidelines', 'interaction patterns'],
        estimatedTime: 45,
        dependencies: ['visual-system']
      },
      {
        id: 'interaction-design',
        name: 'Motion & Interaction Design',
        description: 'Micro-interactions, transitions, and animation guidelines',
        primaryCharacter: 'rio',
        supportingCharacters: ['sam', 'maya'],
        inputs: ['component library', 'interaction patterns'],
        outputs: ['motion guidelines', 'transition library', 'animation principles'],
        estimatedTime: 35,
        dependencies: ['component-design']
      },
      {
        id: 'system-documentation',
        name: 'System Documentation',
        description: 'Comprehensive documentation and implementation guidelines',
        primaryCharacter: 'alex',
        supportingCharacters: ['jordan'],
        inputs: ['all previous outputs'],
        outputs: ['design system documentation', 'implementation guide', 'maintenance guidelines'],
        estimatedTime: 25,
        dependencies: ['interaction-design']
      }
    ],
    estimatedDuration: 200,
    requiredCharacters: ['alex', 'maya', 'sam', 'rio', 'jordan'],
    optionalCharacters: [],
    outputType: 'design-system'
  },

  'landing-page-design': {
    id: 'landing-page-design',
    name: 'Landing Page Design',
    description: 'Complete landing page design with conversion optimization',
    stages: [
      {
        id: 'conversion-strategy',
        name: 'Conversion Strategy',
        description: 'Define conversion goals and user journey',
        primaryCharacter: 'alex',
        supportingCharacters: ['jordan'],
        inputs: ['business goals', 'target audience'],
        outputs: ['conversion strategy', 'user journey map'],
        estimatedTime: 20,
        dependencies: []
      },
      {
        id: 'content-strategy',
        name: 'Content & Messaging',
        description: 'Create compelling copy and messaging hierarchy',
        primaryCharacter: 'jordan',
        supportingCharacters: ['alex'],
        inputs: ['conversion strategy', 'brand guidelines'],
        outputs: ['page copy', 'messaging hierarchy', 'CTA strategy'],
        estimatedTime: 25,
        dependencies: ['conversion-strategy']
      },
      {
        id: 'visual-layout',
        name: 'Visual Layout Design',
        description: 'Create visual layout with strong hierarchy and brand alignment',
        primaryCharacter: 'maya',
        supportingCharacters: ['jordan', 'sam'],
        inputs: ['messaging hierarchy', 'brand guidelines'],
        outputs: ['wireframes', 'visual design', 'responsive layouts'],
        estimatedTime: 35,
        dependencies: ['content-strategy']
      },
      {
        id: 'interaction-polish',
        name: 'Interaction & Animation',
        description: 'Add micro-interactions and conversion-focused animations',
        primaryCharacter: 'rio',
        supportingCharacters: ['maya'],
        inputs: ['visual design', 'conversion strategy'],
        outputs: ['interaction prototypes', 'animation specifications'],
        estimatedTime: 20,
        dependencies: ['visual-layout']
      }
    ],
    estimatedDuration: 100,
    requiredCharacters: ['alex', 'maya', 'jordan', 'rio'],
    optionalCharacters: ['sam'],
    outputType: 'prototype'
  },

  'ui-component-design': {
    id: 'ui-component-design',
    name: 'UI Component Design',
    description: 'Design individual UI components with full specifications',
    stages: [
      {
        id: 'component-analysis',
        name: 'Component Analysis',
        description: 'Analyze component requirements and user needs',
        primaryCharacter: 'sam',
        supportingCharacters: ['alex'],
        inputs: ['component requirements', 'user context'],
        outputs: ['usability requirements', 'accessibility checklist'],
        estimatedTime: 15,
        dependencies: []
      },
      {
        id: 'visual-design',
        name: 'Visual Component Design',
        description: 'Create visual design with brand consistency',
        primaryCharacter: 'maya',
        supportingCharacters: ['jordan'],
        inputs: ['usability requirements', 'brand guidelines'],
        outputs: ['component designs', 'visual specifications'],
        estimatedTime: 25,
        dependencies: ['component-analysis']
      },
      {
        id: 'interaction-specs',
        name: 'Interaction Specifications',
        description: 'Define component states and interactions',
        primaryCharacter: 'rio',
        supportingCharacters: ['sam'],
        inputs: ['component designs', 'usability requirements'],
        outputs: ['interaction specifications', 'state definitions'],
        estimatedTime: 20,
        dependencies: ['visual-design']
      }
    ],
    estimatedDuration: 60,
    requiredCharacters: ['maya', 'sam', 'rio'],
    optionalCharacters: ['alex', 'jordan'],
    outputType: 'ui-components'
  }
};

export class DesignWorkflowEngine {
  private static instance: DesignWorkflowEngine;
  private designCoordinator: DesignTeamCoordinator;
  private characterSystem: DesignCharacterSystem;
  private modelOrchestrator: ModelOrchestrator;
  private integratedAI: IntegratedAISystem;
  
  private activeExecutions: Map<string, DesignWorkflowExecution> = new Map();

  constructor() {
    this.designCoordinator = DesignTeamCoordinator.getDesignInstance();
    this.characterSystem = DesignCharacterSystem.getInstance();
    this.modelOrchestrator = ModelOrchestrator.getInstance();
    this.integratedAI = IntegratedAISystem.getInstance();
  }

  public static getInstance(): DesignWorkflowEngine {
    if (!DesignWorkflowEngine.instance) {
      DesignWorkflowEngine.instance = new DesignWorkflowEngine();
    }
    return DesignWorkflowEngine.instance;
  }

  /**
   * Detect if a request should use design team workflow
   */
  public shouldUseDesignWorkflow(userQuery: string): boolean {
    const designIndicators = [
      'design system', 'landing page', 'ui component', 'user interface',
      'design team', 'collaborative design', 'design personas', 'design critique',
      'brand design', 'visual design', 'ux design', 'motion design',
      'design brainstorm', 'design discussion', 'design feedback'
    ];

    const query = userQuery.toLowerCase();
    return designIndicators.some(indicator => query.includes(indicator));
  }

  /**
   * Select appropriate workflow for a design request
   */
  public selectWorkflow(request: DesignTeamRequest): string {
    const { projectType, designBrief } = request;
    const brief = designBrief.toLowerCase();

    // Match project type to workflows
    if (projectType === 'brand-system' || brief.includes('design system') || brief.includes('design tokens')) {
      return 'complete-design-system';
    }
    
    if (projectType === 'landing-page' || brief.includes('landing page') || brief.includes('conversion')) {
      return 'landing-page-design';
    }
    
    if (brief.includes('component') || brief.includes('button') || brief.includes('form') || brief.includes('ui element')) {
      return 'ui-component-design';
    }

    // Default to complete design system for comprehensive requests
    return 'complete-design-system';
  }

  /**
   * Execute a design workflow with character switching
   */
  public async executeWorkflow(
    workflowId: string,
    request: DesignTeamRequest,
    userId?: string
  ): Promise<DesignWorkflowExecution> {
    const workflow = DESIGN_WORKFLOWS[workflowId];
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Start design session
    const sessionId = await this.designCoordinator.startDesignSession(request, {
      discussionRounds: 2,
      consensusThreshold: 0.6,
      allowDebate: true,
      facilitatorMode: 'lead-driven'
    });

    const execution: DesignWorkflowExecution = {
      workflowId,
      sessionId,
      currentStage: workflow.stages[0].id,
      completedStages: [],
      stageOutputs: {},
      activeCharacter: workflow.stages[0].primaryCharacter,
      status: 'planning',
      startTime: new Date(),
      estimatedCompletion: new Date(Date.now() + workflow.estimatedDuration * 60 * 1000)
    };

    this.activeExecutions.set(sessionId, execution);

    // Execute workflow stages
    for (const stage of workflow.stages) {
      await this.executeWorkflowStage(execution, stage, request);
    }

    execution.status = 'completed';
    return execution;
  }

  /**
   * Execute a single workflow stage
   */
  private async executeWorkflowStage(
    execution: DesignWorkflowExecution,
    stage: DesignWorkflowStage,
    request: DesignTeamRequest
  ): Promise<void> {
    execution.currentStage = stage.id;
    execution.activeCharacter = stage.primaryCharacter;
    execution.status = 'executing';

    // Switch to primary character for this stage
    const primaryCharacterPrompt = this.characterSystem.getCharacterSystemPrompt(
      stage.primaryCharacter, 
      request
    );

    // Create stage-specific context
    const stageContext = this.buildStageContext(execution, stage, request);
    
    // Generate character response for this stage
    const stageOutput = await this.generateStageOutput(
      stage,
      request,
      stageContext,
      primaryCharacterPrompt
    );

    // Store stage output
    execution.stageOutputs[stage.id] = stageOutput;
    execution.completedStages.push(stage.id);

    // If stage has supporting characters, get their input
    if (stage.supportingCharacters.length > 0) {
      execution.status = 'discussing';
      
      const supportingInputs = await this.getSupportingCharacterInput(
        stage,
        request,
        stageOutput,
        execution
      );
      
      execution.stageOutputs[`${stage.id}_supporting`] = supportingInputs;
    }
  }

  /**
   * Build context for a workflow stage
   */
  private buildStageContext(
    execution: DesignWorkflowExecution,
    stage: DesignWorkflowStage,
    request: DesignTeamRequest
  ): string {
    let context = `Design Workflow Stage: ${stage.name}\n`;
    context += `Description: ${stage.description}\n`;
    context += `Your role: ${stage.primaryCharacter} (primary)\n`;
    
    if (stage.supportingCharacters.length > 0) {
      context += `Supporting team members: ${stage.supportingCharacters.join(', ')}\n`;
    }
    
    context += `\nStage inputs:\n${stage.inputs.join('\n')}\n`;
    context += `\nExpected outputs:\n${stage.outputs.join('\n')}\n`;

    // Add previous stage outputs as context
    if (execution.completedStages.length > 0) {
      context += '\n\nPrevious stage outputs:\n';
      execution.completedStages.forEach(stageId => {
        const output = execution.stageOutputs[stageId];
        if (output && output.summary) {
          context += `${stageId}: ${output.summary}\n`;
        }
      });
    }

    return context;
  }

  /**
   * Generate output for a workflow stage
   */
  private async generateStageOutput(
    stage: DesignWorkflowStage,
    request: DesignTeamRequest,
    stageContext: string,
    characterPrompt: string
  ): Promise<any> {
    // This would integrate with the actual AI model calls
    // For now, return structured mock data based on the stage
    
    const mockOutputs: Record<string, any> = {
      'discovery': {
        summary: 'User research and requirements analysis completed',
        deliverables: {
          userPersonas: ['Primary user: Tech-savvy professional', 'Secondary user: Business stakeholder'],
          competitiveAnalysis: 'Analysis of 3 key competitors completed',
          designRequirements: ['Mobile-first approach', 'Accessibility compliance', 'Fast loading']
        }
      },
      'brand-foundation': {
        summary: 'Brand foundation established with voice and personality',
        deliverables: {
          brandGuidelines: 'Professional yet approachable brand personality',
          voiceAndTone: 'Confident, helpful, and human-centered',
          messagingFramework: 'Problem → Solution → Benefit structure'
        }
      },
      'visual-system': {
        summary: 'Visual design system created with tokens and guidelines',
        deliverables: {
          designTokens: 'Color, typography, and spacing tokens defined',
          colorSystem: 'Primary, secondary, and semantic color palettes',
          typographyScale: 'Modular scale with 6 text sizes',
          spacingSystem: '8px base grid system'
        }
      },
      'component-design': {
        summary: 'Core component library designed with accessibility focus',
        deliverables: {
          componentLibrary: 'Button, Input, Card, Navigation components',
          accessibilityGuidelines: 'WCAG 2.1 AA compliance guidelines',
          interactionPatterns: 'Hover, focus, active, and disabled states'
        }
      },
      'interaction-design': {
        summary: 'Motion and interaction specifications completed',
        deliverables: {
          motionGuidelines: 'Easing curves and timing specifications',
          transitionLibrary: 'Page, modal, and component transitions',
          animationPrinciples: 'Purposeful motion that enhances usability'
        }
      },
      'system-documentation': {
        summary: 'Comprehensive documentation and guidelines completed',
        deliverables: {
          designSystemDocumentation: 'Complete design system reference',
          implementationGuide: 'Developer handoff specifications',
          maintenanceGuidelines: 'Design system evolution guidelines'
        }
      }
    };

    return mockOutputs[stage.id] || {
      summary: `${stage.name} completed`,
      deliverables: stage.outputs.reduce((acc, output) => {
        acc[output.replace(/\s+/g, '')] = `${output} completed`;
        return acc;
      }, {} as Record<string, string>)
    };
  }

  /**
   * Get input from supporting characters
   */
  private async getSupportingCharacterInput(
    stage: DesignWorkflowStage,
    request: DesignTeamRequest,
    primaryOutput: any,
    execution: DesignWorkflowExecution
  ): Promise<Record<string, any>> {
    const supportingInputs: Record<string, any> = {};

    for (const characterId of stage.supportingCharacters) {
      const character = this.characterSystem.getCharacter(characterId);
      if (!character) continue;

      // Create context for supporting character
      const supportContext = this.buildSupportingCharacterContext(
        character,
        stage,
        primaryOutput,
        request
      );

      // Generate supporting character response
      const supportingResponse = await this.generateSupportingResponse(
        character,
        supportContext,
        primaryOutput
      );

      supportingInputs[characterId] = supportingResponse;
    }

    return supportingInputs;
  }

  /**
   * Build context for supporting character
   */
  private buildSupportingCharacterContext(
    character: any,
    stage: DesignWorkflowStage,
    primaryOutput: any,
    request: DesignTeamRequest
  ): string {
    const primaryCharacter = this.characterSystem.getCharacter(stage.primaryCharacter);
    const primaryName = primaryCharacter ? primaryCharacter.name : stage.primaryCharacter;

    return `You are ${character.name} supporting ${primaryName} in the ${stage.name} stage.

${primaryName} has completed their primary work:
${JSON.stringify(primaryOutput, null, 2)}

As ${character.name}, provide your perspective on this work:
- What do you think works well?
- What concerns do you have from your expertise area?
- What would you add or modify?
- How does this align with your design philosophy?

Stay in character and focus on your specialties: ${character.expertise.join(', ')}`;
  }

  /**
   * Generate supporting character response
   */
  private async generateSupportingResponse(
    character: any,
    context: string,
    primaryOutput: any
  ): Promise<any> {
    // Mock supporting responses based on character expertise
    const mockResponses: Record<string, any> = {
      alex: {
        feedback: 'Strategic alignment looks good. Consider user testing to validate assumptions.',
        suggestions: ['Add user validation checkpoint', 'Consider edge cases in user journey'],
        approval: 0.85
      },
      maya: {
        feedback: 'Visual direction is solid. Let\'s ensure brand consistency across all elements.',
        suggestions: ['Strengthen visual hierarchy', 'Add more brand personality'],
        approval: 0.80
      },
      sam: {
        feedback: 'Good accessibility considerations. Need to add keyboard navigation patterns.',
        suggestions: ['Include screen reader labels', 'Test with assistive technology'],
        approval: 0.90
      },
      rio: {
        feedback: 'Interactions need more personality. Consider adding subtle animations.',
        suggestions: ['Add loading states', 'Include hover animations', 'Define timing curves'],
        approval: 0.75
      },
      jordan: {
        feedback: 'Brand voice is consistent. Messaging could be more compelling.',
        suggestions: ['Strengthen value proposition', 'Add emotional hooks'],
        approval: 0.85
      }
    };

    return mockResponses[character.id] || {
      feedback: `${character.name} provides expertise in ${character.expertise[0]}`,
      suggestions: ['General improvement suggestions'],
      approval: 0.80
    };
  }

  /**
   * Switch active character during workflow
   */
  public switchActiveCharacter(sessionId: string, newCharacterId: string): boolean {
    const execution = this.activeExecutions.get(sessionId);
    if (!execution) return false;

    const character = this.characterSystem.getCharacter(newCharacterId);
    if (!character) return false;

    execution.activeCharacter = newCharacterId;
    this.activeExecutions.set(sessionId, execution);
    
    return true;
  }

  /**
   * Process design request with character workflow
   */
  public async processDesignRequest(
    userQuery: string,
    requestData?: Partial<DesignTeamRequest>,
    userId?: string
  ): Promise<{
    useDesignWorkflow: boolean;
    workflowId?: string;
    selectedCharacters?: string[];
    estimatedTime?: number;
    aiRequest?: AIRequest;
  }> {
    // Check if this should use design workflow
    if (!this.shouldUseDesignWorkflow(userQuery)) {
      return { useDesignWorkflow: false };
    }

    // Create design team request
    const designRequest: DesignTeamRequest = {
      designBrief: userQuery,
      projectType: requestData?.projectType || this.inferProjectType(userQuery),
      targetAudience: requestData?.targetAudience,
      brandGuidelines: requestData?.brandGuidelines,
      constraints: requestData?.constraints,
      preferredCharacters: requestData?.preferredCharacters,
      discussionStyle: requestData?.discussionStyle || 'collaborative'
    };

    // Select workflow
    const workflowId = this.selectWorkflow(designRequest);
    const workflow = DESIGN_WORKFLOWS[workflowId];
    
    // Select characters
    const selectedCharacters = this.characterSystem.selectCharactersForTask(designRequest);

    // Create AI request with design team context
    const aiRequest: AIRequest = {
      userQuery,
      userId,
      subscriptionType: 'pro', // Design team is a pro feature
      projectType: this.mapProjectType(designRequest.projectType)
    };

    return {
      useDesignWorkflow: true,
      workflowId,
      selectedCharacters,
      estimatedTime: workflow.estimatedDuration,
      aiRequest
    };
  }

  /**
   * Infer project type from user query
   */
  private inferProjectType(query: string): DesignTeamRequest['projectType'] {
    const q = query.toLowerCase();
    
    if (q.includes('landing page') || q.includes('marketing page')) return 'landing-page';
    if (q.includes('dashboard') || q.includes('admin panel')) return 'dashboard';
    if (q.includes('mobile') || q.includes('app')) return 'mobile-app';
    if (q.includes('brand') || q.includes('design system')) return 'brand-system';
    
    return 'web-app'; // default
  }

  /**
   * Map design project type to AI project type
   */
  private mapProjectType(designProjectType: DesignTeamRequest['projectType']): AIRequest['projectType'] {
    const mapping: Record<DesignTeamRequest['projectType'], AIRequest['projectType']> = {
      'web-app': 'web-app',
      'landing-page': 'web-app',
      'dashboard': 'web-app',
      'mobile-app': 'mobile',
      'brand-system': 'web-app'
    };
    
    return mapping[designProjectType];
  }

  /**
   * Get workflow by ID
   */
  public getWorkflow(workflowId: string): DesignWorkflow | null {
    return DESIGN_WORKFLOWS[workflowId] || null;
  }

  /**
   * Get all available workflows
   */
  public getAvailableWorkflows(): DesignWorkflow[] {
    return Object.values(DESIGN_WORKFLOWS);
  }

  /**
   * Get execution status
   */
  public getExecutionStatus(sessionId: string): DesignWorkflowExecution | null {
    return this.activeExecutions.get(sessionId) || null;
  }

  /**
   * Create integrated design team response
   */
  public async createIntegratedResponse(
    request: DesignTeamRequest,
    userId?: string
  ): Promise<DesignTeamResponse> {
    // Start design session and get character responses
    const sessionId = await this.designCoordinator.startDesignSession(request);
    
    // Facilitate team discussion
    const teamResponse = await this.designCoordinator.facilitateDiscussion(sessionId, request);
    
    // End session
    this.designCoordinator.endSession(sessionId);
    
    return teamResponse;
  }

  /**
   * Handle character switching triggers during execution
   */
  public evaluateCharacterSwitchTriggers(
    execution: DesignWorkflowExecution,
    currentOutput: string,
    stage: DesignWorkflowStage
  ): string | null {
    if (!stage.characterSwitchTriggers) return null;

    // Check if any triggers are present in the current output
    for (const trigger of stage.characterSwitchTriggers) {
      if (currentOutput.toLowerCase().includes(trigger.toLowerCase())) {
        // Determine which character should handle this trigger
        return this.selectCharacterForTrigger(trigger, stage);
      }
    }

    return null;
  }

  /**
   * Select character to handle a specific trigger
   */
  private selectCharacterForTrigger(trigger: string, stage: DesignWorkflowStage): string {
    // Map triggers to character expertise
    const triggerMappings: Record<string, string> = {
      'accessibility': 'sam',
      'brand': 'jordan',
      'animation': 'rio',
      'visual': 'maya',
      'user experience': 'alex',
      'strategy': 'alex',
      'motion': 'rio',
      'color': 'maya',
      'typography': 'maya',
      'usability': 'sam'
    };

    for (const [keyword, characterId] of Object.entries(triggerMappings)) {
      if (trigger.toLowerCase().includes(keyword)) {
        // Check if this character is available in current stage
        if (stage.supportingCharacters.includes(characterId) || stage.primaryCharacter === characterId) {
          return characterId;
        }
      }
    }

    // Default to primary character
    return stage.primaryCharacter;
  }

  /**
   * Get performance metrics for design workflows
   */
  public getDesignWorkflowMetrics(): {
    activeWorkflows: number;
    completedWorkflows: number;
    averageCompletionTime: number;
    characterUtilization: Record<string, number>;
    workflowSuccess: Record<string, number>;
  } {
    const executions = Array.from(this.activeExecutions.values());
    
    const active = executions.filter(e => ['planning', 'executing', 'discussing'].includes(e.status)).length;
    const completed = executions.filter(e => e.status === 'completed').length;
    
    const completedExecutions = executions.filter(e => e.status === 'completed');
    const avgTime = completedExecutions.length > 0 
      ? completedExecutions.reduce((sum, e) => {
          const duration = Date.now() - e.startTime.getTime();
          return sum + duration;
        }, 0) / completedExecutions.length / (60 * 1000) // Convert to minutes
      : 0;

    // Character utilization (how often each character is used)
    const characterUsage: Record<string, number> = {};
    const allCharacters = this.characterSystem.getCharacters();
    allCharacters.forEach(char => {
      characterUsage[char.name] = executions.filter(e => 
        e.activeCharacter === char.id || 
        this.getWorkflow(e.workflowId)?.requiredCharacters.includes(char.id)
      ).length;
    });

    // Workflow success rates
    const workflowSuccess: Record<string, number> = {};
    Object.keys(DESIGN_WORKFLOWS).forEach(workflowId => {
      const workflowExecutions = executions.filter(e => e.workflowId === workflowId);
      const successfulExecutions = workflowExecutions.filter(e => e.status === 'completed');
      workflowSuccess[workflowId] = workflowExecutions.length > 0 
        ? successfulExecutions.length / workflowExecutions.length 
        : 0;
    });

    return {
      activeWorkflows: active,
      completedWorkflows: completed,
      averageCompletionTime: avgTime,
      characterUtilization: characterUsage,
      workflowSuccess
    };
  }

  /**
   * Clean up completed executions
   */
  public cleanupCompletedExecutions(olderThanHours: number = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    for (const [sessionId, execution] of this.activeExecutions.entries()) {
      if (execution.status === 'completed' && execution.startTime.getTime() < cutoff) {
        this.activeExecutions.delete(sessionId);
      }
    }
  }
}