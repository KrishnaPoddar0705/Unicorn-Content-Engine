import { runAgent } from "@/lib/agents/runner";
import { getSupabase } from "@/lib/supabase/server";
import { buildStyleExtractorPrompt } from "@/lib/prompts/viral/style-extractor";
import { StyleExtractorSchema, type StyleExtractorOutput } from "@/lib/prompts/viral/output-schemas";
import { downloadReferenceImageBase64 } from "@/lib/viral/reference-images";
import type { StyleProfile } from "@/lib/supabase/types";

/** Extracts a reusable style profile from a reference image via a vision call. */
export async function extractStyleProfile(params: {
  referenceImageId: string;
  notes?: string;
}): Promise<StyleProfile> {
  const { dataBase64, mimeType, image } = await downloadReferenceImageBase64(
    params.referenceImageId
  );

  const { output } = await runAgent<StyleExtractorOutput>({
    agentName: "viral_style_extractor",
    userPrompt: buildStyleExtractorPrompt({ notes: params.notes || image.notes || undefined }),
    schema: StyleExtractorSchema,
    images: [{ type: "image", mediaType: mimeType, dataBase64 }],
    correctionMessage:
      "Your previous JSON was invalid. Return ONE valid JSON object with all fields: name, visual_keywords, color_palette, typography_suggestions, texture, composition_rules, prompt_snippet.",
    temperature: 0.4,
  });

  const { data, error } = await getSupabase()
    .from("style_profiles")
    .insert({
      name: output.name,
      source: "extracted",
      reference_image_id: params.referenceImageId,
      profile: {
        visual_keywords: output.visual_keywords,
        color_palette: output.color_palette,
        typography_suggestions: output.typography_suggestions,
        texture: output.texture,
        composition_rules: output.composition_rules,
        prompt_snippet: output.prompt_snippet,
      },
    })
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to save style profile: ${error?.message}`);
  return data as StyleProfile;
}
