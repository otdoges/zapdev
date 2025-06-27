import { WebContainerManager } from './webcontainer-manager';
import { FileManager } from './file-manager';
import { ServerManager } from './server-manager';
import { TemplateRegistry } from '../project-templates/template-registry';
import { ProjectSetupOptions, ProjectSetupResult } from '../project-templates/base-template';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export interface ProjectSetupServiceConfig {
  templateRegistry?: TemplateRegistry;
  webContainerManager?: WebContainerManager;
  onOutput?: (output: string) => void;
  onProgress?: (step: string, progress: number) => void;
}

export class ProjectSetupService {
  private templateRegistry: TemplateRegistry;
  private webContainerManager: WebContainerManager;
  private fileManager: FileManager | null = null;
  private serverManager: ServerManager;
  private onOutput?: (output: string) => void;
  private onProgress?: (step: string, progress: number) => void;

  constructor(config: ProjectSetupServiceConfig = {}) {
    this.templateRegistry = config.templateRegistry || new TemplateRegistry();
    this.webContainerManager = config.webContainerManager || new WebContainerManager();
    this.serverManager = new ServerManager();
    this.onOutput = config.onOutput;
    this.onProgress = config.onProgress;

    // Set up server manager callbacks
    if (this.onOutput) {
      this.serverManager.setOutputCallback(this.onOutput);
    }
  }

  private log(message: string): void {
    if (this.onOutput) {
      this.onOutput(`${new Date().toLocaleTimeString()}: ${message}`);
    }
  }

  private updateProgress(step: string, progress: number): void {
    if (this.onProgress) {
      this.onProgress(step, progress);
    }
  }

  async setupProject(
    projectType: string | undefined,
    options: ProjectSetupOptions
  ): Promise<ProjectSetupResult> {
    try {
      this.log('🚀 Starting project setup...');
      this.updateProgress('Initializing', 0);

      // Step 1: Initialize WebContainer
      this.log('🔄 Initializing WebContainer...');
      const container = await this.webContainerManager.initialize();
      this.fileManager = new FileManager(container);
      this.updateProgress('WebContainer initialized', 20);

      // Step 2: Generate project files using template
      this.log('📁 Generating project files...');
      const setupResult = await this.templateRegistry.setupProject(projectType, options);
      
      if (!setupResult.success) {
        throw new Error(setupResult.message);
      }

      this.updateProgress('Files generated', 40);

      // Step 3: Mount files to WebContainer
      this.log('📄 Mounting files to WebContainer...');
      await this.fileManager.mountFiles(setupResult.files);
      this.updateProgress('Files mounted', 60);

      // Step 4: Install dependencies
      this.log('📦 Installing dependencies...');
      await this.installDependencies(container);
      this.updateProgress('Dependencies installed', 80);

      // Step 5: Start development server
      this.log('🚀 Starting development server...');
      await this.startServer(projectType);
      this.updateProgress('Server started', 100);

      this.log('✅ Project setup completed successfully!');

      return {
        ...setupResult,
        message: 'Project setup completed successfully',
      };

    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Project setup failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ Setup failed: ${errorMessage}`);
      
      return {
        success: false,
        files: {},
        message: `Project setup failed: ${errorMessage}`,
      };
    }
  }

  private async installDependencies(container: any): Promise<void> {
    try {
      // Try pnpm first, fallback to npm
      try {
        await container.spawn('corepack', ['enable']);
        await container.spawn('corepack', ['prepare', 'pnpm@latest', '--activate']);

        const installProcess = await container.spawn('pnpm', ['install', '--prefer-frozen-lockfile']);
        installProcess.output.pipeTo(
          new WritableStream({
            write: (data) => this.log(data),
          })
        );

        const exitCode = await installProcess.exit;
        if (exitCode !== 0) {
          throw new Error(`pnpm install failed with exit code ${exitCode}`);
        }

        this.log('✅ Dependencies installed successfully with pnpm');
      } catch (pnpmError) {
        this.log('⚠️ pnpm setup failed, falling back to npm...');

        const installProcess = await container.spawn('npm', ['install']);
        installProcess.output.pipeTo(
          new WritableStream({
            write: (data) => this.log(data),
          })
        );

        const exitCode = await installProcess.exit;
        if (exitCode !== 0) {
          throw new Error(`npm install failed with exit code ${exitCode}`);
        }

        this.log('✅ Dependencies installed successfully with npm');
      }
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to install dependencies:', error);
      throw error;
    }
  }

  private async startServer(projectType?: string): Promise<void> {
    const container = this.webContainerManager.getInstance();
    if (!container) {
      throw new Error('WebContainer not initialized');
    }

    if (projectType === 'html') {
      await this.serverManager.startHTMLServer(container);
    } else {
      await this.serverManager.startDevelopmentServer(container);
    }
  }

  getServerStatus() {
    return this.serverManager.getStatus();
  }

  stopServer(): void {
    this.serverManager.stopServer();
  }

  async teardown(): Promise<void> {
    this.stopServer();
    await this.webContainerManager.teardown();
  }

  getAvailableTemplates() {
    return this.templateRegistry.getTemplateInfo();
  }

  detectProjectType(codeContent: string) {
    return this.templateRegistry.detectProjectType(codeContent).getInfo();
  }
}