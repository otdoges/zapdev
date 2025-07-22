import * as crypto from 'crypto';
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

interface SandboxSession {
  id: string;
  sandbox: Sandbox;
  createdAt: Date;
  lastUsed: Date;
  userId?: string;
  inUse: boolean;
  expiresAt: Date;
}

interface SessionPool {
  sessions: Map<string, SandboxSession>;
  waitingQueue: Array<{
    resolve: (session: SandboxSession) => void;
    reject: (error: Error) => void;
    userId?: string;
  }>;
}

class E2BService {
  private sessionPool: SessionPool = {
    sessions: new Map(),
    waitingQueue: []
  };
  private readonly MAX_SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly MAX_IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
  private readonly MAX_CONCURRENT_SESSIONS = 20; // Hobby plan limit
  private readonly SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Check if E2B API key is available
    if (!process.env.E2B_API_KEY && !import.meta.env.VITE_E2B_API_KEY) {
      console.warn('E2B API key not found. E2B functionality will be disabled.');
    } else {
      // Start the cleanup timer for expired sessions only if API key is available
      this.startCleanupTimer();
    }
  }

  /**
   * Starts a timer to periodically clean up expired sessions
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.SESSION_CLEANUP_INTERVAL);
  }

  /**
   * Removes expired sessions from the pool
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessionPool.sessions) {
      if (now > session.expiresAt || (!session.inUse && (now.getTime() - session.lastUsed.getTime()) > this.MAX_IDLE_TIMEOUT)) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.destroySession(sessionId);
    }

    console.log(`Cleaned up ${expiredSessions.length} expired E2B sessions`);
  }

  /**
   * Gets or creates an available session for the user
   */
  private async getAvailableSession(userId?: string): Promise<SandboxSession> {
    // First, try to find an available session for this user
    if (userId) {
      for (const session of this.sessionPool.sessions.values()) {
        if (session.userId === userId && !session.inUse && new Date() < session.expiresAt) {
          session.inUse = true;
          session.lastUsed = new Date();
          return session;
        }
      }
    }

    // Then, try to find any available session
    for (const session of this.sessionPool.sessions.values()) {
      if (!session.inUse && new Date() < session.expiresAt && !session.userId) {
        session.inUse = true;
        session.lastUsed = new Date();
        session.userId = userId;
        return session;
      }
    }

    // If no available session and under limit, create a new one
    if (this.sessionPool.sessions.size < this.MAX_CONCURRENT_SESSIONS) {
      return await this.createNewSession(userId);
    }

    // If at limit, wait for a session to become available
    return new Promise<SandboxSession>((resolve, reject) => {
      this.sessionPool.waitingQueue.push({ resolve, reject, userId });
      
      // Set a timeout to prevent waiting indefinitely
      setTimeout(() => {
        const index = this.sessionPool.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index > -1) {
          this.sessionPool.waitingQueue.splice(index, 1);
          reject(new Error('Timeout waiting for available E2B session. Please try again later.'));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Creates a new sandbox session
   */
  private async createNewSession(userId?: string): Promise<SandboxSession> {
    try {
      const apiKey = process.env.E2B_API_KEY || import.meta.env.VITE_E2B_API_KEY;
      if (!apiKey) {
        throw new Error('E2B API key not configured');
      }

      console.log('Creating new E2B sandbox session...');
      const sandbox = await Sandbox.create({
        apiKey,
        timeoutMs: this.MAX_SESSION_DURATION,
      });

      const now = new Date();
      const session: SandboxSession = {
        id: `session_${Date.now()}_${crypto.randomBytes(9).toString('hex')}`,
        sandbox,
        createdAt: now,
        lastUsed: now,
        userId,
        inUse: true,
        expiresAt: new Date(now.getTime() + this.MAX_SESSION_DURATION)
      };

      this.sessionPool.sessions.set(session.id, session);
      console.log(`E2B sandbox session created: ${session.id} (${this.sessionPool.sessions.size}/${this.MAX_CONCURRENT_SESSIONS})`);
      
      return session;
    } catch (error) {
      console.error('Failed to create E2B sandbox session:', error);
      throw error;
    }
  }

  /**
   * Releases a session back to the pool
   */
  private releaseSession(sessionId: string): void {
    const session = this.sessionPool.sessions.get(sessionId);
    if (session) {
      session.inUse = false;
      session.lastUsed = new Date();
      
      // Check if anyone is waiting for a session
      if (this.sessionPool.waitingQueue.length > 0) {
        const waiter = this.sessionPool.waitingQueue.shift();
        if (waiter) {
          session.inUse = true;
          session.userId = waiter.userId;
          waiter.resolve(session);
        }
      }
    }
  }

  /**
   * Destroys a session and removes it from the pool
   */
  private async destroySession(sessionId: string): Promise<void> {
    const session = this.sessionPool.sessions.get(sessionId);
    if (session) {
      try {
        // Explicitly kill the sandbox to free resources immediately
        await session.sandbox.kill();
        this.sessionPool.sessions.delete(sessionId);
        console.log(`Destroyed E2B session: ${sessionId}`);
      } catch (error) {
        console.error(`Error destroying session ${sessionId}:`, error);
        // Even if kill fails, remove from pool to prevent memory leaks
        this.sessionPool.sessions.delete(sessionId);
      }
    }
  }

  async executeCode(code: string, options: E2BExecutionOptions = {}, userId?: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    let session: SandboxSession | null = null;
    
    try {
      if (!this.isAvailable()) {
        throw new Error('E2B API key not configured');
      }

      logs.push('Acquiring E2B sandbox session...');
      session = await this.getAvailableSession(userId);
      logs.push(`Using session: ${session.id}`);

      logs.push('Starting code execution in E2B sandbox...');

      // Install packages if specified
      if (options.installPackages && options.installPackages.length > 0) {
        logs.push(`Installing packages: ${options.installPackages.join(', ')}`);
        for (const pkg of options.installPackages) {
          await session.sandbox.runCode(`!pip install ${pkg}`, { timeoutMs: options.timeout });
        }
      }

      // Execute the code
      logs.push('Executing code...');
      const execution = await session.sandbox.runCode(code, {
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
    } finally {
      // Always release the session back to the pool
      if (session) {
        this.releaseSession(session.id);
        logs.push(`Released session: ${session.id}`);
      }
    }
  }

  async createFile(path: string, content: string, userId?: string): Promise<boolean> {
    let session: SandboxSession | null = null;
    
    try {
      if (!this.isAvailable()) {
        throw new Error('E2B API key not configured');
      }

      session = await this.getAvailableSession(userId);
      await session.sandbox.files.write(path, content);
      return true;
    } catch (error) {
      console.error('Failed to create file:', error);
      return false;
    } finally {
      if (session) {
        this.releaseSession(session.id);
      }
    }
  }

  async readFile(path: string, userId?: string): Promise<string | null> {
    let session: SandboxSession | null = null;
    
    try {
      if (!this.isAvailable()) {
        throw new Error('E2B API key not configured');
      }

      session = await this.getAvailableSession(userId);
      const content = await session.sandbox.files.read(path);
      return content;
    } catch (error) {
      console.error('Failed to read file:', error);
      return null;
    } finally {
      if (session) {
        this.releaseSession(session.id);
      }
    }
  }

  async listFiles(directory = '.', userId?: string): Promise<string[]> {
    let session: SandboxSession | null = null;
    
    try {
      if (!this.isAvailable()) {
        throw new Error('E2B API key not configured');
      }

      session = await this.getAvailableSession(userId);
      const files = await session.sandbox.files.list(directory);
      return files.map(file => file.name);
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    } finally {
      if (session) {
        this.releaseSession(session.id);
      }
    }
  }

  async installPackage(packageName: string, language: 'python' | 'node' = 'python', userId?: string): Promise<ExecutionResult> {
    const command = language === 'python' ? `!pip install ${packageName}` : `!npm install ${packageName}`;
    return this.executeCode(command, { language: 'bash' }, userId);
  }

  async cleanup(): Promise<void> {
    try {
      // Stop cleanup timer
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }

      // Clean up all sessions
      const sessionIds = Array.from(this.sessionPool.sessions.keys());
      for (const sessionId of sessionIds) {
        await this.destroySession(sessionId);
      }

      // Clear waiting queue
      while (this.sessionPool.waitingQueue.length > 0) {
        const waiter = this.sessionPool.waitingQueue.shift();
        if (waiter) {
          waiter.reject(new Error('Service is shutting down'));
        }
      }

      console.log('E2B service cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup E2B service:', error);
    }
  }

  isAvailable(): boolean {
    const apiKey = process.env.E2B_API_KEY || import.meta.env.VITE_E2B_API_KEY;
    return !!apiKey;
  }

  getStatus(): { 
    available: boolean; 
    totalSessions: number; 
    activeSessions: number; 
    waitingQueue: number;
    maxSessions: number;
  } {
    const activeSessions = Array.from(this.sessionPool.sessions.values()).filter(s => s.inUse).length;
    
    return {
      available: this.isAvailable(),
      totalSessions: this.sessionPool.sessions.size,
      activeSessions,
      waitingQueue: this.sessionPool.waitingQueue.length,
      maxSessions: this.MAX_CONCURRENT_SESSIONS,
    };
  }

  /**
   * Gets detailed session information (for debugging)
   */
  getSessionInfo(): Array<{
    id: string;
    userId?: string;
    inUse: boolean;
    createdAt: string;
    lastUsed: string;
    expiresAt: string;
    timeRemaining: number;
  }> {
    const now = new Date();
    
    return Array.from(this.sessionPool.sessions.values()).map(session => ({
      id: session.id,
      userId: session.userId,
      inUse: session.inUse,
      createdAt: session.createdAt.toISOString(),
      lastUsed: session.lastUsed.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      timeRemaining: Math.max(0, session.expiresAt.getTime() - now.getTime())
    }));
  }
}

export const e2bService = new E2BService();
export default e2bService; 