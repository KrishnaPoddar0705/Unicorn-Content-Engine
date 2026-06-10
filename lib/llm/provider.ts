import type { ZodSchema } from "zod";

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

export type LLMProviderName = "openai" | "anthropic";

export async function getLLMProvider(provider?: LLMProviderName): Promise<LLMProvider> {
  const name = provider || (process.env.DEFAULT_LLM_PROVIDER as LLMProviderName) || "anthropic";
  if (name === "openai") {
    const { OpenAIProvider } = await import("./openai");
    return new OpenAIProvider();
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
      llm_provider: "anthropic" as const,
      openai_model: "gpt-4o",
      anthropic_model: "claude-opus-4-8",
    };
  }
}
