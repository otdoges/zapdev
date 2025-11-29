import { ScrapybaraClient as ScrapybaraSDKClient } from "scrapybara";
import { z } from "zod";

const SCRAPYBARA_API_KEY = process.env.SCRAPYBARA_API_KEY;

export const ScrapybaraSandboxSchema = z.object({
  id: z.string(),
  status: z.enum(["starting", "running", "stopped", "failed"]),
  url: z.string().optional(),
});

export type ScrapybaraSandbox = z.infer<typeof ScrapybaraSandboxSchema>;

// TypeScript interfaces for Scrapybara SDK types
// BashResponse from Scrapybara SDK
export interface BashResponse {
  output?: string;
  error?: string;
  base64Image?: string;
  system?: string;
}

// Our normalized result type
/**
 * Result from bash command execution in Scrapybara sandbox.
 *
 * IMPORTANT: The Scrapybara SDK does not expose real process exit codes.
 * The `exitCode` field is an approximation derived solely from the presence
 * of an `error` field in the SDK response:
 * - exitCode = 1 if result.error is present
 * - exitCode = 0 if result.error is absent
 *
 * This is inaccurate because:
 * - Commands may fail with exit codes other than 1
 * - Commands may write to stderr without failing
 * - Commands may succeed (exit 0) but still populate the error field
 *
 * For more accurate exit-code handling, use the `rawResult` field to
 * access the original SDK response and implement custom logic based on
 * your specific command requirements.
 */
export interface BashResult {
  stdout: string;
  stderr: string;
  /**
   * Approximated exit code. Only reliable for success (0) vs failure (1).
   * See interface JSDoc for limitations.
   */
  exitCode: number;
  /**
   * Raw Scrapybara SDK response for advanced exit-code handling.
   * Contains: { output?: string; error?: string; base64Image?: string; system?: string }
   */
  rawResult: BashResponse;
}

export interface ScrapybaraInstance {
  id: string;
  bash(options: { command: string }): Promise<BashResponse>;
  stop(): Promise<void>;
  getStreamUrl(): Promise<{ streamUrl: string }>;
}

// Command allowlist for security - only allow safe commands
// IMPORTANT: Never pass unsanitized user input to runCommand!
const ALLOWED_COMMAND_PATTERNS = [
  /^echo\s+/, // Echo commands for logging
  /^ls\s+/, // List files
  /^pwd$/, // Print working directory
  /^cat\s+/, // Read files
  /^mkdir\s+/, // Create directories
  /^cd\s+/, // Change directory
  /^npm\s+/, // NPM commands
  /^bun\s+/, // Bun commands
  /^git\s+/, // Git commands (read-only recommended)
  /^python3?\s+/, // Python execution
  /^node\s+/, // Node execution
];

function validateCommand(command: string): void {
  const trimmedCommand = command.trim();
  
  // Block dangerous commands
  const dangerousPatterns = [
    /rm\s+-rf\s+\//, // Prevent root deletion
    /dd\s+if=/, // Prevent disk operations
    /:\(\)\{.*\}:/, // Fork bomb
    />\s*\/dev\//, // Prevent device manipulation
    /mkfs/, // Prevent filesystem formatting
    /\.\.[\/\\]/, // Prevent directory traversal with ../
    /^\/(?!tmp|home|workspace)/, // Block absolute paths outside safe dirs
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedCommand)) {
      throw new Error(`Command blocked for security: contains dangerous pattern`);
    }
  }
  
  // Check against allowlist (optional - can be disabled for flexibility)
  // Uncomment to enforce strict allowlist:
  // const isAllowed = ALLOWED_COMMAND_PATTERNS.some(pattern => pattern.test(trimmedCommand));
  // if (!isAllowed) {
  //   throw new Error(`Command not in allowlist: ${trimmedCommand.substring(0, 50)}`);
  // }
}

export class ScrapybaraClient {
  private client: ScrapybaraSDKClient;

  constructor(apiKey?: string) {
    this.client = new ScrapybaraSDKClient({
      apiKey: apiKey || SCRAPYBARA_API_KEY || "",
    });
    if (!apiKey && !SCRAPYBARA_API_KEY) {
      console.warn("SCRAPYBARA_API_KEY is not set");
    }
  }

