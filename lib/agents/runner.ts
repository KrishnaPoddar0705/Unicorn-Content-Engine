import { randomUUID } from "crypto";
import type { ZodSchema } from "zod";
import { getLLMProvider, getSettingsModels, type ImagePart, type Message } from "@/lib/llm/provider";
import { getBrandVoicePrompt } from "@/lib/brand/voice";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export interface AgentRunContext {
  pipelineId?: string;
  episodeId?: string;
  paperId?: string;
  viralEpisodeId?: string;
}

const DEFAULT_CORRECTION_MESSAGE =
  "Your previous JSON was invalid or incomplete. Return ONE flat JSON object with ALL required fields as strings or string arrays. script_45s, script_60s, and script_90s must be full spoken-word scripts (not empty). caption and cta must be plain text strings, not nested JSON. carousel_slides must have non-empty body text.";

export async function runAgent<T>(params: {
  agentName: string;
  userPrompt: string;
  schema: ZodSchema<T>;
  context?: AgentRunContext;
  temperature?: number;
  maxTokens?: number;
  extraSystem?: string;
  correctionMessage?: string;
  images?: ImagePart[];
}): Promise<{ output: T; runId?: string; usage: Record<string, number> }> {
  const settings = await getSettingsModels();
  const providerName =
    settings?.llm_provider ||
    (process.env.DEFAULT_LLM_PROVIDER as "openai" | "anthropic") ||
    "anthropic";
  const model =
    providerName === "openai"
      ? settings?.openai_model || "gpt-4o"
      : settings?.anthropic_model || "claude-opus-4-8";

  const provider = await getLLMProvider(providerName);
  const system = [getBrandVoicePrompt(), params.extraSystem].filter(Boolean).join("\n\n");
  const messages: Message[] = [
    { role: "user", content: params.userPrompt, images: params.images },
  ];

  const start = Date.now();
  let runId: string | undefined;

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("agent_runs")
      .insert({
        agent_name: params.agentName,
        pipeline_id: params.context?.pipelineId,
        episode_id: params.context?.episodeId,
        paper_id: params.context?.paperId,
        viral_episode_id: params.context?.viralEpisodeId,
        input: { prompt: params.userPrompt },
        status: "running",
        provider: providerName,
        model,
      })
      .select("id")
      .single();
    runId = data?.id;
  }

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const attemptMessages: Message[] =
        attempt === 0
          ? messages
          : [
              ...messages,
              {
                role: "user",
                content: params.correctionMessage || DEFAULT_CORRECTION_MESSAGE,
              },
            ];

      const result = await provider.complete({
        model,
        system,
        messages: attemptMessages,
        responseSchema: params.schema,
        temperature: params.temperature ?? 0.7,
        maxTokens: params.maxTokens,
      });

      const output = result.parsed as T;
      const duration = Date.now() - start;

      if (runId && isSupabaseConfigured()) {
        await getSupabase()
          .from("agent_runs")
          .update({
            output: output as Record<string, unknown>,
            status: "success",
            duration_ms: duration,
            token_usage: result.usage,
          })
          .eq("id", runId);
      }

      return { output, runId, usage: result.usage as Record<string, number> };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      if (attempt === 1) break;
    }
  }

  const message = lastError?.message || "Agent failed after retries";
  if (runId && isSupabaseConfigured()) {
    await getSupabase()
      .from("agent_runs")
      .update({ status: "failed", error: message, duration_ms: Date.now() - start })
      .eq("id", runId);
  }
  throw lastError ?? new Error(message);
}

/** Run an agent that returns free-form text (no JSON schema). Uses streaming for large outputs. */
export async function runAgentText(params: {
  agentName: string;
  userPrompt: string;
  context?: AgentRunContext;
  temperature?: number;
  maxTokens?: number;
  extraSystem?: string;
}): Promise<{ content: string; runId?: string; usage: Record<string, number> }> {
  const settings = await getSettingsModels();
  const providerName =
    settings?.llm_provider ||
    (process.env.DEFAULT_LLM_PROVIDER as "openai" | "anthropic") ||
    "anthropic";
  const model =
    providerName === "openai"
      ? settings?.openai_model || "gpt-4o"
      : settings?.anthropic_model || "claude-opus-4-8";

  const provider = await getLLMProvider(providerName);
  const system = [getBrandVoicePrompt(), params.extraSystem].filter(Boolean).join("\n\n");
  const messages: Message[] = [{ role: "user", content: params.userPrompt }];

  const start = Date.now();
  let runId: string | undefined;

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("agent_runs")
      .insert({
        agent_name: params.agentName,
        pipeline_id: params.context?.pipelineId,
        episode_id: params.context?.episodeId,
        paper_id: params.context?.paperId,
        viral_episode_id: params.context?.viralEpisodeId,
        input: { prompt: params.userPrompt },
        status: "running",
        provider: providerName,
        model,
      })
      .select("id")
      .single();
    runId = data?.id;
  }

  try {
    const result = await provider.complete({
      model,
      system,
      messages,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens,
    });

    const duration = Date.now() - start;

    if (runId && isSupabaseConfigured()) {
      const output: Record<string, unknown> = { content_length: result.content.length };
      if (params.agentName === "interactive_webpage" || params.agentName === "viral_interactive_webpage") {
        output.html_raw = result.content;
      }
      await getSupabase()
        .from("agent_runs")
        .update({
          output,
          status: "success",
          duration_ms: duration,
          token_usage: result.usage,
        })
        .eq("id", runId);
    }

    return { content: result.content, runId, usage: result.usage as Record<string, number> };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent failed";
    if (runId && isSupabaseConfigured()) {
      await getSupabase()
        .from("agent_runs")
        .update({ status: "failed", error: message, duration_ms: Date.now() - start })
        .eq("id", runId);
    }
    throw error instanceof Error ? error : new Error(message);
  }
}

export function newPipelineId(): string {
  return randomUUID();
}
