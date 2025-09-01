/**
 * MCP Sequential Thinking Service
 * 
 * Integrates with the Model Context Protocol Sequential Thinking server
 * to provide dynamic and reflective problem-solving capabilities.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPThoughtRequest {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded?: boolean;
  context?: {
    query: string;
    previousThoughts: string[];
    searchEnabled: boolean;
  };
}

export interface MCPThoughtResponse {
  thought: string;
  nextThoughtNeeded: boolean;
  adjustedTotalThoughts?: number;
  alternatives?: string[];
  confidence?: number;
  revision?: string;
  branchSuggestion?: {
    reason: string;
    alternativeApproach: string;
  };
}

export interface MCPConnection {
  process: ChildProcess | null;
  ready: boolean;
  messageId: number;
  pendingRequests: Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>;
}

export class SequentialThinkingService extends EventEmitter {
  private connection: MCPConnection;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor() {
    super();
    this.connection = {
      process: null,
      ready: false,
      messageId: 0,
      pendingRequests: new Map()
    };
  }

  /**
   * Initialize the MCP Sequential Thinking server connection
   */
  async initialize(): Promise<void> {
    if (this.connection.ready) {
      return; // Already initialized
    }

    try {
      await this.startMCPServer();
      await this.waitForReady();
      console.log('[MCP] Sequential Thinking service initialized successfully');
    } catch (error) {
      console.error('[MCP] Failed to initialize Sequential Thinking service:', error);
      throw new Error(`MCP initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start the MCP Sequential Thinking server process
   */
  private async startMCPServer(): Promise<void> {
    try {
      // Use npx to run the MCP server
      this.connection.process = spawn('npx', [
        '@modelcontextprotocol/server-sequential-thinking'
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Disable thought logging if privacy is a concern
          DISABLE_THOUGHT_LOGGING: process.env.DISABLE_THOUGHT_LOGGING || 'false'
        }
      });

      if (!this.connection.process) {
        throw new Error('Failed to spawn MCP server process');
      }

      // Handle process events
      this.connection.process.on('error', (error) => {
        console.error('[MCP] Server process error:', error);
        this.emit('error', error);
      });

      this.connection.process.on('exit', (code, signal) => {
        console.warn(`[MCP] Server process exited with code ${code}, signal ${signal}`);
        this.connection.ready = false;
        this.emit('disconnect');
      });

      // Handle stdout messages (MCP protocol)
      this.connection.process.stdout?.on('data', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMCPMessage(message);
        } catch (error) {
          console.warn('[MCP] Failed to parse message:', data.toString());
        }
      });

      // Handle stderr for debugging
      this.connection.process.stderr?.on('data', (data) => {
        console.debug('[MCP] Server stderr:', data.toString());
      });

    } catch (error) {
      throw new Error(`Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for the MCP server to be ready
   */
  private async waitForReady(timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('MCP server initialization timeout'));
      }, timeout);

      const checkReady = () => {
        if (this.connection.ready) {
          clearTimeout(timeoutId);
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };

      // Send initialization message to server
      this.sendMCPMessage({
        jsonrpc: '2.0',
        id: this.getNextMessageId(),
        method: 'initialize',
        params: {
          protocolVersion: '1.0',
          clientInfo: {
            name: 'groq-sequential-thinking',
            version: '1.0.0'
          }
        }
      });

      checkReady();
    });
  }

  /**
   * Process a thought using MCP Sequential Thinking
   */
  async processThought(request: MCPThoughtRequest): Promise<MCPThoughtResponse> {
    if (!this.connection.ready) {
      throw new Error('MCP service not initialized. Call initialize() first.');
    }

    const messageId = this.getNextMessageId();
    
    // Send thought processing request
    const mcpRequest = {
      jsonrpc: '2.0',
      id: messageId,
      method: 'tools/call',
      params: {
        name: 'sequential-thinking',
        arguments: {
          thought: request.thought,
          thoughtNumber: request.thoughtNumber,
          totalThoughts: request.totalThoughts,
          nextThoughtNeeded: request.nextThoughtNeeded ?? true,
          context: JSON.stringify(request.context || {})
        }
      }
    };

    return this.sendMCPRequest(mcpRequest);
  }

  /**
   * Request thought revision using MCP
   */
  async requestRevision(
    originalThought: string, 
    revisionReason: string, 
    context?: any
  ): Promise<string> {
    if (!this.connection.ready) {
      throw new Error('MCP service not initialized');
    }

    const messageId = this.getNextMessageId();
    
    const mcpRequest = {
      jsonrpc: '2.0',
      id: messageId,
      method: 'tools/call',
      params: {
        name: 'revise-thought',
        arguments: {
          originalThought,
          revisionReason,
          context: JSON.stringify(context || {})
        }
      }
    };

    const response = await this.sendMCPRequest(mcpRequest);
    return response.revisedThought || originalThought;
  }

  /**
   * Create a branching path for alternative reasoning
   */
  async createBranch(
    branchPoint: string,
    alternativeApproach: string,
    context?: any
  ): Promise<{branchId: string, initialThought: string}> {
    if (!this.connection.ready) {
      throw new Error('MCP service not initialized');
    }

    const messageId = this.getNextMessageId();
    
    const mcpRequest = {
      jsonrpc: '2.0',
      id: messageId,
      method: 'tools/call',
      params: {
        name: 'create-branch',
        arguments: {
          branchPoint,
          alternativeApproach,
          context: JSON.stringify(context || {})
        }
      }
    };

    const response = await this.sendMCPRequest(mcpRequest);
    return {
      branchId: response.branchId || `branch_${Date.now()}`,
      initialThought: response.initialThought || alternativeApproach
    };
  }

  /**
   * Send MCP request and wait for response
   */
  private async sendMCPRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.connection.pendingRequests.delete(request.id);
        reject(new Error('MCP request timeout'));
      }, this.REQUEST_TIMEOUT);

      this.connection.pendingRequests.set(request.id, {
        resolve,
        reject,
        timeout
      });

      this.sendMCPMessage(request);
    });
  }

  /**
   * Send message to MCP server
   */
  private sendMCPMessage(message: any): void {
    if (!this.connection.process?.stdin) {
      throw new Error('MCP server process not available');
    }

    const messageString = JSON.stringify(message) + '\n';
    this.connection.process.stdin.write(messageString);
  }

  /**
   * Handle incoming MCP messages
   */
  private handleMCPMessage(message: any): void {
    // Handle initialization response
    if (message.id && message.method === 'initialize') {
      this.connection.ready = true;
      return;
    }

    // Handle response to pending request
    if (message.id && this.connection.pendingRequests.has(message.id)) {
      const pending = this.connection.pendingRequests.get(message.id)!;
      clearTimeout(pending.timeout);
      this.connection.pendingRequests.delete(message.id);

      if (message.error) {
        pending.reject(new Error(message.error.message || 'MCP request failed'));
      } else {
        // Process the response based on the tool call result
        const result = this.processMCPResult(message.result);
        pending.resolve(result);
      }
      return;
    }

    // Handle server notifications
    if (message.method) {
      this.emit('notification', message);
    }
  }

  /**
   * Process MCP tool call result into our format
   */
  private processMCPResult(result: any): MCPThoughtResponse {
    if (!result) {
      throw new Error('Empty MCP result');
    }

    // Extract thought processing results
    const content = result.content?.[0]?.text || result.text || '';
    
    try {
      // Try to parse as JSON if it looks like structured data
      if (content.startsWith('{')) {
        const parsed = JSON.parse(content);
        return {
          thought: parsed.thought || '',
          nextThoughtNeeded: parsed.nextThoughtNeeded ?? true,
          adjustedTotalThoughts: parsed.adjustedTotalThoughts,
          alternatives: parsed.alternatives || [],
          confidence: parsed.confidence,
          revision: parsed.revision,
          branchSuggestion: parsed.branchSuggestion
        };
      }
    } catch (error) {
      // If JSON parsing fails, treat as plain text
    }

    // Default processing for plain text responses
    return {
      thought: content,
      nextThoughtNeeded: !content.toLowerCase().includes('final') && 
                         !content.toLowerCase().includes('complete'),
      confidence: this.estimateConfidence(content),
      alternatives: []
    };
  }

  /**
   * Estimate confidence based on content analysis
   */
  private estimateConfidence(content: string): number {
    const confidenceIndicators = {
      high: ['certain', 'definitely', 'clearly', 'obviously', 'proven'],
      medium: ['likely', 'probably', 'appears', 'seems', 'suggests'],
      low: ['uncertain', 'unclear', 'maybe', 'might', 'possibly', 'perhaps']
    };

    const lowerContent = content.toLowerCase();
    
    let score = 75; // Default medium confidence
    
    confidenceIndicators.high.forEach(word => {
      if (lowerContent.includes(word)) score += 5;
    });
    
    confidenceIndicators.low.forEach(word => {
      if (lowerContent.includes(word)) score -= 5;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get next message ID for MCP protocol
   */
  private getNextMessageId(): number {
    return ++this.connection.messageId;
  }

  /**
   * Clean shutdown of MCP service
   */
  async shutdown(): Promise<void> {
    if (this.connection.process) {
      // Cancel all pending requests
      this.connection.pendingRequests.forEach(({ reject, timeout }) => {
        clearTimeout(timeout);
        reject(new Error('Service shutting down'));
      });
      this.connection.pendingRequests.clear();

      // Terminate the process
      this.connection.process.kill('SIGTERM');
      
      // Wait for process to exit
      await new Promise<void>((resolve) => {
        if (this.connection.process) {
          this.connection.process.on('exit', () => resolve());
          setTimeout(() => {
            if (this.connection.process) {
              this.connection.process.kill('SIGKILL');
            }
            resolve();
          }, 5000);
        } else {
          resolve();
        }
      });

      this.connection.process = null;
    }

    this.connection.ready = false;
    console.log('[MCP] Sequential Thinking service shut down');
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return this.connection.ready;
  }

  /**
   * Get service status information
   */
  getStatus(): {
    ready: boolean;
    processId?: number;
    pendingRequests: number;
    uptime?: number;
  } {
    return {
      ready: this.connection.ready,
      processId: this.connection.process?.pid,
      pendingRequests: this.connection.pendingRequests.size,
    };
  }
}

// Export singleton instance
let sequentialThinkingServiceInstance: SequentialThinkingService | null = null;

export function getSequentialThinkingService(): SequentialThinkingService {
  if (!sequentialThinkingServiceInstance) {
    sequentialThinkingServiceInstance = new SequentialThinkingService();
  }
  return sequentialThinkingServiceInstance;
}

/**
 * Initialize MCP service on module load for better performance
 */
if (process.env.NODE_ENV !== 'test') {
  // Initialize service in background, but don't block module loading
  const service = getSequentialThinkingService();
  service.initialize().catch(error => {
    console.warn('[MCP] Background initialization failed:', error);
    // Service can still be initialized later on first use
  });

  // Graceful shutdown on process termination
  process.on('SIGTERM', async () => {
    if (sequentialThinkingServiceInstance) {
      await sequentialThinkingServiceInstance.shutdown();
    }
  });

  process.on('SIGINT', async () => {
    if (sequentialThinkingServiceInstance) {
      await sequentialThinkingServiceInstance.shutdown();
    }
  });
}