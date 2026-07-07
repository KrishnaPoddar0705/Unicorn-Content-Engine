import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { LLMProvider, LLMCompleteParams, LLMCompleteResult, Message } from "./provider";
import { parseJSON } from "./parse-json";

function toGeminiContents(messages: Message[]) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      for (const img of m.images ?? []) {
        parts.push({
          inlineData: { mimeType: img.mediaType, data: img.dataBase64 },
        });
      }
      if (m.content) parts.push({ text: m.content });
      return {
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts,
      };
    });
}

export class GeminiProvider implements LLMProvider {
  name = "gemini";
  private client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set");
    this.client = new GoogleGenAI({ apiKey });
  }

  async complete(params: LLMCompleteParams): Promise<LLMCompleteResult> {
    const system =
      params.system + (params.responseSchema ? "\n\nRespond with valid JSON only." : "");

    const response = await this.client.models.generateContent({
      model: params.model,
      contents: toGeminiContents(params.messages),
      config: {
        systemInstruction: system,
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxTokens ?? 8192,
        ...(params.responseSchema
          ? { responseMimeType: "application/json" as const }
          : {}),
      },
    });

    const content = response.text ?? "";
    const usageMeta = response.usageMetadata;
    const usage = {
      prompt_tokens: usageMeta?.promptTokenCount,
      completion_tokens: usageMeta?.candidatesTokenCount,
      total_tokens: usageMeta?.totalTokenCount,
    };

    let parsed: unknown;
    if (params.responseSchema) {
      parsed = parseJSON(content, params.responseSchema);
    }

    return { content, usage, parsed };
  }
}
