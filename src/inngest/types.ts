export const SANDBOX_TIMEOUT = 60_000 * 60; // 60 minutes in MS

export type Framework = 'nextjs' | 'angular' | 'react' | 'vue' | 'svelte';

export type AgentRole = 'planner' | 'coder' | 'tester' | 'reviewer';

export interface AgentDecision {
  agent: AgentRole;
  decision: string;
  reasoning: string;
  timestamp: number;
}

export interface TestResults {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface CodeReview {
  quality: 'excellent' | 'good' | 'needs_improvement';
  suggestions: string[];
  criticalIssues: string[];
}

export interface AgentState {
  summary: string;
  files: { [path: string]: string };
  selectedFramework?: Framework;
  title?: string;
  response?: string;
  plan?: string;
  currentPhase?: 'planning' | 'coding' | 'testing' | 'reviewing' | 'complete';
  agentDecisions?: AgentDecision[];
  testResults?: TestResults;
  codeReview?: CodeReview;
  iterations?: number;
}

export interface ClientState {
  projectId: string;
  userId?: string;
}
