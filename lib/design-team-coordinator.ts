/**
 * Design Team Coordinator for Multi-Character Design Collaboration
 * Orchestrates interactions between design personas using Kimi K2 model
 */

import { MultiAgentCoordinator, AgentCollaboration } from './multi-agent-coordinator';
import { 
  DesignCharacterSystem, 
  DesignTeamRequest, 
  DesignTeamResponse, 
  DesignCharacter,
  DesignTeamMessage,
  DESIGN_CHARACTERS 
} from './design-character-system';
import { ModelOrchestrator } from './model-orchestrator';
import { trackFeatureUsage } from './posthog';
import { v4 as uuidv4 } from 'uuid';

export interface DesignSessionConfig {
  sessionId: string;
  activeCharacters: string[];
  discussionRounds: number;
  consensusThreshold: number; // 0.0-1.0, how much agreement needed
  allowDebate: boolean;
  facilitatorMode: 'democratic' | 'lead-driven' | 'rotating';
}

export interface CharacterResponse {
  characterId: string;
  response: string;
  confidence: number;
  designDecisions: string[];
  questionsForTeam: string[];
  buildsOnIdeas: string[]; // references to other characters' ideas
}

export interface DesignConsensus {
  agreementLevel: number; // 0.0-1.0
  majorDecisions: string[];
  areasOfDebate: string[];
  recommendedApproach: string;
  nextSteps: string[];
  characterSupport: Record<string, number>; // support level per character
}

export class DesignTeamCoordinator extends MultiAgentCoordinator {
  private static designInstance: DesignTeamCoordinator;
  private characterSystem: DesignCharacterSystem;
  private modelOrchestrator: ModelOrchestrator;
  private activeSessions: Map<string, DesignSessionConfig> = new Map();
  private sessionResponses: Map<string, CharacterResponse[]> = new Map();

  constructor() {
    super();
    this.characterSystem = DesignCharacterSystem.getInstance();
    this.modelOrchestrator = ModelOrchestrator.getInstance();
  }

  public static getDesignInstance(): DesignTeamCoordinator {
    if (!DesignTeamCoordinator.designInstance) {
      DesignTeamCoordinator.designInstance = new DesignTeamCoordinator();
    }
    return DesignTeamCoordinator.designInstance;
  }

  /**
   * Start a multi-character design session
   */
  public async startDesignSession(
    request: DesignTeamRequest,
    config?: Partial<DesignSessionConfig>
  ): Promise<string> {
    const selectedCharacters = this.characterSystem.selectCharactersForTask(request);
    
    const sessionConfig: DesignSessionConfig = {
      sessionId: `design_session_${uuidv4()}`,
      activeCharacters: selectedCharacters,
      discussionRounds: config?.discussionRounds || 3,
      consensusThreshold: config?.consensusThreshold || 0.7,
      allowDebate: config?.allowDebate ?? true,
      facilitatorMode: config?.facilitatorMode || 'lead-driven',
      ...config
    };

    this.activeSessions.set(sessionConfig.sessionId, sessionConfig);
    this.sessionResponses.set(sessionConfig.sessionId, []);

    // Track design team usage
    trackFeatureUsage('system', 'design-team-coordinator', true, {
      charactersInvolved: selectedCharacters.length,
      projectType: request.projectType,
      sessionId: sessionConfig.sessionId
    });

    return sessionConfig.sessionId;
  }

