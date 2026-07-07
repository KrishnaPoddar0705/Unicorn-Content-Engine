import "server-only";
import type { ZodSchema } from "zod";
import {
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENAI_MODEL,
  type LLMProviderName,
} from "./constants";

export type { LLMProviderName } from "./constants";

export interface ImagePart {
  type: "image";
  mediaType: string;
  dataBase64: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  images?: ImagePart[];
}

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface LLMCompleteParams {
  model: string;
  system: string;
  messages: Message[];
  responseSchema?: ZodSchema;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMCompleteResult {
  content: string;
  usage: TokenUsage;
  parsed?: unknown;
}

export interface LLMProvider {
  name: string;
  complete(params: LLMCompleteParams): Promise<LLMCompleteResult>;
}

export interface LLMSettings {
  llm_provider?: LLMProviderName | string;
  openai_model?: string;
  anthropic_model?: string;
  gemini_model?: string;
}

export function resolveModelForProvider(
  provider: LLMProviderName,
  settings?: LLMSettings | null
): string {
  switch (provider) {
    case "openai":
      return settings?.openai_model || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
    case "gemini":
      return settings?.gemini_model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    default:
      return settings?.anthropic_model || process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;
  }
}

export function resolveProviderName(settings?: LLMSettings | null): LLMProviderName {
  const name =
    settings?.llm_provider ||
    (process.env.DEFAULT_LLM_PROVIDER as LLMProviderName) ||
    "anthropic";
  if (name === "openai" || name === "gemini") return name;
  return "anthropic";
}

export async function getLLMProvider(provider?: LLMProviderName): Promise<LLMProvider> {
  const name = provider || (process.env.DEFAULT_LLM_PROVIDER as LLMProviderName) || "anthropic";
  if (name === "openai") {
    const { OpenAIProvider } = await import("./openai");
    return new OpenAIProvider();
  }
  if (name === "gemini") {
    const { GeminiProvider } = await import("./gemini");
    return new GeminiProvider();
  }
  const { AnthropicProvider } = await import("./anthropic");
  return new AnthropicProvider();
}

export async function getSettingsModels() {
  try {
    const { getSupabase } = await import("@/lib/supabase/server");
    const supabase = getSupabase();
    const { data } = await supabase.from("settings").select("*").limit(1).single();
    return data;
  } catch {
    return {
      llm_provider: "gemini" as const,
      openai_model: "gpt-4o",
      anthropic_model: "claude-opus-4-8",
      gemini_model: DEFAULT_GEMINI_MODEL,
    };
  }
}
