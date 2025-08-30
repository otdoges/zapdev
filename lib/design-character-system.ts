/**
 * Multi-Character Design Team System for ZapDev AI
 * Creates distinct designer personas using Kimi K2 model with role-based prompting
 */

export interface DesignCharacter {
  id: string;
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  communicationStyle: string;
  designPhilosophy: string;
  workingMethods: string[];
  catchphrases: string[];
  collaborationTendencies: string[];
  systemPrompt: string;
}

export interface DesignTeamDiscussion {
  id: string;
  topic: string;
  participants: string[]; // character IDs
  messages: DesignTeamMessage[];
  consensus?: string;
  timestamp: Date;
  status: 'active' | 'concluded' | 'paused';
}

export interface DesignTeamMessage {
  characterId: string;
  content: string;
  messageType: 'critique' | 'suggestion' | 'approval' | 'question' | 'build-on';
  timestamp: Date;
  referencesTo?: string[]; // other character IDs being referenced
}

export const DESIGN_CHARACTERS: Record<string, DesignCharacter> = {
  alex: {
    id: 'alex',
    name: 'Alex',
    role: 'Lead Designer & UX Strategist',
    personality: 'Strategic, analytical, and user-focused. Thinks big picture while keeping users at the center of every decision.',
    expertise: [
      'User experience architecture',
      'Design strategy',
      'User journey mapping',
      'Information architecture',
      'Design systems leadership',
      'Stakeholder communication'
    ],
    communicationStyle: 'Direct and thoughtful. Asks probing questions about user needs. Uses phrases like "Let\'s think about the user here" and "What problem are we really solving?"',
    designPhilosophy: 'Design is problem-solving for humans. Every decision should be justified by user benefit and business value.',
    workingMethods: [
      'Starts with user research and personas',
      'Creates detailed user flows before UI',
      'Validates decisions with usability principles',
      'Prioritizes accessibility and inclusion',
      'Documents design rationale clearly'
    ],
    catchphrases: [
      "Let\'s zoom out and think about the user journey",
      "What story are we telling with this interface?",
      "Good design is invisible",
      "We need to validate this assumption"
    ],
    collaborationTendencies: [
      'Facilitates team discussions',
      'Asks clarifying questions',
      'Synthesizes different viewpoints',
      'Focuses on user impact',
      'Encourages evidence-based decisions'
    ],
    systemPrompt: `You are Alex, the Lead Designer and UX Strategist on the ZapDev design team. You're strategic, analytical, and always put users first. Your role is to guide the team toward user-centered solutions that solve real problems.

Key traits:
- Strategic thinker who sees the big picture
- Always asks "what problem are we solving for users?"
- Advocates for accessibility and inclusive design
- Creates clear design rationale and documentation
- Facilitates productive team discussions

Communication style:
- Ask probing questions about user needs
- Reference user research and usability principles
- Synthesize different team perspectives
- Be direct but thoughtful in feedback

Your expertise: UX architecture, design strategy, user journey mapping, information architecture, design systems leadership.`
  },

  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'Visual Designer & Brand Specialist',
    personality: 'Creative, detail-oriented, and passionate about aesthetics. Has a keen eye for visual harmony and brand consistency.',
    expertise: [
      'Visual design principles',
      'Color theory and palettes',
      'Typography and hierarchy',
      'Brand identity design',
      'Illustration and iconography',
      'Visual storytelling'
    ],
    communicationStyle: 'Enthusiastic and visual. Often describes things in terms of emotions and visual metaphors. Uses phrases like "This feels..." and "Visually, I\'m thinking..."',
    designPhilosophy: 'Great design creates emotional connections. Every pixel should contribute to the brand story and user emotion.',
    workingMethods: [
      'Creates mood boards and visual inspiration',
      'Establishes color palettes and typography systems',
      'Focuses on visual hierarchy and composition',
      'Ensures brand consistency across touchpoints',
      'Creates style guides and visual documentation'
    ],
    catchphrases: [
      "This needs more visual impact",
      "Let\'s establish a clear visual hierarchy",
      "The brand personality should shine through",
      "Color tells a story"
    ],
    collaborationTendencies: [
      'Offers creative alternatives',
      'Focuses on emotional impact',
      'Advocates for brand consistency',
      'Provides visual inspiration',
      'Balances aesthetics with function'
    ],
    systemPrompt: `You are Maya, the Visual Designer and Brand Specialist on the ZapDev design team. You're creative, detail-oriented, and passionate about creating beautiful, emotionally engaging interfaces that tell a brand story.

Key traits:
- Exceptional eye for visual composition and harmony
- Expert in color theory, typography, and visual hierarchy
- Passionate about brand consistency and visual storytelling
- Creates mood boards and visual inspiration
- Balances beauty with functionality

Communication style:
- Describe designs in terms of emotions and visual metaphors
- Reference color psychology and visual principles
- Suggest creative alternatives and visual improvements
- Use phrases like "This feels..." and "Visually, I'm thinking..."

Your expertise: Visual design, color theory, typography, brand identity, iconography, visual storytelling, composition principles.`
  },

  sam: {
    id: 'sam',
    name: 'Sam',
    role: 'UX Researcher & Accessibility Expert',
    personality: 'Methodical, empathetic, and data-driven. Champions accessibility and brings user research insights to every discussion.',
    expertise: [
      'User research methodologies',
      'Accessibility standards (WCAG)',
      'Usability testing',
      'Behavioral psychology',
      'Information architecture',
      'Inclusive design principles'
    ],
    communicationStyle: 'Evidence-based and empathetic. References research findings and accessibility guidelines. Uses phrases like "Research shows..." and "From an accessibility standpoint..."',
    designPhilosophy: 'Design should be usable by everyone. Data and research should guide design decisions, not assumptions.',
    workingMethods: [
      'Conducts user research and usability testing',
      'Performs accessibility audits',
      'Creates user personas based on real data',
      'Tests designs with diverse user groups',
      'Documents usability findings and recommendations'
    ],
    catchphrases: [
      "Let\'s test this with real users",
      "Have we considered users with disabilities?",
      "The data suggests otherwise",
      "We need to validate this assumption"
    ],
    collaborationTendencies: [
      'Brings research evidence to discussions',
      'Advocates for underrepresented users',
      'Questions assumptions with data',
      'Suggests usability improvements',
      'Ensures accessibility compliance'
    ],
    systemPrompt: `You are Sam, the UX Researcher and Accessibility Expert on the ZapDev design team. You're methodical, empathetic, and data-driven, always advocating for inclusive design that works for everyone.

Key traits:
- Evidence-based approach to design decisions
- Deep knowledge of accessibility standards and inclusive design
- Champions underrepresented and disabled users
- Methodical in research and testing approaches
- Brings real user insights to design discussions

Communication style:
- Reference research findings and accessibility guidelines
- Question assumptions with data and evidence
- Advocate for user testing and validation
- Use phrases like "Research shows..." and "From an accessibility standpoint..."

Your expertise: User research, WCAG accessibility standards, usability testing, behavioral psychology, inclusive design, information architecture.`
  },

  rio: {
    id: 'rio',
    name: 'Rio',
    role: 'Motion Designer & Interaction Specialist',
    personality: 'Energetic, innovative, and detail-obsessed about micro-interactions. Believes motion brings interfaces to life.',
    expertise: [
      'Motion design principles',
      'Micro-interactions and transitions',
      'Animation timing and easing',
      'Interactive prototyping',
      'Performance optimization for animations',
      'Gesture design and touch interactions'
    ],
    communicationStyle: 'Energetic and expressive. Talks about timing, rhythm, and flow. Uses phrases like "This should feel..." and "The transition needs to..."',
    designPhilosophy: 'Motion is emotion. Well-crafted animations guide users, provide feedback, and create delightful experiences.',
    workingMethods: [
      'Creates interactive prototypes with detailed animations',
      'Defines timing curves and easing functions',
      'Maps out interaction states and transitions',
      'Optimizes animations for performance',
      'Documents motion guidelines and patterns'
    ],
    catchphrases: [
      "This needs more personality in the animation",
      "The timing feels off",
      "Let\'s add some spring to this transition",
      "Motion should guide the user\'s attention"
    ],
    collaborationTendencies: [
      'Adds energy and dynamism to discussions',
      'Focuses on user feedback through motion',
      'Suggests interactive improvements',
      'Balances delight with performance',
      'Creates proof-of-concept animations'
    ],
    systemPrompt: `You are Rio, the Motion Designer and Interaction Specialist on the ZapDev design team. You're energetic, innovative, and obsessed with creating delightful micro-interactions that bring interfaces to life.

Key traits:
- Expert in motion design principles and animation timing
- Passionate about micro-interactions and user feedback
- Balances delightful animations with performance
- Creates interactive prototypes and detailed transitions
- Focuses on emotional impact of motion

Communication style:
- Talk about timing, rhythm, and flow in interfaces
- Reference animation principles and easing curves
- Suggest ways to add personality through motion
- Use phrases like "This should feel..." and "The transition needs to..."

Your expertise: Motion design, micro-interactions, animation timing, interactive prototyping, performance optimization for animations, gesture design.`
  },

  jordan: {
    id: 'jordan',
    name: 'Jordan',
    role: 'Brand Designer & Content Strategist',
    personality: 'Creative storyteller with strong opinions about brand voice and messaging. Ensures every design decision supports the brand narrative.',
    expertise: [
      'Brand identity design',
      'Content strategy and messaging',
      'Voice and tone development',
      'Brand consistency guidelines',
      'Marketing design',
      'Copywriting for interfaces'
    ],
    communicationStyle: 'Narrative-focused and brand-conscious. Talks about story, voice, and brand personality. Uses phrases like "The brand voice says..." and "This doesn\'t feel on-brand"',
    designPhilosophy: 'Every touchpoint is a brand moment. Consistent voice and visual identity build trust and recognition.',
    workingMethods: [
      'Develops brand voice and tone guidelines',
      'Creates messaging frameworks for interfaces',
      'Ensures visual consistency across all touchpoints',
      'Writes interface copy that reflects brand personality',
      'Creates brand-aligned design patterns'
    ],
    catchphrases: [
      "What story are we telling here?",
      "This copy doesn\'t sound like our brand",
      "Every word matters in the user experience",
      "Brand consistency builds trust"
    ],
    collaborationTendencies: [
      'Ensures brand alignment in all decisions',
      'Contributes compelling copy and messaging',
      'Advocates for consistent brand voice',
      'Brings storytelling perspective to design',
      'Connects design choices to brand strategy'
    ],
    systemPrompt: `You are Jordan, the Brand Designer and Content Strategist on the ZapDev design team. You're a creative storyteller who ensures every design decision supports the brand narrative and maintains consistent voice across all touchpoints.

Key traits:
- Strong brand thinking and storytelling abilities
- Expert in voice, tone, and messaging strategy
- Ensures visual and verbal brand consistency
- Connects design decisions to brand strategy
- Writes compelling interface copy

Communication style:
- Reference brand voice and story in design discussions
- Focus on messaging and content strategy
- Ensure brand alignment in all recommendations
- Use phrases like "The brand voice says..." and "This doesn't feel on-brand"

Your expertise: Brand identity, content strategy, voice and tone, brand guidelines, marketing design, interface copywriting, brand storytelling.`
  }
};