  /**
   * Generate character-specific responses for a design request
   */
  public async generateCharacterResponses(
    sessionId: string,
    request: DesignTeamRequest,
    round: number = 1
  ): Promise<CharacterResponse[]> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Design session ${sessionId} not found`);
    }

    const previousResponses = this.sessionResponses.get(sessionId) || [];
    const responses: CharacterResponse[] = [];

    // Generate response for each character in sequence
    for (const characterId of session.activeCharacters) {
      const character = this.characterSystem.getCharacter(characterId);
      if (!character) continue;

      const response = await this.generateSingleCharacterResponse(
        character,
        request,
        previousResponses,
        round,
        session
      );

      responses.push(response);
    }

    // Add responses to session history
    const existingResponses = this.sessionResponses.get(sessionId) || [];
    this.sessionResponses.set(sessionId, [...existingResponses, ...responses]);

    return responses;
  }

  /**
   * Generate a response from a single character
   */
  private async generateSingleCharacterResponse(
    character: DesignCharacter,
    request: DesignTeamRequest,
    previousResponses: CharacterResponse[],
    round: number,
    session: DesignSessionConfig
  ): Promise<CharacterResponse> {
    // Create character-specific context
    const contextPrompt = this.buildCharacterContext(character, request, previousResponses, round);
    
    // In a real implementation, this would call the Kimi K2 model with the character prompt
    // For now, we'll create a structured response that demonstrates the character's perspective
    
    const mockResponse = this.generateMockCharacterResponse(character, request, previousResponses);
    
    return {
      characterId: character.id,
      response: mockResponse.response,
      confidence: mockResponse.confidence,
      designDecisions: mockResponse.designDecisions,
      questionsForTeam: mockResponse.questionsForTeam,
      buildsOnIdeas: mockResponse.buildsOnIdeas
    };
  }

  /**
   * Build context prompt for a character
   */
  private buildCharacterContext(
    character: DesignCharacter,
    request: DesignTeamRequest,
    previousResponses: CharacterResponse[],
    round: number
  ): string {
    let context = this.characterSystem.getCharacterSystemPrompt(character.id, request);
    
    context += `\n\nDesign Session Context:
- Round: ${round}
- Discussion style: ${request.discussionStyle || 'collaborative'}
- Active team members: ${this.getActiveCharacterNames(request)}`;

    if (previousResponses.length > 0) {
      context += '\n\nPrevious team contributions:\n';
      previousResponses.forEach(response => {
        const responseCharacter = this.characterSystem.getCharacter(response.characterId);
        const name = responseCharacter ? responseCharacter.name : response.characterId;
        context += `${name}: ${response.response}\n`;
      });
      
      context += `\nAs ${character.name}, respond to the design brief while building on your teammates' ideas. Stay true to your character while being collaborative.`;
    } else {
      context += `\nAs ${character.name}, provide your initial response to the design brief. Focus on your areas of expertise while considering the full user experience.`;
    }

    return context;
  }

  /**
   * Get names of active characters for context
   */
  private getActiveCharacterNames(request: DesignTeamRequest): string {
    const selectedCharacters = this.characterSystem.selectCharactersForTask(request);
    return selectedCharacters
      .map(id => this.characterSystem.getCharacter(id)?.name)
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Generate mock character response (would be replaced with actual AI model call)
   */
  private generateMockCharacterResponse(
    character: DesignCharacter,
    request: DesignTeamRequest,
    previousResponses: CharacterResponse[]
  ): CharacterResponse {
    // This would be replaced with actual Kimi K2 model calls in production
    const responses: Record<string, any> = {
      alex: {
        response: `From a strategic UX perspective, we need to start with user research. ${request.designBrief} suggests we're solving [specific user problem]. I'd recommend creating user journey maps before diving into visual design.`,
        confidence: 0.85,
        designDecisions: ['Start with user research', 'Create journey maps', 'Define information architecture'],
        questionsForTeam: ['Who is our primary user?', 'What is their main pain point?', 'How do we measure success?'],
        buildsOnIdeas: []
      },
      maya: {
        response: `Visually, I'm thinking we need a cohesive color palette that reflects the brand personality. The visual hierarchy should guide users naturally through the interface. Let me suggest a mood board approach.`,
        confidence: 0.80,
        designDecisions: ['Establish visual hierarchy', 'Create color palette', 'Design mood board'],
        questionsForTeam: ['What emotions should the design evoke?', 'Are there existing brand colors to consider?'],
        buildsOnIdeas: previousResponses.filter(r => r.characterId === 'alex').map(r => `Building on Alex's user journey approach`)
      },
      sam: {
        response: `From an accessibility standpoint, we need to ensure this works for users with disabilities. Research shows that ${Math.random() > 0.5 ? 'inclusive design benefits everyone' : 'accessible interfaces improve usability for all users'}.`,
        confidence: 0.90,
        designDecisions: ['Ensure WCAG compliance', 'Plan for screen readers', 'Design inclusive interactions'],
        questionsForTeam: ['Have we considered cognitive accessibility?', 'What about users with motor impairments?'],
        buildsOnIdeas: previousResponses.map(r => `Incorporating ${this.characterSystem.getCharacter(r.characterId)?.name}'s insights`)
      },
      rio: {
        response: `This needs more personality in the interactions! I'm thinking smooth transitions that feel natural and provide clear feedback. The motion should guide users and create delightful moments.`,
        confidence: 0.75,
        designDecisions: ['Design micro-interactions', 'Plan transition timing', 'Create motion guidelines'],
        questionsForTeam: ['What feeling should the animations convey?', 'Are there performance constraints?'],
        buildsOnIdeas: previousResponses.filter(r => ['alex', 'maya'].includes(r.characterId)).map(r => `Enhancing the foundation`)
      },
      jordan: {
        response: `What story are we telling here? The brand voice should come through in every interaction. Let's ensure the messaging aligns with our brand personality and creates consistent touchpoints.`,
        confidence: 0.85,
        designDecisions: ['Define brand voice', 'Create messaging framework', 'Ensure brand consistency'],
        questionsForTeam: ['What is our brand personality?', 'How formal should the tone be?'],
        buildsOnIdeas: previousResponses.map(r => `Aligning with team's design direction`)
      }
    };

    return responses[character.id] || {
      response: `As ${character.name}, I bring ${character.expertise.join(', ')} expertise to this project.`,
      confidence: 0.70,
      designDecisions: [],
      questionsForTeam: [],
      buildsOnIdeas: []
    };
  }

  /**
   * Facilitate team discussion and build consensus
   */
  public async facilitateDiscussion(
    sessionId: string,
    request: DesignTeamRequest
  ): Promise<DesignTeamResponse> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Design session ${sessionId} not found`);
    }

    const allResponses: CharacterResponse[] = [];
    const discussionTranscript: DesignTeamMessage[] = [];

    // Run discussion rounds
    for (let round = 1; round <= session.discussionRounds; round++) {
      const roundResponses = await this.generateCharacterResponses(sessionId, request, round);
      allResponses.push(...roundResponses);

      // Convert responses to discussion messages
      roundResponses.forEach(response => {
        discussionTranscript.push({
          characterId: response.characterId,
          content: response.response,
          messageType: round === 1 ? 'suggestion' : 'build-on',
          timestamp: new Date(),
          referencesTo: response.buildsOnIdeas.length > 0 ? 
            this.extractCharacterReferences(response.buildsOnIdeas) : undefined
        });
      });
    }

    // Build consensus from all responses
    const consensus = this.buildConsensus(allResponses, session);
    
    // Generate team response
    const teamResponse: DesignTeamResponse = {
      primaryOutput: this.generatePrimaryOutput(consensus, allResponses),
      characterContributions: this.extractCharacterContributions(allResponses),
      teamConsensus: consensus.recommendedApproach,
      discussionTranscript,
      recommendedNextSteps: consensus.nextSteps,
      designDecisions: consensus.majorDecisions.map(decision => ({
        decision,
        rationale: this.generateDecisionRationale(decision, allResponses),
        supportingCharacters: this.getSupportingCharacters(decision, allResponses)
      }))
    };

    return teamResponse;
  }

  /**
   * Build consensus from character responses
   */
  private buildConsensus(responses: CharacterResponse[], session: DesignSessionConfig): DesignConsensus {
    // Aggregate design decisions from all characters
    const allDecisions = responses.flatMap(r => r.designDecisions);
    const decisionCounts = this.countDecisionFrequency(allDecisions);
    
    // Identify major decisions (mentioned by multiple characters)
    const majorDecisions = Object.entries(decisionCounts)
      .filter(([_, count]) => count >= Math.ceil(session.activeCharacters.length * session.consensusThreshold))
      .map(([decision, _]) => decision);

    // Calculate overall agreement level
    const agreementLevel = this.calculateAgreementLevel(responses);

    // Identify areas of debate
    const areasOfDebate = this.identifyDebateAreas(responses);

    // Generate recommended approach
    const recommendedApproach = this.synthesizeApproach(responses, majorDecisions);

    // Calculate character support levels
    const characterSupport = this.calculateCharacterSupport(responses, majorDecisions);

    return {
      agreementLevel,
      majorDecisions,
      areasOfDebate,
      recommendedApproach,
      nextSteps: this.generateNextSteps(majorDecisions, responses),
      characterSupport
    };
  }

  /**
   * Count frequency of design decisions across characters
   */
  private countDecisionFrequency(decisions: string[]): Record<string, number> {
    return decisions.reduce((counts, decision) => {
      counts[decision] = (counts[decision] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Calculate overall agreement level between characters
   */
  private calculateAgreementLevel(responses: CharacterResponse[]): number {
    if (responses.length < 2) return 1.0;

    let agreementPoints = 0;
    let totalComparisons = 0;

    // Compare each pair of characters for agreement
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const char1 = responses[i];
        const char2 = responses[j];
        
        // Simple agreement calculation based on shared decisions
        const sharedDecisions = char1.designDecisions.filter(d => 
          char2.designDecisions.some(d2 => this.decisionsAlign(d, d2))
        );
        
        const maxDecisions = Math.max(char1.designDecisions.length, char2.designDecisions.length);
        const agreementRatio = maxDecisions > 0 ? sharedDecisions.length / maxDecisions : 1;
        
        agreementPoints += agreementRatio;
        totalComparisons++;
      }
    }

    return totalComparisons > 0 ? agreementPoints / totalComparisons : 1.0;
  }

  /**
   * Check if two design decisions align
   */
  private decisionsAlign(decision1: string, decision2: string): boolean {
    // Simple keyword-based alignment check
    const keywords1 = decision1.toLowerCase().split(' ');
    const keywords2 = decision2.toLowerCase().split(' ');
    
    const commonKeywords = keywords1.filter(word => 
      keywords2.includes(word) && word.length > 3 // ignore small words
    );
    
    return commonKeywords.length >= 2; // At least 2 common meaningful words
  }

  /**
   * Identify areas where characters disagree
   */
  private identifyDebateAreas(responses: CharacterResponse[]): string[] {
    const debates: string[] = [];
    
    // Look for conflicting design decisions
    const allDecisions = responses.flatMap(r => 
      r.designDecisions.map(d => ({ decision: d, characterId: r.characterId }))
    );

    // Group similar decisions and find conflicts
    const decisionGroups = this.groupSimilarDecisions(allDecisions);
    
    decisionGroups.forEach(group => {
      if (group.length > 1 && this.hasConflictingViewpoints(group)) {
        debates.push(`Different approaches to: ${group[0].decision}`);
      }
    });

    return debates;
  }

  /**
   * Group similar design decisions
   */
  private groupSimilarDecisions(decisions: Array<{decision: string, characterId: string}>): Array<Array<{decision: string, characterId: string}>> {
    const groups: Array<Array<{decision: string, characterId: string}>> = [];
    
    decisions.forEach(decision => {
      let addedToGroup = false;
      
      for (const group of groups) {
        if (group.some(d => this.decisionsAlign(d.decision, decision.decision))) {
          group.push(decision);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push([decision]);
      }
    });
    
    return groups;
  }

  /**
   * Check if a group of decisions has conflicting viewpoints
   */
  private hasConflictingViewpoints(group: Array<{decision: string, characterId: string}>): boolean {
    // If different characters have different approaches to the same area, it's a conflict
    const characterIds = new Set(group.map(d => d.characterId));
    return characterIds.size > 1; // Multiple characters addressing the same area differently
  }

  /**
   * Synthesize approach from all character responses
   */
  private synthesizeApproach(responses: CharacterResponse[], majorDecisions: string[]): string {
    const strategicElements = responses.find(r => r.characterId === 'alex')?.designDecisions || [];
    const visualElements = responses.find(r => r.characterId === 'maya')?.designDecisions || [];
    const accessibilityElements = responses.find(r => r.characterId === 'sam')?.designDecisions || [];
    const interactionElements = responses.find(r => r.characterId === 'rio')?.designDecisions || [];
    const brandElements = responses.find(r => r.characterId === 'jordan')?.designDecisions || [];

    let approach = 'Recommended design approach:\n\n';
    
    if (strategicElements.length > 0) {
      approach += `Strategy: ${strategicElements.slice(0, 2).join(', ')}\n`;
    }
    if (visualElements.length > 0) {
      approach += `Visual: ${visualElements.slice(0, 2).join(', ')}\n`;
    }
    if (accessibilityElements.length > 0) {
      approach += `Accessibility: ${accessibilityElements.slice(0, 2).join(', ')}\n`;
    }
    if (interactionElements.length > 0) {
      approach += `Interactions: ${interactionElements.slice(0, 2).join(', ')}\n`;
    }
    if (brandElements.length > 0) {
      approach += `Brand: ${brandElements.slice(0, 2).join(', ')}\n`;
    }

    return approach;
  }

  /**
   * Generate next steps from consensus
   */
  private generateNextSteps(majorDecisions: string[], responses: CharacterResponse[]): string[] {
    const steps: string[] = [];
    
    // Extract questions from all characters
    const allQuestions = responses.flatMap(r => r.questionsForTeam);
    
    // Convert major decisions to actionable steps
    majorDecisions.forEach(decision => {
      steps.push(`Implement: ${decision}`);
    });
    
    // Add critical questions as validation steps
    if (allQuestions.length > 0) {
      steps.push(`Validate: ${allQuestions.slice(0, 2).join(', ')}`);
    }
    
    // Add standard design process steps
    steps.push('Create initial prototypes');
    steps.push('Test with target users');
    steps.push('Iterate based on feedback');

    return steps.slice(0, 6); // Limit to 6 steps
  }

  /**
   * Calculate character support levels for major decisions
   */
  private calculateCharacterSupport(responses: CharacterResponse[], majorDecisions: string[]): Record<string, number> {
    const support: Record<string, number> = {};
    
    responses.forEach(response => {
      const character = this.characterSystem.getCharacter(response.characterId);
      if (!character) return;
      
      // Calculate support based on how many major decisions this character contributed to
      const contributedDecisions = response.designDecisions.filter(decision =>
        majorDecisions.some(major => this.decisionsAlign(decision, major))
      );
      
      support[character.name] = contributedDecisions.length / Math.max(majorDecisions.length, 1);
    });
    
    return support;
  }

  /**
   * Extract character references from build-on ideas
   */
  private extractCharacterReferences(buildsOnIdeas: string[]): string[] {
    const characterNames = Object.values(DESIGN_CHARACTERS).map(c => c.name.toLowerCase());
    const references: string[] = [];
    
    buildsOnIdeas.forEach(idea => {
      characterNames.forEach(name => {
        if (idea.toLowerCase().includes(name)) {
          references.push(name);
        }
      });
    });
    
    return [...new Set(references)]; // Remove duplicates
  }

  /**
   * Generate primary output from consensus
   */
  private generatePrimaryOutput(consensus: DesignConsensus, responses: CharacterResponse[]): string {
    let output = `Design Team Consensus (${(consensus.agreementLevel * 100).toFixed(0)}% agreement):\n\n`;
    output += `${consensus.recommendedApproach}\n\n`;
    
    if (consensus.areasOfDebate.length > 0) {
      output += `Areas for further discussion: ${consensus.areasOfDebate.join(', ')}\n\n`;
    }
    
    output += `Key decisions: ${consensus.majorDecisions.join(', ')}`;
    
    return output;
  }

  /**
   * Extract character contributions summary
   */
  private extractCharacterContributions(responses: CharacterResponse[]): Record<string, string> {
    const contributions: Record<string, string> = {};
    
    responses.forEach(response => {
      const character = this.characterSystem.getCharacter(response.characterId);
      if (character) {
        contributions[character.name] = `${character.role}: ${response.response.substring(0, 200)}...`;
      }
    });
    
    return contributions;
  }

  /**
   * Generate rationale for design decisions
   */
  private generateDecisionRationale(decision: string, responses: CharacterResponse[]): string {
    const supportingResponses = responses.filter(r => 
      r.designDecisions.some(d => this.decisionsAlign(d, decision))
    );
    
    if (supportingResponses.length === 0) return 'General team consensus';
    
    const reasons = supportingResponses.map(r => {
      const character = this.characterSystem.getCharacter(r.characterId);
      return character ? `${character.name}'s ${character.role.toLowerCase()} perspective` : 'team input';
    });
    
    return `Supported by ${reasons.join(' and ')}`;
  }

  /**
   * Get characters supporting a decision
   */
  private getSupportingCharacters(decision: string, responses: CharacterResponse[]): string[] {
    return responses
      .filter(r => r.designDecisions.some(d => this.decisionsAlign(d, decision)))
      .map(r => this.characterSystem.getCharacter(r.characterId)?.name || r.characterId)
      .filter(Boolean);
  }

  /**
   * Get session statistics
   */
  public getSessionStats(sessionId: string): {
    charactersInvolved: number;
    totalResponses: number;
    averageConfidence: number;
    discussionRounds: number;
    consensusLevel: number;
  } | null {
    const session = this.activeSessions.get(sessionId);
    const responses = this.sessionResponses.get(sessionId);
    
    if (!session || !responses) return null;
    
    const averageConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    
    // Calculate consensus level based on decision overlap
    const allDecisions = responses.flatMap(r => r.designDecisions);
    const uniqueDecisions = new Set(allDecisions).size;
    const consensusLevel = uniqueDecisions > 0 ? 1 - (uniqueDecisions / allDecisions.length) : 1;
    
    return {
      charactersInvolved: session.activeCharacters.length,
      totalResponses: responses.length,
      averageConfidence,
      discussionRounds: session.discussionRounds,
      consensusLevel
    };
  }

  /**
   * End a design session
   */
  public endSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    this.sessionResponses.delete(sessionId);
  }

  /**
   * Get all active design sessions
   */
  public getActiveSessions(): DesignSessionConfig[] {
    return Array.from(this.activeSessions.values());
  }
}