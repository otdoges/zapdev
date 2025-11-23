export type AgentMode = 'single';

export const getAgentMode = (): AgentMode => 'single';

const isAiSdkEnabled = () =>
  (process.env.AI_AGENT_IMPLEMENTATION || "").toLowerCase() === "ai-sdk";

export const getAgentEventName = (): string =>
  isAiSdkEnabled() ? "code-agent/run-ai-sdk" : "code-agent/run";
