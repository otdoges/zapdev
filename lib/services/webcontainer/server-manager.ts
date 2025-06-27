import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export interface ServerManagerConfig {
  defaultPort?: number;
  startTimeout?: number;
  fallbackUrl?: string;
}

export interface ServerStatus {
  isRunning: boolean;
  url: string | null;
  port: number | null;
}

export class ServerManager {
  private config: ServerManagerConfig;
  private currentProcess: any = null;
  private serverStatus: ServerStatus = {
    isRunning: false,
    url: null,
    port: null,
  };
  private onOutputCallback?: (output: string) => void;
  private onStatusChangeCallback?: (status: ServerStatus) => void;

  constructor(config: ServerManagerConfig = {}) {
    this.config = {
      defaultPort: 3000,
      startTimeout: 15000,
      fallbackUrl: 'http://localhost:3000',
      ...config,
    };
  }

  setOutputCallback(callback: (output: string) => void): void {
    this.onOutputCallback = callback;
  }

  setStatusChangeCallback(callback: (status: ServerStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  private log(output: string): void {
    if (this.onOutputCallback) {
      this.onOutputCallback(output);
    }
  }

  private updateStatus(updates: Partial<ServerStatus>): void {
    this.serverStatus = { ...this.serverStatus, ...updates };
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.serverStatus);
    }
  }

  async startDevelopmentServer(container: any, command = ['npm', 'run', 'dev']): Promise<void> {
    this.log('🚀 Starting development server...');

    let serverStartTimeout: NodeJS.Timeout | null = null;

    try {
      this.currentProcess = await container.spawn(command[0], command.slice(1));

      // Set up output stream
      this.currentProcess.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this.log(data);

            // Check for common server start patterns
            const dataStr = data.toString();
            if (
              dataStr.includes('Local:') ||
              dataStr.includes('running at') ||
              dataStr.includes('ready in') ||
              dataStr.includes('http://localhost')
            ) {
              // Extract URL from output
              const urlMatch = dataStr.match(/https?:\/\/[^\s]+/);
              if (urlMatch) {
                if (serverStartTimeout) {
                  clearTimeout(serverStartTimeout);
                  serverStartTimeout = null;
                }
                this.updateStatus({
                  isRunning: true,
                  url: urlMatch[0],
                  port: this.extractPortFromUrl(urlMatch[0]),
                });
                this.log(`✅ Server detected at ${urlMatch[0]}`);
              }
            }
          },
        })
      );

      // Set up timeout for server start
      serverStartTimeout = setTimeout(() => {
        this.log('⚠️ Server start timeout - checking default port...');
        // Fallback to default port if server doesn't report URL
        this.updateStatus({
          isRunning: true,
          url: this.config.fallbackUrl!,
          port: this.config.defaultPort!,
        });
        this.log(`🔗 Using fallback URL: ${this.config.fallbackUrl}`);
      }, this.config.startTimeout);

      // Listen for the server-ready event
      const serverReadyHandler = (port: number, url: string) => {
        if (serverStartTimeout) {
          clearTimeout(serverStartTimeout);
          serverStartTimeout = null;
        }
        this.updateStatus({
          isRunning: true,
          url,
          port,
        });
        this.log(`✅ Server ready at ${url}`);
      };

      container.on('server-ready', serverReadyHandler);

      // Monitor process exit
      this.currentProcess.exit.then((exitCode: number) => {
        if (serverStartTimeout) {
          clearTimeout(serverStartTimeout);
        }
        if (exitCode !== 0) {
          this.log(`❌ Dev server exited with code ${exitCode}`);
          this.updateStatus({
            isRunning: false,
            url: null,
            port: null,
          });
        }
      });
    } catch (error) {
      if (serverStartTimeout) {
        clearTimeout(serverStartTimeout);
      }
      errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to start dev server:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ Failed to start server: ${errorMessage}`);
      this.updateStatus({
        isRunning: false,
        url: null,
        port: null,
      });
      throw new Error(`Server start failed: ${errorMessage}`);
    }
  }

  async startHTMLServer(container: any): Promise<void> {
    try {
      this.log('📦 Installing dependencies...');

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

      await this.startDevelopmentServer(container, ['npm', 'run', 'dev']);
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to start HTML server:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ Server error: ${errorMessage}`);
      throw new Error(`Failed to start server: ${errorMessage}`);
    }
  }

  stopServer(): void {
    if (this.currentProcess && this.currentProcess.kill) {
      this.currentProcess.kill();
    }
    this.updateStatus({
      isRunning: false,
      url: null,
      port: null,
    });
    this.log('🛑 Development server stopped');
  }

  getStatus(): ServerStatus {
    return { ...this.serverStatus };
  }

  private extractPortFromUrl(url: string): number | null {
    try {
      const urlObj = new URL(url);
      return urlObj.port ? parseInt(urlObj.port, 10) : null;
    } catch {
      return null;
    }
  }
}