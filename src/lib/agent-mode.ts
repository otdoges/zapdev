export type AgentMode = 'single' | 'multi';

export const getAgentMode = (): AgentMode => {
  const mode = process.env.AGENT_MODE?.toLowerCase();
  
  if (mode === 'multi') {
    return 'multi';
  }
  
  return 'single';
};

export const getAgentEventName = (mode?: AgentMode): string => {
  const actualMode = mode || getAgentMode();
  return actualMode === 'multi' ? 'multi-agent/run' : 'code-agent/run';
};
