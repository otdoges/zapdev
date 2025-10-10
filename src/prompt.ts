// Re-export all prompts from the new prompts directory
export { RESPONSE_PROMPT, FRAGMENT_TITLE_PROMPT } from "./prompts/shared";
export { NEXTJS_PROMPT } from "./prompts/nextjs";
export { ANGULAR_PROMPT } from "./prompts/angular";
export { REACT_PROMPT } from "./prompts/react";
export { VUE_PROMPT } from "./prompts/vue";
export { SVELTE_PROMPT } from "./prompts/svelte";
export { FRAMEWORK_SELECTOR_PROMPT } from "./prompts/framework-selector";

// Backward compatibility - export NEXTJS_PROMPT as PROMPT
export { NEXTJS_PROMPT as PROMPT } from "./prompts/nextjs";
