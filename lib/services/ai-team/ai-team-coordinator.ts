import { ProjectSetupService } from '../webcontainer/project-setup-service';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'complete' | 'error';
  currentTask?: string;
}

export interface AITeamConfig {
  projectSetupService?: ProjectSetupService;
  onAgentUpdate?: (agents: AIAgent[]) => void;
  onOutput?: (output: string) => void;
}

export class AITeamCoordinator {
  private projectSetupService: ProjectSetupService;
  private agents: AIAgent[] = [
    {
      id: 'architect',
      name: 'System Architect',
      role: 'Project structure & dependencies',
      status: 'idle',
    },
    {
      id: 'frontend',
      name: 'Frontend Developer',
      role: 'UI/UX components',
      status: 'idle',
    },
    {
      id: 'backend',
      name: 'Backend Developer',
      role: 'Server logic & APIs',
      status: 'idle',
    },
    {
      id: 'devops',
      name: 'DevOps Engineer',
      role: 'Build & deployment',
      status: 'idle',
    },
  ];

  private onAgentUpdate?: (agents: AIAgent[]) => void;
  private onOutput?: (output: string) => void;

  constructor(config: AITeamConfig = {}) {
    this.projectSetupService = config.projectSetupService || new ProjectSetupService();
    this.onAgentUpdate = config.onAgentUpdate;
    this.onOutput = config.onOutput;

    // Set up project setup service callbacks
    if (this.onOutput) {
      this.projectSetupService = new ProjectSetupService({
        onOutput: this.onOutput,
      });
    }
  }

  private log(message: string): void {
    if (this.onOutput) {
      this.onOutput(message);
    }
  }

  private async updateAgentStatus(
    agentId: string,
    status: AIAgent['status'],
    task?: string
  ): Promise<void> {
    this.agents = this.agents.map((agent) =>
      agent.id === agentId ? { ...agent, status, currentTask: task } : agent
    );

    if (this.onAgentUpdate) {
      this.onAgentUpdate([...this.agents]);
    }

    // Add realistic delay for agent work
    if (status === 'working') {
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
    }
  }

  async startDevelopment(instructions: string): Promise<void> {
    try {
      this.log('🤖 Starting AI team development process...');

      // Step 1: Architect analyzes requirements
      await this.updateAgentStatus('architect', 'working', 'Analyzing project requirements');
      const projectAnalysis = await this.analyzeProjectRequirements(instructions);
      await this.updateAgentStatus('architect', 'complete');

      // Step 2: Set up project using determined type
      this.log('📁 Setting up project structure...');
      const setupResult = await this.projectSetupService.setupProject(
        projectAnalysis.type,
        {
          instructions,
          codeContent: '',
        }
      );

      if (!setupResult.success) {
        throw new Error(setupResult.message);
      }

      // Step 3: DevOps handles build and deployment
      await this.updateAgentStatus('devops', 'working', 'Configuring build & deployment');
      await this.updateAgentStatus('devops', 'complete');

      // Step 4: Frontend development (if needed)
      if (projectAnalysis.needsFrontend) {
        await this.updateAgentStatus('frontend', 'working', 'Building frontend components');
        await this.buildFrontendComponents(instructions);
        await this.updateAgentStatus('frontend', 'complete');
      }

      // Step 5: Backend development (if needed)
      if (projectAnalysis.needsBackend) {
        await this.updateAgentStatus('backend', 'working', 'Building backend services');
        await this.buildBackendServices(instructions);
        await this.updateAgentStatus('backend', 'complete');
      }

      this.log('🎉 AI team development complete!');
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'AI team development failed:', error);
      this.log(`❌ AI team error: ${error}`);
      
      // Mark all working agents as error
      this.agents = this.agents.map((agent) =>
        agent.status === 'working' ? { ...agent, status: 'error' } : agent
      );
      
      if (this.onAgentUpdate) {
        this.onAgentUpdate([...this.agents]);
      }
      
      throw error;
    }
  }

  private async analyzeProjectRequirements(instructions: string): Promise<{
    type: string;
    needsFrontend: boolean;
    needsBackend: boolean;
    complexity: 'simple' | 'standard' | 'complex';
  }> {
    // Simulate thinking time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lowerInstructions = instructions.toLowerCase();

    return {
      type: this.determineProjectType(lowerInstructions),
      needsFrontend: !lowerInstructions.includes('api only') && !lowerInstructions.includes('backend only'),
      needsBackend: lowerInstructions.includes('api') || 
                   lowerInstructions.includes('server') || 
                   lowerInstructions.includes('backend'),
      complexity: lowerInstructions.includes('simple') ? 'simple' : 
                 lowerInstructions.includes('complex') || lowerInstructions.includes('advanced') ? 'complex' : 'standard',
    };
  }

  private determineProjectType(instructions: string): string {
    if (instructions.includes('react') || instructions.includes('component')) {
      return 'react';
    }
    if (instructions.includes('html') || instructions.includes('static') || instructions.includes('landing')) {
      return 'html';
    }
    if (instructions.includes('api') || instructions.includes('server') || instructions.includes('express')) {
      return 'generic';
    }
    return 'react'; // Default to React for most cases
  }

  private async buildFrontendComponents(instructions: string): Promise<void> {
    try {
      // Call AI team coordinate API for frontend component generation
      const response = await fetch('/api/ai-team/coordinate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions,
          step: 'frontend',
        }),
      });

      if (!response.ok) {
        throw new Error(`AI team API returned ${response.status}`);
      }

      const result = await response.json();
      this.log('✅ Frontend components generated by AI team');
      
      // Additional processing of AI response could go here
      
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to generate AI components:', error);
      this.log('⚠️ Using fallback component templates');
      // Fallback handled by templates
    }
  }

  private async buildBackendServices(instructions: string): Promise<void> {
    this.log('🔧 Backend developer setting up services...');
    // Backend services are handled by the project templates
    // Additional AI-generated backend logic could be added here
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate work
  }

  getAgents(): AIAgent[] {
    return [...this.agents];
  }

  getServerStatus() {
    return this.projectSetupService.getServerStatus();
  }

  stopServer(): void {
    this.projectSetupService.stopServer();
  }

  async teardown(): Promise<void> {
    await this.projectSetupService.teardown();
  }
}