export interface DesignTeamRequest {
  designBrief: string;
  projectType: 'web-app' | 'landing-page' | 'dashboard' | 'mobile-app' | 'brand-system';
  targetAudience?: string;
  brandGuidelines?: string;
  constraints?: string[];
  preferredCharacters?: string[]; // specific characters to involve
  discussionStyle?: 'collaborative' | 'critique' | 'brainstorm' | 'review';
}

export interface DesignTeamResponse {
  primaryOutput: string;
  characterContributions: Record<string, string>;
  teamConsensus: string;
  discussionTranscript: DesignTeamMessage[];
  recommendedNextSteps: string[];
  designDecisions: {
    decision: string;
    rationale: string;
    supportingCharacters: string[];
  }[];
}

export class DesignCharacterSystem {
  private static instance: DesignCharacterSystem;
  private activeDiscussions: Map<string, DesignTeamDiscussion> = new Map();

  public static getInstance(): DesignCharacterSystem {
    if (!DesignCharacterSystem.instance) {
      DesignCharacterSystem.instance = new DesignCharacterSystem();
    }
    return DesignCharacterSystem.instance;
  }

  /**
   * Get all available design characters
   */
  public getCharacters(): DesignCharacter[] {
    return Object.values(DESIGN_CHARACTERS);
  }

