// Re-export all prompts from the new prompts directory
export { RESPONSE_PROMPT, FRAGMENT_TITLE_PROMPT } from "./prompts/shared";
export { NEXTJS_PROMPT } from "./prompts/nextjs";
export { ANGULAR_PROMPT } from "./prompts/angular";
export { REACT_PROMPT } from "./prompts/react";
export { VUE_PROMPT } from "./prompts/vue";
export { SVELTE_PROMPT } from "./prompts/svelte";
export { FRAMEWORK_SELECTOR_PROMPT } from "./prompts/framework-selector";

// Multi-agent system prompts
export { PLANNER_AGENT_PROMPT } from "./prompts/agents/planner";
export { CODER_AGENT_PROMPT } from "./prompts/agents/coder";
export { TESTER_AGENT_PROMPT } from "./prompts/agents/tester";
export { REVIEWER_AGENT_PROMPT } from "./prompts/agents/reviewer";

// Backward compatibility - export NEXTJS_PROMPT as PROMPT
export { NEXTJS_PROMPT as PROMPT } from "./prompts/nextjs";
