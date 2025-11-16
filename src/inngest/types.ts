export const SANDBOX_TIMEOUT = 30 * 60 * 1000; // 30 minutes in MS (reduced from 60 to prevent long-running failures)

export type Framework = 'nextjs' | 'angular' | 'react' | 'vue' | 'svelte';

export interface AgentState {
  summary: string;
  files: Record<string, string>;
  selectedFramework?: Framework;
  summaryRetryCount: number;
}

export interface ClientState {
  projectId: string;
  userId?: string;
}
