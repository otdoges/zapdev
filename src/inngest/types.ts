export const SANDBOX_TIMEOUT = 60_000 * 10 * 3; // 30 minutes in MS

export type Framework = 'nextjs' | 'angular' | 'react' | 'vue' | 'svelte';

export interface AgentState {
  summary: string;
  files: { [path: string]: string };
  selectedFramework?: Framework;
  title?: string;
  response?: string;
}

export interface ClientState {
  projectId: string;
  userId?: string;
}
