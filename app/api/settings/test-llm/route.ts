import { NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/llm/provider";
import { getSettings } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const settings = await getSettings();
    const provider =
      body.provider ||
      settings?.llm_provider ||
      process.env.DEFAULT_LLM_PROVIDER ||
      "anthropic";
    const model =
      provider === "openai"
        ? body.model || settings?.openai_model || "gpt-4o"
        : body.model || settings?.anthropic_model || "claude-opus-4-8";

    const llm = await getLLMProvider(provider);
    const result = await llm.complete({
      model,
      system: "You are a test assistant.",
      messages: [{ role: "user", content: 'Reply with exactly: "Unicorn Labs Content Engine is online."' }],
      temperature: 0,
    });

    return NextResponse.json({
      success: true,
      provider,
      model,
      response: result.content.trim(),
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LLM test failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
