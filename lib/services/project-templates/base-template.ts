import { FileSystemTree } from '../webcontainer/file-manager';

export interface ProjectTemplateConfig {
  name: string;
  type: string;
  version?: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  scripts?: Record<string, string>;
  customFiles?: Record<string, string>;
}

export interface ProjectSetupOptions {
  codeContent?: string;
  instructions?: string;
  customization?: Record<string, any>;
}

export interface ProjectSetupResult {
  success: boolean;
  files: FileSystemTree;
  message: string;
  nextSteps?: string[];
}

export abstract class BaseProjectTemplate {
  protected config: ProjectTemplateConfig;

  constructor(config: ProjectTemplateConfig) {
    this.config = config;
  }

  getInfo(): Pick<ProjectTemplateConfig, 'name' | 'type' | 'description'> {
    return {
      name: this.config.name,
      type: this.config.type,
      description: this.config.description,
    };
  }

  abstract detectProjectType(codeContent: string): boolean;

  abstract generateFiles(options: ProjectSetupOptions): Promise<FileSystemTree>;

  abstract getDefaultDependencies(): string[];

  abstract getDefaultDevDependencies(): string[];

  abstract getDefaultScripts(): Record<string, string>;

  async setupProject(options: ProjectSetupOptions = {}): Promise<ProjectSetupResult> {
    try {
      const files = await this.generateFiles(options);
      
      return {
        success: true,
        files,
        message: `${this.config.name} project setup completed successfully`,
        nextSteps: this.getNextSteps(),
      };
    } catch (error) {
      return {
        success: false,
        files: {},
        message: `Failed to setup ${this.config.name} project: ${error}`,
      };
    }
  }

  protected getNextSteps(): string[] {
    return [
      'Install dependencies with npm install',
      'Start development server with npm run dev',
      'Open browser to view your application',
    ];
  }

  protected createPackageJson(customDeps: string[] = [], customDevDeps: string[] = []): string {
    const dependencies = [...this.getDefaultDependencies(), ...customDeps];
    const devDependencies = [...this.getDefaultDevDependencies(), ...customDevDeps];
    
    const packageJson = {
      name: this.config.name.toLowerCase().replace(/\s+/g, '-'),
      version: this.config.version || '1.0.0',
      type: 'module',
      scripts: {
        ...this.getDefaultScripts(),
        ...this.config.scripts,
      },
      dependencies: dependencies.reduce((acc, dep) => {
        acc[dep] = 'latest';
        return acc;
      }, {} as Record<string, string>),
      devDependencies: devDependencies.reduce((acc, dep) => {
        acc[dep] = 'latest';
        return acc;
      }, {} as Record<string, string>),
    };

    return JSON.stringify(packageJson, null, 2);
  }

  protected analyzeInstructions(instructions: string): {
    hasForm: boolean;
    hasChart: boolean;
    hasList: boolean;
    hasApi: boolean;
    complexity: 'simple' | 'standard' | 'complex';
  } {
    const lower = instructions.toLowerCase();
    
    return {
      hasForm: lower.includes('form'),
      hasChart: lower.includes('chart') || lower.includes('graph'),
      hasList: lower.includes('list') || lower.includes('table'),
      hasApi: lower.includes('api') || lower.includes('server'),
      complexity: lower.includes('simple') ? 'simple' : 
                  lower.includes('complex') || lower.includes('advanced') ? 'complex' : 'standard',
    };
  }
}