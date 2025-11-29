export const SANDBOX_TIMEOUT = 30 * 60 * 1000; // 30 minutes in MS (reduced from 60 to prevent long-running failures)

export type Framework = 'nextjs' | 'angular' | 'react' | 'vue' | 'svelte';

export interface AgentState {
  instruction?: string;
  summary?: string;
  files?: Record<string, string>;
  selectedFramework?: Framework;
  summaryRetryCount?: number;
  councilVotes?: AgentVote[];
}

export interface AgentVote {
  agentName: string;
  decision: "approve" | "reject" | "revise";
  confidence: number;
  reasoning: string;
}

export interface CouncilDecision {
  finalDecision: "approve" | "reject" | "revise";
  agreeCount: number;
  totalVotes: number;
  votes: AgentVote[];
  orchestratorDecision: string;
}

export interface ClientState {
  projectId: string;
  userId?: string;
}
