import { getSettings } from "@/lib/db/queries";

export interface ScriptPreferences {
  tone: string;
  objective: string;
  storytelling: string;
  technical_depth: string;
  custom_instructions: string;
}

export const TONE_OPTIONS = [
  { value: "educational_professor", label: "Educational professor" },
  { value: "friendly_mentor", label: "Friendly mentor" },
  { value: "curious_explainer", label: "Curious explainer" },
  { value: "technical_peer", label: "Technical peer review" },
  { value: "storyteller", label: "Story-driven narrator" },
] as const;

export const OBJECTIVE_OPTIONS = [
  { value: "teach_the_paper_deeply", label: "Teach the paper deeply" },
  { value: "viral_hook_first", label: "Viral hook first" },
  { value: "student_rebuild_focus", label: "Student rebuild focus" },
  { value: "parent_trust_building", label: "Parent trust building" },
  { value: "founder_insight", label: "Founder / industry insight" },
] as const;

export const STORYTELLING_OPTIONS = [
  { value: "lecture_with_insight", label: "Lecture with insight moments" },
  { value: "problem_method_result", label: "Problem → method → result" },
  { value: "mystery_reveal", label: "Mystery → reveal" },
  { value: "lab_walkthrough", label: "Lab walkthrough" },
  { value: "debate_then_resolution", label: "Debate then resolution" },
] as const;

export const TECHNICAL_DEPTH_OPTIONS = [
  { value: "light", label: "Light — concepts only" },
  { value: "moderate", label: "Moderate — key equations & terms" },
  { value: "moderate_high", label: "Moderate-high — method & assumptions" },
  { value: "deep", label: "Deep — methodology, limitations, citations" },
] as const;

export const DEFAULT_SCRIPT_PREFERENCES: ScriptPreferences = {
  tone: "educational_professor",
  objective: "teach_the_paper_deeply",
  storytelling: "lecture_with_insight",
  technical_depth: "moderate_high",
  custom_instructions: "",
};

function labelFor(
  options: readonly { value: string; label: string }[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label || value;
}

export function mergeScriptPreferences(
  globalPrefs?: Partial<ScriptPreferences> | null,
  episodePrefs?: Partial<ScriptPreferences> | null
): ScriptPreferences {
  return {
    ...DEFAULT_SCRIPT_PREFERENCES,
    ...globalPrefs,
    ...episodePrefs,
  };
}

export async function resolveScriptPreferences(
  episodePrefs?: Partial<ScriptPreferences> | null
): Promise<ScriptPreferences> {
  const settings = await getSettings();
  const contentPrefs = (settings?.content_preferences || {}) as Record<string, unknown>;
  const globalPrefs = (contentPrefs.script_writing || {}) as Partial<ScriptPreferences>;
  return mergeScriptPreferences(globalPrefs, episodePrefs);
}

export function buildScriptPreferencePrompt(prefs: ScriptPreferences): {
  userSection: string;
  systemSection: string;
} {
  const userSection = `
Script style preferences (follow closely):
- Tone: ${labelFor(TONE_OPTIONS, prefs.tone)} (${prefs.tone})
- Objective: ${labelFor(OBJECTIVE_OPTIONS, prefs.objective)} (${prefs.objective})
- Storytelling structure: ${labelFor(STORYTELLING_OPTIONS, prefs.storytelling)} (${prefs.storytelling})
- Technical depth: ${labelFor(TECHNICAL_DEPTH_OPTIONS, prefs.technical_depth)} (${prefs.technical_depth})
${prefs.custom_instructions ? `\nCustom instructions from creator:\n${prefs.custom_instructions}` : ""}
`.trim();

  const systemSection =
    prefs.tone === "educational_professor" || prefs.technical_depth === "moderate_high" || prefs.technical_depth === "deep"
      ? "Write like a university professor explaining a paper to curious students: precise on method, assumptions, dataset, and results. Name key techniques (e.g. Bayesian updating, Poisson models, GLMs) and explain why they matter. Still conversational for Reels, but prioritize educational depth over hype. No empty scripts. Never return JSON objects inside string fields."
      : "Write like a smart mentor on a video call. Explain jargon when used. No fake hype. All script fields must be complete spoken-word scripts, not empty. Never return JSON objects inside string fields.";

  return { userSection, systemSection };
}
