export function buildStyleExtractorPrompt(params: { notes?: string }): string {
  return `You are a visual style extractor. Analyze the attached reference image and describe its visual style as a reusable token system for generating new assets in the same style.

${params.notes ? `Context from the user: ${params.notes}` : ""}

Extract:
- name: a short memorable name for this style ("Neon Archive", "Ivory Lab Editorial").
- visual_keywords: 6-12 precise style descriptors (aesthetics, rendering style, era, mood).
- color_palette: the dominant colors as hex estimates or precise names, in order of dominance.
- typography_suggestions: typefaces/styles that match what's in the image (or would pair with it).
- texture: surface quality in one sentence (grain, gloss, matte, paper, glass...).
- composition_rules: how elements are arranged (negative space, grids, focal placement, depth).
- prompt_snippet: a single self-contained paragraph (60-120 words) that, when appended to any image-generation prompt, reproduces this style. Concrete and directive: name the palette, lighting, texture, composition, and rendering style. No references to "the image" — it must stand alone.

Return JSON exactly in this shape:
{
  "name": "...",
  "visual_keywords": ["..."],
  "color_palette": ["#0a0812", "warm ivory"],
  "typography_suggestions": ["..."],
  "texture": "...",
  "composition_rules": ["..."],
  "prompt_snippet": "..."
}`;
}
