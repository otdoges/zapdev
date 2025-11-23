export const SANDBOX_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export type Framework = "nextjs" | "angular" | "react" | "vue" | "svelte";

export type ModelId =
  | "auto"
  | "anthropic/claude-haiku-4.5"
  | "openai/gpt-5.1-codex"
  | "moonshotai/kimi-k2-thinking"
  | "google/gemini-3-pro-preview"
  | "xai/grok-4.1-fast-reasoning";
