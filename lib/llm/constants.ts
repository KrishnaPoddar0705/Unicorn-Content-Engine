/** Client-safe LLM defaults — do not import server provider modules from UI code. */

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const DEFAULT_OPENAI_MODEL = "gpt-4o";
export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-8";

export type LLMProviderName = "openai" | "anthropic" | "gemini";