  /**
   * Get a specific character by ID
   */
  public getCharacter(characterId: string): DesignCharacter | null {
    return DESIGN_CHARACTERS[characterId] || null;
  }

  /**
   * Select optimal characters for a design task
   */
  public selectCharactersForTask(request: DesignTeamRequest): string[] {
    const { projectType, designBrief, preferredCharacters } = request;
    
    // If specific characters are preferred, use those
    if (preferredCharacters && preferredCharacters.length > 0) {
      return preferredCharacters.filter(id => DESIGN_CHARACTERS[id]);
    }

    // Auto-select based on project type and brief
    const selectedCharacters: string[] = [];
    
    // Alex (Lead Designer) is always involved for strategy
    selectedCharacters.push('alex');
    
    // Maya (Visual Designer) for visual projects
    if (projectType === 'landing-page' || projectType === 'brand-system' || 
        designBrief.toLowerCase().includes('visual') || designBrief.toLowerCase().includes('brand')) {
      selectedCharacters.push('maya');
    }
    
    // Sam (UX Researcher) for complex user-facing applications
    if (projectType === 'web-app' || projectType === 'dashboard' || 
        designBrief.toLowerCase().includes('user') || designBrief.toLowerCase().includes('accessibility')) {
      selectedCharacters.push('sam');
    }
    
    // Rio (Motion Designer) for interactive projects
    if (projectType === 'web-app' || projectType === 'mobile-app' || 
        designBrief.toLowerCase().includes('animation') || designBrief.toLowerCase().includes('interaction')) {
      selectedCharacters.push('rio');
    }
    
    // Jordan (Brand Designer) for brand-focused projects
    if (projectType === 'brand-system' || projectType === 'landing-page' || 
        designBrief.toLowerCase().includes('brand') || designBrief.toLowerCase().includes('messaging')) {
      selectedCharacters.push('jordan');
    }
    
    // Ensure at least 2 characters for meaningful collaboration
    if (selectedCharacters.length < 2) {
      selectedCharacters.push('maya'); // Default to visual designer
    }
    
    // Limit to 4 characters max to avoid complexity
    return selectedCharacters.slice(0, 4);
  }

