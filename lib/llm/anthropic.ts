import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, LLMCompleteParams, LLMCompleteResult } from "./provider";
import { parseJSON } from "./parse-json";

/** Opus 4.x rejects temperature / top_p / top_k — omit sampling params. */
function supportsSamplingParams(model: string): boolean {
  return !/claude-opus-4/i.test(model);
}

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    this.client = new Anthropic({ apiKey });
  }

  async complete(params: LLMCompleteParams): Promise<LLMCompleteResult> {
    const baseRequest = {
      model: params.model,
      max_tokens: params.maxTokens ?? 8192,
      system: params.system + (params.responseSchema ? "\n\nRespond with valid JSON only." : ""),
      messages: params.messages.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.images?.length
          ? [
              ...m.images.map((img) => ({
                type: "image" as const,
                source: {
                  type: "base64" as const,
                  media_type: img.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                  data: img.dataBase64,
                },
              })),
              { type: "text" as const, text: m.content },
            ]
          : m.content,
      })),
    };

    const request = supportsSamplingParams(params.model)
      ? { ...baseRequest, temperature: params.temperature ?? 0.7 }
      : baseRequest;

    // Anthropic requires streaming when max_tokens is large (long-running requests).
    const response =
      baseRequest.max_tokens > 8192
        ? await this.client.messages.stream(request).finalMessage()
        : await this.client.messages.create(request);

    const textBlock = response.content.find((b) => b.type === "text");
    const content = textBlock && "text" in textBlock ? textBlock.text : "";
    const usage = {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    let parsed: unknown;
    if (params.responseSchema) {
      parsed = parseJSON(content, params.responseSchema);
    }

    return { content, usage, parsed };
  }
}
