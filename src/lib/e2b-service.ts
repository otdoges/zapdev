import { Sandbox } from '@e2b/code-interpreter';

// PostHog event names for E2B tracking
const E2B_EVENTS = {
  CODE_EXECUTION: 'e2b_code_execution',
  FILE_OPERATION: 'e2b_file_operation', 
  PACKAGE_INSTALLATION: 'e2b_package_installation',
  SERVICE_ERROR: 'e2b_service_error',
} as const;

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

interface E2BMetrics {
  executionsCount: number;
  totalExecutionTime: number;
  errorCount: number;
  lastExecution?: Date;
}

class E2BService {
  private metrics: E2BMetrics = {
    executionsCount: 0,
    totalExecutionTime: 0,
    errorCount: 0
  };

  constructor() {
    // Check if E2B API key is available
    if (!this.isAvailable()) {
      console.warn('E2B API key not found. E2B functionality will be disabled.');
    }
  }

  /**
   * Track E2B usage events for analytics
   */
  private trackEvent(eventName: string, metadata: Record<string, any>): void {
    try {
      // Store event locally for PostHog tracking
      const event = {
        eventName,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          service: 'e2b',
        },
        timestamp: Date.now(),
      };

      // Store in localStorage for backup/offline support
      const existingEvents = JSON.parse(localStorage.getItem('pendingUsageEvents') || '[]');
      existingEvents.push(event);
      localStorage.setItem('pendingUsageEvents', JSON.stringify(existingEvents));

      console.log('E2B event tracked:', event);
    } catch (error) {
      console.error('Error tracking E2B event:', error);
    }
  }

  /**
   * Get E2B API key from environment
   */
  private getApiKey(): string | null {
    return process.env.E2B_API_KEY || import.meta.env?.VITE_E2B_API_KEY || null;
  }

  /**
   * Execute code in a new E2B sandbox
   */
  async executeCode(code: string, options: E2BExecutionOptions = {}): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    
    try {
      if (!this.isAvailable()) {
        throw new Error('E2B API key not configured');
      }

      const apiKey = this.getApiKey()!;
      logs.push('Creating E2B sandbox...');
      
      // Create a new sandbox for each execution (recommended by E2B)
      const sandbox = await Sandbox.create({ 
        apiKey,
        timeoutMs: options.timeout || 30000
      });

      try {
        logs.push('Installing packages if specified...');
        // Install packages if specified
        if (options.installPackages && options.installPackages.length > 0) {
          for (const pkg of options.installPackages) {
            logs.push(`Installing package: ${pkg}`);
            await sandbox.runCode(`!pip install ${pkg}`, { timeoutMs: 30000 });
          }
        }

        logs.push('Executing code...');
        // Execute the main code
        const execution = await sandbox.runCode(code, {
          timeoutMs: options.timeout || 30000,
        });

        const executionTime = Date.now() - startTime;
        logs.push(`Execution completed in ${executionTime}ms`);

        // Update metrics
        this.updateMetrics(executionTime, false);

        // Track successful execution
        this.trackEvent(E2B_EVENTS.CODE_EXECUTION, {
          success: true,
          language: options.language || 'javascript',
          executionTime,
          hasOutput: !!execution.text,
          hasPackageInstallation: !!(options.installPackages && options.installPackages.length > 0),
          packageCount: options.installPackages?.length || 0,
        });

        // Extract output
        let output = '';
        if (execution.text) {
          output = execution.text;
        } else if (execution.logs?.stdout) {
          output = Array.isArray(execution.logs.stdout) 
            ? execution.logs.stdout.join('\n') 
            : execution.logs.stdout;
        } else if (execution.logs?.stderr) {
          output = Array.isArray(execution.logs.stderr) 
            ? execution.logs.stderr.join('\n') 
            : execution.logs.stderr;
        } else {
          output = 'Code executed successfully';
        }

        // Get any output files (this is a simplified version, could be expanded)
        const files: Array<{ name: string; content: string }> = [];

        return {
          success: true,
          output,
          logs,
          files,
          executionTime,
        };

      } finally {
        // Always close the sandbox to free resources
        await sandbox.kill();
        logs.push('Sandbox closed');
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logs.push(`Execution failed after ${executionTime}ms`);
      
      // Update metrics
      this.updateMetrics(executionTime, true);
      
      // Track failed execution
      this.trackEvent(E2B_EVENTS.CODE_EXECUTION, {
        success: false,
        language: options.language || 'javascript',
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        hasPackageInstallation: !!(options.installPackages && options.installPackages.length > 0),
        packageCount: options.installPackages?.length || 0,
      });
      
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        logs,
        executionTime,
      };
    }
  }

  /**
   * Create a file in a sandbox
   */
  async createFile(path: string, content: string): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        throw new Error('E2B API key not configured');
      }

      const apiKey = this.getApiKey()!;
      const sandbox = await Sandbox.create({ apiKey });
      
                   try {
        await sandbox.files.write(path, content);
        
        // Track successful file creation
        this.trackEvent(E2B_EVENTS.FILE_OPERATION, {
          operation: 'create',
          success: true,
          filePath: path,
          contentLength: content.length,
        });
        
        return true;
      } finally {
        await sandbox.kill();
      }
    } catch (error) {
      console.error('Failed to create file:', error);
      
      // Track failed file creation
      this.trackEvent(E2B_EVENTS.FILE_OPERATION, {
        operation: 'create',
        success: false,
        filePath: path,
        contentLength: content.length,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      
      return false;
    }
  }

  /**
   * Read a file from a sandbox
   */
  async readFile(path: string): Promise<string | null> {
    try {
      if (!this.isAvailable()) {
        throw new Error('E2B API key not configured');
      }

      const apiKey = this.getApiKey()!;
      const sandbox = await Sandbox.create({ apiKey });
      
                   try {
        const content = await sandbox.files.read(path);
        
        // Track successful file read
        this.trackEvent(E2B_EVENTS.FILE_OPERATION, {
          operation: 'read',
          success: true,
          filePath: path,
          contentLength: content?.length || 0,
        });
        
        return content;
      } finally {
        await sandbox.kill();
      }
    } catch (error) {
      console.error('Failed to read file:', error);
      
      // Track failed file read
      this.trackEvent(E2B_EVENTS.FILE_OPERATION, {
        operation: 'read',
        success: false,
        filePath: path,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      
      return null;
    }
  }

  /**
   * List files in a directory within a sandbox
   */
  async listFiles(directory = '.'): Promise<string[]> {
    try {
      if (!this.isAvailable()) {
        throw new Error('E2B API key not configured');
      }

      const apiKey = this.getApiKey()!;
      const sandbox = await Sandbox.create({ apiKey });
      
                   try {
        const files = await sandbox.files.list(directory);
        const fileNames = files.map(file => file.name);
        
        // Track successful file listing
        this.trackEvent(E2B_EVENTS.FILE_OPERATION, {
          operation: 'list',
          success: true,
          directory,
          fileCount: fileNames.length,
        });
        
        return fileNames;
      } finally {
        await sandbox.kill();
      }
    } catch (error) {
      console.error('Failed to list files:', error);
      
      // Track failed file listing
      this.trackEvent(E2B_EVENTS.FILE_OPERATION, {
        operation: 'list',
        success: false,
        directory,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      
      return [];
    }
  }

  /**
   * Install a package in a sandbox
   */
  async installPackage(packageName: string, language: 'python' | 'node' = 'python'): Promise<ExecutionResult> {
    const command = language === 'python' ? `!pip install ${packageName}` : `!npm install ${packageName}`;
    
    // Track package installation attempt
    this.trackEvent(E2B_EVENTS.PACKAGE_INSTALLATION, {
      packageName,
      language,
      command,
    });
    
    return this.executeCode(command, { language: 'bash' });
  }

  /**
   * Update execution metrics
   */
  private updateMetrics(executionTime: number, isError: boolean): void {
    this.metrics.executionsCount++;
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.lastExecution = new Date();
    
    if (isError) {
      this.metrics.errorCount++;
    }
  }

  /**
   * Check if E2B is available
   */
  isAvailable(): boolean {
    return !!this.getApiKey();
  }

  /**
   * Get service status and metrics
   */
  getStatus(): { 
    available: boolean; 
    metrics: E2BMetrics;
    averageExecutionTime: number;
    errorRate: number;
  } {
    const averageExecutionTime = this.metrics.executionsCount > 0 
      ? this.metrics.totalExecutionTime / this.metrics.executionsCount 
      : 0;
    
    const errorRate = this.metrics.executionsCount > 0 
      ? (this.metrics.errorCount / this.metrics.executionsCount) * 100 
      : 0;
    
    return {
      available: this.isAvailable(),
      metrics: { ...this.metrics },
      averageExecutionTime,
      errorRate,
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      executionsCount: 0,
      totalExecutionTime: 0,
      errorCount: 0
    };
  }
}

export const e2bService = new E2BService();
export default e2bService; 