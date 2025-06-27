import { WebContainerManager } from './webcontainer/webcontainer-manager';
import { ServerManager } from './webcontainer/server-manager';
import { FileManager } from './webcontainer/file-manager';
import { ProjectSetupService } from './webcontainer/project-setup-service';
import { TemplateRegistry } from './project-templates/template-registry';
import { AITeamCoordinator } from './ai-team/ai-team-coordinator';

export interface ServiceContainer {
  webContainerManager: WebContainerManager;
  serverManager: ServerManager;
  templateRegistry: TemplateRegistry;
  projectSetupService: ProjectSetupService;
  aiTeamCoordinator: AITeamCoordinator;
}

export class DIContainer {
  private services: Map<string, any> = new Map();
  private initialized = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    if (this.initialized) return;

    // Core services
    const templateRegistry = new TemplateRegistry();
    this.services.set('templateRegistry', templateRegistry);

    const webContainerManager = new WebContainerManager();
    this.services.set('webContainerManager', webContainerManager);

    // Dependent services
    const serverManager = new ServerManager();
    this.services.set('serverManager', serverManager);

    this.initialized = true;
  }

  // Create project setup service with dependencies
  createProjectSetupService(config: {
    onOutput?: (output: string) => void;
    onProgress?: (step: string, progress: number) => void;
  } = {}): ProjectSetupService {
    const templateRegistry = this.get<TemplateRegistry>('templateRegistry');
    const webContainerManager = this.get<WebContainerManager>('webContainerManager');

    return new ProjectSetupService({
      templateRegistry,
      webContainerManager,
      ...config,
    });
  }

  // Create AI team coordinator with dependencies
  createAITeamCoordinator(config: {
    onAgentUpdate?: (agents: any[]) => void;
    onOutput?: (output: string) => void;
  } = {}): AITeamCoordinator {
    const projectSetupService = this.createProjectSetupService(config);

    return new AITeamCoordinator({
      projectSetupService,
      ...config,
    });
  }

  // Create file manager with WebContainer instance
  createFileManager(): FileManager | null {
    const webContainerManager = this.get<WebContainerManager>('webContainerManager');
    const instance = webContainerManager.getInstance();
    
    if (!instance) {
      return null;
    }
    
    return new FileManager(instance);
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }
    return service;
  }

  set<T>(serviceName: string, service: T): void {
    this.services.set(serviceName, service);
  }

  has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  // Get all services for debugging/inspection
  getContainer(): ServiceContainer {
    return {
      webContainerManager: this.get('webContainerManager'),
      serverManager: this.get('serverManager'),
      templateRegistry: this.get('templateRegistry'),
      projectSetupService: this.createProjectSetupService(),
      aiTeamCoordinator: this.createAITeamCoordinator(),
    };
  }

  // Cleanup all services
  async cleanup(): Promise<void> {
    const webContainerManager = this.get<WebContainerManager>('webContainerManager');
    await webContainerManager.teardown();
    
    this.services.clear();
    this.initialized = false;
  }
}

// Singleton instance
let containerInstance: DIContainer | null = null;

export function getContainer(): DIContainer {
  if (!containerInstance) {
    containerInstance = new DIContainer();
  }
  return containerInstance;
}

export function resetContainer(): void {
  if (containerInstance) {
    containerInstance.cleanup();
    containerInstance = null;
  }
}