import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, Message, TextMessage } from "@inngest/agent-kit";

import { SANDBOX_TIMEOUT } from "./types";

export async function getSandbox(sandboxId: string) {
  console.log("[DEBUG] Connecting to sandbox:", sandboxId);
  console.log("[DEBUG] E2B_API_KEY present in getSandbox:", !!process.env.E2B_API_KEY);
  
  try {
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: process.env.E2B_API_KEY,
    });
    console.log("[DEBUG] Successfully connected to sandbox");
    await sandbox.setTimeout(SANDBOX_TIMEOUT);
    return sandbox;
  } catch (error) {
    console.error("[ERROR] Failed to connect to E2B sandbox:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`E2B sandbox connection failed: ${errorMessage}`);
  }
};

export function lastAssistantTextMessageContent(result: AgentResult) {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant",
  );

  const message = result.output[lastAssistantTextMessageIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
};

export const parseAgentOutput = (value: Message[]) => {
  const output = value[0];

  if (output.type !== "text") {
    return "Fragment";
  }

  if (Array.isArray(output.content)) {
    return output.content.map((txt) => txt).join("")
  } else {
    return output.content
  }
};