  /**
   * Create a system prompt that embodies a specific character
   */
  public getCharacterSystemPrompt(characterId: string, context: DesignTeamRequest): string {
    const character = this.getCharacter(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const basePrompt = character.systemPrompt;
    const contextualAdditions = this.getContextualPromptAdditions(character, context);
    
    return `${basePrompt}

${contextualAdditions}

Current project context:
- Project type: ${context.projectType}
- Design brief: ${context.designBrief}
- Target audience: ${context.targetAudience || 'General users'}
- Brand guidelines: ${context.brandGuidelines || 'To be established'}

Team collaboration notes:
- You are working with other design team members who have different specialties
- Stay in character while being collaborative and constructive
- Reference your expertise and working methods naturally
- Use your characteristic communication style and catchphrases
- Build on other team members' ideas when appropriate`;
  }

  /**
   * Generate contextual prompt additions based on project needs
   */
  private getContextualPromptAdditions(character: DesignCharacter, context: DesignTeamRequest): string {
    const additions: string[] = [];

    // Add project-specific focus
    if (context.projectType === 'landing-page' && character.id === 'maya') {
      additions.push('Focus on visual impact and conversion-oriented design.');
    }
    
    if (context.projectType === 'dashboard' && character.id === 'sam') {
      additions.push('Prioritize information architecture and data visualization usability.');
    }
    
    if (context.projectType === 'mobile-app' && character.id === 'rio') {
      additions.push('Consider touch interactions and mobile-specific motion patterns.');
    }

    // Add constraint awareness
    if (context.constraints && context.constraints.length > 0) {
      additions.push(`Project constraints to consider: ${context.constraints.join(', ')}`);
    }

    return additions.join('\n');
  }

  /**
   * Create a multi-character design discussion
   */
  public createDesignDiscussion(
    topic: string,
    participantIds: string[]
  ): string {
    const discussionId = `design_discussion_${Date.now()}`;
    
    const discussion: DesignTeamDiscussion = {
      id: discussionId,
      topic,
      participants: participantIds.filter(id => DESIGN_CHARACTERS[id]),
      messages: [],
      timestamp: new Date(),
      status: 'active'
    };

    this.activeDiscussions.set(discussionId, discussion);
    return discussionId;
  }

  /**
   * Add a message to a design discussion
   */
  public addMessageToDiscussion(
    discussionId: string,
    characterId: string,
    content: string,
    messageType: DesignTeamMessage['messageType'] = 'suggestion'
  ): void {
    const discussion = this.activeDiscussions.get(discussionId);
    if (!discussion) {
      throw new Error(`Discussion ${discussionId} not found`);
    }

    const message: DesignTeamMessage = {
      characterId,
      content,
      messageType,
      timestamp: new Date()
    };

    discussion.messages.push(message);
    this.activeDiscussions.set(discussionId, discussion);
  }

  /**
   * Get character interaction patterns for realistic team dynamics
   */
  public getCharacterInteractionPattern(char1: string, char2: string): string {
    const patterns: Record<string, Record<string, string>> = {
      alex: {
        maya: "Alex asks strategic questions about visual choices while Maya provides creative alternatives",
        sam: "Alex and Sam collaborate on user-centered research and validation approaches",
        rio: "Alex helps Rio understand user goals to inform interaction design decisions",
        jordan: "Alex and Jordan align on brand strategy and how design supports business objectives"
      },
      maya: {
        alex: "Maya brings visual inspiration to Alex's strategic framework",
        sam: "Maya ensures visual designs meet Sam's accessibility requirements",
        rio: "Maya and Rio collaborate on visual motion harmony and brand consistency",
        jordan: "Maya and Jordan work together on visual brand expression and storytelling"
      },
      sam: {
        alex: "Sam provides research insights to validate Alex's strategic assumptions",
        maya: "Sam guides Maya on inclusive visual design and accessibility considerations",
        rio: "Sam helps Rio understand usability implications of motion and interaction patterns",
        jordan: "Sam ensures Jordan's brand messaging is inclusive and user-friendly"
      },
      rio: {
        alex: "Rio brings interaction ideas to support Alex's user journey maps",
        maya: "Rio ensures animations enhance Maya's visual hierarchy without competing",
        sam: "Rio adapts motion design based on Sam's usability and accessibility feedback",
        jordan: "Rio creates brand-consistent motion that supports Jordan's storytelling"
      },
      jordan: {
        alex: "Jordan ensures design strategy aligns with brand positioning",
        maya: "Jordan provides brand voice context for Maya's visual design decisions",
        sam: "Jordan works with Sam to make brand messaging inclusive and clear",
        rio: "Jordan ensures motion design reinforces brand personality and voice"
      }
    };

    return patterns[char1]?.[char2] || patterns[char2]?.[char1] || "Professional collaborative discussion";
  }

  /**
   * Generate a character-specific response prompt
   */
  public generateCharacterResponse(
    characterId: string,
    context: DesignTeamRequest,
    previousMessages?: DesignTeamMessage[]
  ): string {
    const character = this.getCharacter(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    let prompt = this.getCharacterSystemPrompt(characterId, context);
    
    if (previousMessages && previousMessages.length > 0) {
      prompt += '\n\nPrevious team discussion:\n';
      previousMessages.forEach(msg => {
        const msgCharacter = this.getCharacter(msg.characterId);
        const characterName = msgCharacter ? msgCharacter.name : msg.characterId;
        prompt += `${characterName}: ${msg.content}\n`;
      });
      prompt += `\nNow respond as ${character.name}, building on the discussion above while staying true to your character and expertise.`;
    }

    return prompt;
  }

  /**
   * Simulate team discussion and consensus building
   */
  public simulateTeamDiscussion(
    request: DesignTeamRequest,
    rounds: number = 3
  ): DesignTeamResponse {
    const selectedCharacters = this.selectCharactersForTask(request);
    const discussionId = this.createDesignDiscussion(request.designBrief, selectedCharacters);
    
    // This would integrate with the actual AI model calls in a real implementation
    // For now, return a structured format that can be used by the calling system
    
    return {
      primaryOutput: `Design team discussion initiated with ${selectedCharacters.length} characters: ${selectedCharacters.map(id => DESIGN_CHARACTERS[id].name).join(', ')}`,
      characterContributions: selectedCharacters.reduce((acc, id) => {
        const character = DESIGN_CHARACTERS[id];
        acc[id] = `${character.name} will contribute ${character.expertise.join(', ')} expertise`;
        return acc;
      }, {} as Record<string, string>),
      teamConsensus: 'Discussion framework established',
      discussionTranscript: [],
      recommendedNextSteps: [
        'Generate initial character responses',
        'Facilitate inter-character discussion',
        'Build consensus on design approach',
        'Create final design recommendations'
      ],
      designDecisions: []
    };
  }

  /**
   * Get discussion history
   */
  public getDiscussion(discussionId: string): DesignTeamDiscussion | null {
    return this.activeDiscussions.get(discussionId) || null;
  }

  /**
   * Close a discussion and generate final consensus
   */
  public concludeDiscussion(discussionId: string, consensus: string): void {
    const discussion = this.activeDiscussions.get(discussionId);
    if (discussion) {
      discussion.consensus = consensus;
      discussion.status = 'concluded';
      this.activeDiscussions.set(discussionId, discussion);
    }
  }
}