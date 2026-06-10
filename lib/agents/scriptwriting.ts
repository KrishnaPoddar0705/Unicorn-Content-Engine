import { runAgent } from "./runner";
import { ScriptwritingSchema, type Scriptwriting, type Deconstruction } from "./types";
import {
  buildScriptPreferencePrompt,
  resolveScriptPreferences,
  type ScriptPreferences,
} from "./script-preferences";

export async function writeScript(
  deconstruction: Deconstruction,
  episodeTitle: string,
  context?: { pipelineId?: string; episodeId?: string; paperId?: string },
  scriptPreferences?: Partial<ScriptPreferences> | null
): Promise<Scriptwriting> {
  const prefs = await resolveScriptPreferences(scriptPreferences);
  const { userSection, systemSection } = buildScriptPreferencePrompt(prefs);

  const prompt = `Write Instagram Reel scripts for this episode.

Episode title: ${episodeTitle}

Deconstruction:
${JSON.stringify(deconstruction, null, 2)}

${userSection}

Requirements:
- 3 hook options (first 3 seconds each)
- Scripts for 45s, 60s, and 90s (talking-head, video-call vibe)
- Caption, first comment, hashtags
- 5 carousel slides with non-empty body text
- Title variants and thumbnail text
- Parent, student, school, founder angles
- CTA that invites engagement (comment keyword)
- explain_curious version
- Minimal b-roll and visual props suggestions
- positioning_line ending with Unicorn Labs brand

Every script must have one "wait, what?" moment.
Include specific paper details: method, dataset, key results, and limitations where depth allows.

Return a FLAT JSON object with plain strings and string arrays — NO nested objects.

Example shape:
{
  "hook_3s": "plain string",
  "hook_options": ["hook 1 text", "hook 2 text", "hook 3 text"],
  "script_45s": "full spoken script as plain text with line breaks",
  "script_60s": "full spoken script as plain text",
  "script_90s": "full spoken script as plain text",
  "caption": "Instagram caption as plain text",
  "first_comment": "plain string",
  "hashtags": ["#PaperToProject", "#STEM"],
  "carousel_slides": [{"title": "Slide title", "body": "slide body text"}],
  "title_variants": ["title 1", "title 2"],
  "thumbnail_text": "short text",
  "parent_angle": "plain string",
  "student_angle": "plain string",
  "school_angle": "plain string",
  "founder_angle": "plain string",
  "cta": "Comment KEYWORD — full CTA sentence",
  "explain_curious": "plain string",
  "b_roll_suggestions": ["suggestion 1"],
  "visual_props": ["prop 1"],
  "positioning_line": "We turn research papers into projects students can actually build."
}`;

  const { output } = await runAgent({
    agentName: "scriptwriting",
    userPrompt: prompt,
    schema: ScriptwritingSchema,
    context,
    extraSystem: systemSection,
  });

  return output;
}
