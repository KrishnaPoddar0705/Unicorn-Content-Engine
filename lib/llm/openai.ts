import "server-only";
import OpenAI from "openai";
import type { LLMProvider, LLMCompleteParams, LLMCompleteResult } from "./provider";
import { parseJSON } from "./parse-json";

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    this.client = new OpenAI({ apiKey });
  }

  async complete(params: LLMCompleteParams): Promise<LLMCompleteResult> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 8192,
      temperature: params.temperature ?? 0.7,
      response_format: params.responseSchema ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: params.system + (params.responseSchema ? "\n\nRespond with valid JSON only." : "") },
        ...params.messages.map((m) =>
          m.images?.length && m.role === "user"
            ? {
                role: "user" as const,
                content: [
                  ...m.images.map((img) => ({
                    type: "image_url" as const,
                    image_url: { url: `data:${img.mediaType};base64,${img.dataBase64}` },
                  })),
                  { type: "text" as const, text: m.content },
                ],
              }
            : { role: m.role, content: m.content }
        ),
      ],
    });

    const content = response.choices[0]?.message?.content || "";
    const usage = {
      prompt_tokens: response.usage?.prompt_tokens,
      completion_tokens: response.usage?.completion_tokens,
      total_tokens: response.usage?.total_tokens,
    };

    let parsed: unknown;
    if (params.responseSchema) {
      parsed = parseJSON(content, params.responseSchema);
    }

    return { content, usage, parsed };
  }
}
