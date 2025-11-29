import { tool } from "ai";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import type { AgentState, ToolResult } from "./types";

async function getSandboxFromId(sandboxId: string): Promise<Sandbox> {
  return await Sandbox.connect(sandboxId, {
    apiKey: process.env.E2B_API_KEY,
  });
}

export function createCodeAgentTools(
  sandboxId: string,
  stateRef: { current: AgentState }
) {
  const terminalTool = tool({
    description: "Run a terminal command in the sandbox environment",
    parameters: z.object({
      command: z.string().describe("The command to execute in the terminal"),
    }),
    execute: async ({ command }): Promise<ToolResult> => {
      const buffers = { stdout: "", stderr: "" };

      try {
        const sandbox = await getSandboxFromId(sandboxId);
        const result = await sandbox.commands.run(command, {
          onStdout: (data: string) => {
            buffers.stdout += data;
          },
          onStderr: (data: string) => {
            buffers.stderr += data;
          },
        });
        return {
          success: true,
          data: {
            stdout: result.stdout || buffers.stdout,
            stderr: buffers.stderr,
            exitCode: result.exitCode,
          },
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          success: false,
          error: `Command failed: ${errorMessage}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`,
        };
      }
    },
  });

  const createOrUpdateFilesTool = tool({
    description:
      "Create or update files in the sandbox. Use this to write code files.",
    parameters: z.object({
      files: z
        .array(
          z.object({
            path: z.string().describe("The file path relative to the sandbox"),
            content: z.string().describe("The content to write to the file"),
          })
        )
        .describe("Array of files to create or update"),
    }),
    execute: async ({ files }): Promise<ToolResult> => {
      try {
        const sandbox = await getSandboxFromId(sandboxId);
        const updatedFiles = stateRef.current.files || {};

        for (const file of files) {
          await sandbox.files.write(file.path, file.content);
          updatedFiles[file.path] = file.content;
        }

        stateRef.current.files = updatedFiles;

        return {
          success: true,
          data: {
            filesWritten: files.map((f) => f.path),
            totalFiles: Object.keys(updatedFiles).length,
          },
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          success: false,
          error: `Failed to write files: ${errorMessage}`,
        };
      }
    },
  });

  const readFilesTool = tool({
    description: "Read files from the sandbox to understand existing code",
    parameters: z.object({
      files: z
        .array(z.string())
        .describe("Array of file paths to read from the sandbox"),
    }),
    execute: async ({ files }): Promise<ToolResult> => {
      try {
        const sandbox = await getSandboxFromId(sandboxId);
        const contents: Array<{ path: string; content: string }> = [];

        for (const filePath of files) {
          try {
            const content = await sandbox.files.read(filePath);
            contents.push({ path: filePath, content });
          } catch {
            contents.push({
              path: filePath,
              content: `[Error: Could not read file ${filePath}]`,
            });
          }
        }

        return {
          success: true,
          data: contents,
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          success: false,
          error: `Failed to read files: ${errorMessage}`,
        };
      }
    },
  });

  return {
    terminal: terminalTool,
    createOrUpdateFiles: createOrUpdateFilesTool,
    readFiles: readFilesTool,
  };
}
