import type { ScriptArchitectOutput } from "./output-schemas";

export const DEFAULT_VIRAL_STYLE = `Default Unicorn Labs futuristic style: glassmorphism panels over deep near-black backgrounds, neon but tasteful violet/cyan accent light, editorial serif headlines with clean grotesque body text, research-lab-meets-premium-magazine aesthetic, subtle grain and depth-of-field, data visualizations as glowing precise line work. Futuristic education, never sci-fi kitsch.`;

export function buildVisualDirectorPrompt(params: {
  title: string;
  winnerHook: string;
  script: ScriptArchitectOutput;
  styleInstruction?: string;
}): string {
  const style = params.styleInstruction?.trim() || DEFAULT_VIRAL_STYLE;
  const script60 = params.script.scripts["60s"];
  return `You are the Visual Director. Design the complete visual system for this episode: a 9:16 reel storyboard, carousel slide designs, and copy-ready generation prompts.

Episode: ${params.title}
Hook: "${params.winnerHook}"

VISUAL STYLE DIRECTION (follow this in every asset prompt):
${style}

THE 60s SCRIPT (storyboard this beat-for-beat):
${JSON.stringify(script60, null, 2)}

CAROUSEL CONTENT (design each slide):
${JSON.stringify(params.script.carousel.slides, null, 2)}

Produce:
1. style_profile — the reusable visual token set for this episode (keywords, palette as hex-or-name list, typography, texture, composition rules).
2. reel_storyboard — one beat per script section, plus extra beats where a visual change is needed. Each beat: timestamp range, what is on screen, on-screen text (short, punchy — viewers watch muted), motion/camera direction, and a complete standalone asset_prompt (a full image/video generation prompt embedding the style — never "same as above").
3. carousel_design — per slide: refined headline/body plus visual_direction describing the full slide design.
4. higgsfield_prompt — one copy-ready cinematic video-generation prompt for the hero shot of this episode (subject, motion, lighting, style, 9:16).
5. kling_prompt — one copy-ready image-generation prompt for the key visual, under 2000 characters, 9:16 vertical.
6. thumbnail_prompt — one copy-ready prompt for the cover/thumbnail: bold, readable at small size, includes the thumbnail text treatment.

Asset prompts must be concrete enough to paste directly into a generation tool: subject, composition, lighting, palette, mood, style keywords, aspect ratio.

Return JSON exactly in this shape:
{
  "style_profile": {
    "visual_keywords": ["..."],
    "color_palette": ["#0a0812", "violet neon"],
    "typography_suggestions": ["..."],
    "texture": "...",
    "composition_rules": ["..."]
  },
  "reel_storyboard": [
    {
      "timestamp": "0:00-0:03",
      "visual": "what is on screen",
      "on_screen_text": "short punchy text",
      "motion": "camera/motion direction",
      "asset_prompt": "complete standalone generation prompt"
    }
  ],
  "carousel_design": [
    { "slide_number": 1, "headline": "...", "body": "...", "visual_direction": "full slide design description" }
  ],
  "higgsfield_prompt": "...",
  "kling_prompt": "...",
  "thumbnail_prompt": "..."
}`;
}
