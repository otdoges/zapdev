import { ScrapybaraClient as ScrapybaraSDKClient } from "scrapybara";
import { z } from "zod";

const SCRAPYBARA_API_KEY = process.env.SCRAPYBARA_API_KEY;

export const ScrapybaraSandboxSchema = z.object({
  id: z.string(),
  status: z.enum(["starting", "running", "stopped", "failed"]),
  url: z.string().optional(),
});

export type ScrapybaraSandbox = z.infer<typeof ScrapybaraSandboxSchema>;

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
  }

  async runCommand(
    instance: any, 
    command: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    console.log(`Running command: ${command}`);
    
    const result = await instance.bash({ command });
    
    return { 
      stdout: result.stdout || "Command executed successfully", 
      stderr: result.stderr || "", 
      exitCode: result.exit_code || 0 
    };
  }

  async streamEvents(instance: any): Promise<ReadableStream> {
    // Scrapybara provides streaming via getStreamUrl
    const streamUrl = (await instance.getStreamUrl()).streamUrl;
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`Connected to sandbox: ${streamUrl}\n`));
        controller.close();
      }
    });
  }
  
  async terminateSandbox(instance: any): Promise<void> {
    console.log(`Terminating sandbox ${instance.id}`);
    await instance.stop();
  }
}

export const scrapybaraClient = new ScrapybaraClient();
