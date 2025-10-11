export const SANDBOX_TIMEOUT = 45 * 60 * 1000; // 45 minutes in MS

export type Framework = 'nextjs' | 'angular' | 'react' | 'vue' | 'svelte';

export interface AgentState {
  summary: string;
  files: { [path: string]: string };
  selectedFramework?: Framework;
}
