import type { CoreMessage } from "ai";

export type Framework = "nextjs" | "angular" | "react" | "vue" | "svelte";

export interface AgentState {
  summary: string;
  files: Record<string, string>;
  selectedFramework?: Framework;
  summaryRetryCount: number;
}

export interface AgentContext {
  sandboxId: string;
  state: AgentState;
  messages: CoreMessage[];
}

export interface AgentResult {
  state: AgentState;
  messages: CoreMessage[];
  output: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
