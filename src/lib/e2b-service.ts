import { Sandbox } from '@e2b/code-interpreter';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  logs: string[];
  files?: Array<{ name: string; content: string }>;
  executionTime: number;
}

export interface E2BExecutionOptions {
  language?: 'python' | 'javascript' | 'typescript' | 'bash';
  timeout?: number;
  installPackages?: string[];
}

class E2BService {
  private sandbox: Sandbox | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Check if E2B API key is available
    if (!process.env.E2B_API_KEY && !import.meta.env.VITE_E2B_API_KEY) {
      console.warn('E2B API key not found. E2B functionality will be disabled.');
    }
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    if (this.initializationPromise) {
      await this.initializationPromise;
      return this.isInitialized;
    }

    this.initializationPromise = this._initialize();
    await this.initializationPromise;
    return this.isInitialized;
  }

  private async _initialize(): Promise<void> {
    try {
      const apiKey = process.env.E2B_API_KEY || import.meta.env.VITE_E2B_API_KEY;
      if (!apiKey) {
        throw new Error('E2B API key not configured');
      }

      console.log('Initializing E2B sandbox...');
      this.sandbox = await Sandbox.create({
        apiKey,
        timeoutMs: 300000, // 5 minutes
      });
      
      this.isInitialized = true;
      console.log('E2B sandbox initialized successfully');
    } catch (error) {
      console.error('Failed to initialize E2B sandbox:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async executeCode(code: string, options: E2BExecutionOptions = {}): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    
    try {
      if (!await this.initialize()) {
        throw new Error('E2B sandbox not available');
      }

      if (!this.sandbox) {
        throw new Error('Sandbox not initialized');
      }

      logs.push('Starting code execution in E2B sandbox...');

      // Install packages if specified
      if (options.installPackages && options.installPackages.length > 0) {
        logs.push(`Installing packages: ${options.installPackages.join(', ')}`);
        for (const pkg of options.installPackages) {
          await this.sandbox.runCode(`!pip install ${pkg}`, { timeoutMs: options.timeout });
        }
      }

      // Execute the code
      logs.push('Executing code...');
      const execution = await this.sandbox.runCode(code, {
        timeoutMs: options.timeout || 30000,
      });

      const executionTime = Date.now() - startTime;
      logs.push(`Execution completed in ${executionTime}ms`);

      // Get any output files
      const files: Array<{ name: string; content: string }> = [];
      
      const logOutput = execution.logs?.stdout 
        ? (Array.isArray(execution.logs.stdout) ? execution.logs.stdout.join('\n') : execution.logs.stdout)
        : execution.logs?.stderr 
        ? (Array.isArray(execution.logs.stderr) ? execution.logs.stderr.join('\n') : execution.logs.stderr)
        : '';
      
      return {
        success: true,
        output: execution.text || logOutput || 'Code executed successfully',
        logs,
        files,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logs.push(`Execution failed after ${executionTime}ms`);
      
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        logs,
        executionTime,
      };
    }
  }

  async createFile(path: string, content: string): Promise<boolean> {
    try {
      if (!await this.initialize()) {
        throw new Error('E2B sandbox not available');
      }

      if (!this.sandbox) {
        throw new Error('Sandbox not initialized');
      }

      await this.sandbox.files.write(path, content);
      return true;
    } catch (error) {
      console.error('Failed to create file:', error);
      return false;
    }
  }

  async readFile(path: string): Promise<string | null> {
    try {
      if (!await this.initialize()) {
        throw new Error('E2B sandbox not available');
      }

      if (!this.sandbox) {
        throw new Error('Sandbox not initialized');
      }

      const content = await this.sandbox.files.read(path);
      return content;
    } catch (error) {
      console.error('Failed to read file:', error);
      return null;
    }
  }

  async listFiles(directory = '.'): Promise<string[]> {
    try {
      if (!await this.initialize()) {
        throw new Error('E2B sandbox not available');
      }

      if (!this.sandbox) {
        throw new Error('Sandbox not initialized');
      }

      const files = await this.sandbox.files.list(directory);
      return files.map(file => file.name);
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  async installPackage(packageName: string, language: 'python' | 'node' = 'python'): Promise<ExecutionResult> {
    const command = language === 'python' ? `!pip install ${packageName}` : `!npm install ${packageName}`;
    return this.executeCode(command);
  }

  async cleanup(): Promise<void> {
    try {
      if (this.sandbox) {
        // E2B sandboxes auto-cleanup, but we can kill if needed
        this.sandbox = null;
      }
      this.isInitialized = false;
      this.initializationPromise = null;
    } catch (error) {
      console.error('Failed to cleanup E2B sandbox:', error);
    }
  }

  isAvailable(): boolean {
    const apiKey = process.env.E2B_API_KEY || import.meta.env.VITE_E2B_API_KEY;
    return !!apiKey;
  }

  getStatus(): { available: boolean; initialized: boolean; sandboxId?: string } {
    return {
      available: this.isAvailable(),
      initialized: this.isInitialized,
      sandboxId: this.sandbox ? 'sandbox-active' : undefined,
    };
  }
}

export const e2bService = new E2BService();
export default e2bService; 