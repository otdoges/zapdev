export const SANDBOX_TIMEOUT = 30 * 60 * 1000; // 30 minutes in MS (reduced from 60 to prevent long-running failures)

export type Framework = 'nextjs' | 'angular' | 'react' | 'vue' | 'svelte';

export interface ClientState {
  projectId: string;
  userId?: string;
}

// Re-export AgentState from ai-sdk for backward compatibility
export type { AgentState } from "@/ai-sdk/types";