  async createSandbox(options: {
    template?: string;
    osType?: string;
    timeout_hours?: number;
  }): Promise<ScrapybaraSandbox & { instance: any }> {
    try {
      console.log("Creating Scrapybara sandbox with options:", options);

      // Start Ubuntu instance (default) or Browser based on template
      const instance = options.template === "browser"
        ? await this.client.startBrowser({ timeoutHours: options.timeout_hours || 1 })
        : await this.client.startUbuntu({ timeoutHours: options.timeout_hours || 1 });

      const streamUrl = (await instance.getStreamUrl()).streamUrl;

      return {
        id: instance.id,
        status: "running",
        url: streamUrl,
        instance, // Return instance for direct API usage
      };
    } catch (error) {
      console.error("Failed to create Scrapybara sandbox:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Sandbox creation failed: ${errorMessage}`);
    }
  }

  /**
   * Reconnect to an existing sandbox by ID
   * This allows reusing existing sandbox instances across steps
   *
   * IMPORTANT: This implementation assumes the Scrapybara SDK provides
   * methods to reconnect to existing instances (getBrowser/getUbuntu).
   * If the SDK doesn't expose these methods, alternative approaches:
   * 1. Cache instances in memory (note: won't work across serverless restarts)
   * 2. Use a database cache with TTL for sandbox instance metadata
   * 3. Extend the Scrapybara SDK or use a wrapper that tracks instances
   */
  async getSandbox(sandboxId: string, template: string = "ubuntu"): Promise<ScrapybaraSandbox & { instance: any }> {
    try {
      console.log(`Reconnecting to existing Scrapybara sandbox: ${sandboxId}`);

      // Attempt to get the existing instance using SDK methods
      // TODO: Verify actual method names in Scrapybara SDK documentation
      // Expected method signatures: getBrowser(id: string) / getUbuntu(id: string)
      const instance = template === "browser"
        ? await (this.client as any).getBrowser(sandboxId)
        : await (this.client as any).getUbuntu(sandboxId);

      if (!instance) {
        throw new Error(`Sandbox ${sandboxId} not found or no longer accessible`);
      }

      const streamUrl = (await instance.getStreamUrl()).streamUrl;

      return {
        id: instance.id,
        status: "running",
        url: streamUrl,
        instance, // Return instance for direct API usage
      };
    } catch (error) {
      console.error(`Failed to reconnect to sandbox ${sandboxId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Sandbox reconnection failed: ${errorMessage}`);
    }
  }

  async runCommand(
    instance: any, // UbuntuInstance | BrowserInstance from SDK
    command: string
  ): Promise<BashResult> {
    // SECURITY: Validate command before execution
    // WARNING: NEVER pass unsanitized user input to this function
    validateCommand(command);

    try {
      console.log(`Running command: ${command}`);

      const result = await instance.bash({ command });

      // Normalize SDK response to our BashResult format
      return {
        stdout: result.output || "",
        stderr: result.error || "",
        exitCode: result.error ? 1 : 0, // Approximation: SDK doesn't provide real exit code
        rawResult: result, // Include raw result for callers needing accurate exit-code detection
      };
    } catch (error) {
      console.error(`Command execution failed: ${command}`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Command failed: ${errorMessage}`);
    }
  }

  async streamEvents(instance: any): Promise<ReadableStream> {
    try {
      // Scrapybara provides streaming via getStreamUrl
      const streamUrl = (await instance.getStreamUrl()).streamUrl;
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`Connected to sandbox: ${streamUrl}\n`));
          controller.close();
        }
      });
    } catch (error) {
      console.error("Failed to get stream URL:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Stream connection failed: ${errorMessage}`);
    }
  }
  
  async terminateSandbox(instance: any): Promise<void> {
    try {
      console.log(`Terminating sandbox ${instance.id}`);
      await instance.stop();
    } catch (error) {
      console.error(`Failed to terminate sandbox ${instance.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Sandbox termination failed: ${errorMessage}`);
    }
  }
}

export const scrapybaraClient = new ScrapybaraClient();
