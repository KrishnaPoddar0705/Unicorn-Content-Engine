import { z } from "zod";
import { coerceString, coerceStringArray, coerceNumber } from "@/lib/agents/coerce";

function asObject(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      /* not JSON */
    }
  }
  return {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* not JSON */
    }
  }
  return [];
}

// ---------- Curiosity Miner ----------

const TARGET_EMOTIONS = ["curiosity", "shock", "confusion", "awe", "status", "fear", "wonder"] as const;

function coerceEmotion(value: unknown): (typeof TARGET_EMOTIONS)[number] {
  const v = coerceString(value).toLowerCase();
  const match = TARGET_EMOTIONS.find((e) => v.includes(e));
  return match ?? "curiosity";
}

function normalizeCuriosityMiner(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  const best = asObject(obj.best_angle ?? obj.winner ?? obj.best);
  return {
    core_paradox: coerceString(obj.core_paradox ?? obj.paradox),
    counterintuitive_claims: coerceStringArray(obj.counterintuitive_claims ?? obj.claims),
    mystery_hooks: coerceStringArray(obj.mystery_hooks ?? obj.hooks),
    things_people_think_wrong: coerceStringArray(
      obj.things_people_think_wrong ?? obj.misconceptions
    ),
    hidden_mechanism: coerceString(obj.hidden_mechanism ?? obj.mechanism),
    unexpected_real_world_connection: coerceString(
      obj.unexpected_real_world_connection ?? obj.real_world_connection
    ),
    best_angle: {
      title: coerceString(best.title ?? best.angle, "The angle"),
      why_it_stops_scroll: coerceString(best.why_it_stops_scroll ?? best.why),
      target_emotion: coerceEmotion(best.target_emotion ?? best.emotion),
    },
  };
}

export const CuriosityMinerSchema = z.preprocess(
  normalizeCuriosityMiner,
  z.object({
    core_paradox: z.string(),
    counterintuitive_claims: z.array(z.string()),
    mystery_hooks: z.array(z.string()),
    things_people_think_wrong: z.array(z.string()),
    hidden_mechanism: z.string(),
    unexpected_real_world_connection: z.string(),
    best_angle: z.object({
      title: z.string(),
      why_it_stops_scroll: z.string(),
      target_emotion: z.enum(TARGET_EMOTIONS),
    }),
  })
);
export type CuriosityMinerOutput = z.infer<typeof CuriosityMinerSchema>;

// ---------- Expert Research ----------

function coerceConfidence(value: unknown): "high" | "medium" | "low" {
  const v = coerceString(value).toLowerCase();
  if (v.includes("high")) return "high";
  if (v.includes("low")) return "low";
  return "medium";
}

function normalizeExpertResearch(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  return {
    technical_core: coerceString(obj.technical_core ?? obj.core),
    plain_explanation: coerceString(obj.plain_explanation ?? obj.explanation ?? obj.eli_smart),
    key_terms: coerceStringArray(obj.key_terms ?? obj.terms),
    prerequisite_concepts: coerceStringArray(obj.prerequisite_concepts ?? obj.prerequisites),
    mental_models: coerceStringArray(obj.mental_models),
    mathematical_or_logical_structure: coerceString(
      obj.mathematical_or_logical_structure ?? obj.math_structure ?? obj.structure
    ),
    real_world_examples: coerceStringArray(obj.real_world_examples ?? obj.examples),
    verified_facts: coerceStringArray(obj.verified_facts ?? obj.facts),
    speculative_interpretations: coerceStringArray(
      obj.speculative_interpretations ?? obj.speculation
    ),
    what_to_not_oversimplify: coerceStringArray(
      obj.what_to_not_oversimplify ?? obj.do_not_oversimplify
    ),
    what_most_people_misunderstand: coerceString(
      obj.what_most_people_misunderstand ?? obj.common_misunderstanding
    ),
    citation_notes: coerceStringArray(obj.citation_notes ?? obj.citations),
    confidence: coerceConfidence(obj.confidence),
  };
}

export const ExpertResearchSchema = z.preprocess(
  normalizeExpertResearch,
  z.object({
    technical_core: z.string(),
    plain_explanation: z.string(),
    key_terms: z.array(z.string()),
    prerequisite_concepts: z.array(z.string()),
    mental_models: z.array(z.string()),
    mathematical_or_logical_structure: z.string(),
    real_world_examples: z.array(z.string()),
    verified_facts: z.array(z.string()),
    speculative_interpretations: z.array(z.string()),
    what_to_not_oversimplify: z.array(z.string()),
    what_most_people_misunderstand: z.string(),
    citation_notes: z.array(z.string()),
    confidence: z.enum(["high", "medium", "low"]),
  })
);
export type ExpertResearchOutput = z.infer<typeof ExpertResearchSchema>;

// ---------- Hook Lab ----------

function normalizeHook(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  return {
    hook: coerceString(obj.hook ?? obj.text),
    archetype: coerceString(obj.archetype ?? obj.type, "curiosity gap"),
    curiosity_score: coerceNumber(obj.curiosity_score, 5),
    clarity_score: coerceNumber(obj.clarity_score, 5),
    technical_depth_score: coerceNumber(obj.technical_depth_score, 5),
    risk_of_clickbait: coerceNumber(obj.risk_of_clickbait, 5),
    recommended: obj.recommended === true || coerceString(obj.recommended).toLowerCase() === "true",
  };
}

function normalizeHookLab(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  const hooks = asArray(obj.hooks).map(normalizeHook).filter((h) => h.hook);
  let winner = coerceString(obj.winner);
  let winnerArchetype = coerceString(obj.winner_archetype);
  if (winner) {
    const winnerObj = asObject(obj.winner);
    if (winnerObj.hook) {
      winner = coerceString(winnerObj.hook);
      winnerArchetype = winnerArchetype || coerceString(winnerObj.archetype);
    }
  }
  if (!winner && hooks.length > 0) {
    const best = [...hooks].sort(
      (a, b) =>
        (b.curiosity_score as number) + (b.clarity_score as number) -
        ((a.curiosity_score as number) + (a.clarity_score as number))
    )[0];
    winner = best.hook as string;
    winnerArchetype = best.archetype as string;
  }
  if (!winnerArchetype) {
    const match = hooks.find((h) => h.hook === winner);
    winnerArchetype = (match?.archetype as string) || "curiosity gap";
  }
  return { hooks, winner, winner_archetype: winnerArchetype };
}

export const HookSchema = z.object({
  hook: z.string(),
  archetype: z.string(),
  curiosity_score: z.number(),
  clarity_score: z.number(),
  technical_depth_score: z.number(),
  risk_of_clickbait: z.number(),
  recommended: z.boolean(),
});

export const HookLabSchema = z.preprocess(
  normalizeHookLab,
  z.object({
    hooks: z.array(HookSchema).min(1, "hook_lab must return at least one hook"),
    winner: z.string(),
    winner_archetype: z.string(),
  })
);
export type HookLabOutput = z.infer<typeof HookLabSchema>;

// ---------- Script Architect ----------

const SCRIPT_SECTION_KEYS = [
  "hook",
  "setup",
  "mystery",
  "technical_reveal",
  "concrete_example",
  "twist",
  "payoff",
  "cta",
] as const;

function normalizeScriptSections(raw: unknown): Record<string, string> {
  const obj = asObject(raw);
  // Tolerate a plain-string script by putting it all in technical_reveal
  if (typeof raw === "string" && raw.trim() && Object.keys(obj).length === 0) {
    const sections = Object.fromEntries(SCRIPT_SECTION_KEYS.map((k) => [k, ""]));
    sections.technical_reveal = raw.trim();
    return sections;
  }
  const out: Record<string, string> = {};
  for (const key of SCRIPT_SECTION_KEYS) {
    out[key] = coerceString(obj[key] ?? obj[key.replace("_", " ")]);
  }
  return out;
}

function normalizeCarouselSlide(raw: unknown, index: number): Record<string, unknown> {
  const obj = asObject(raw);
  return {
    slide_number: coerceNumber(obj.slide_number, index + 1, 1, 20),
    headline: coerceString(obj.headline ?? obj.title, `Slide ${index + 1}`),
    body: coerceString(obj.body ?? obj.content ?? obj.text),
    visual_direction: coerceString(obj.visual_direction ?? obj.visual),
  };
}

function normalizeScriptArchitect(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  const scriptsObj = asObject(obj.scripts);
  const scripts: Record<string, unknown> = {};
  const durations: [string, string[]][] = [
    ["30s", ["30s", "30_seconds", "thirty"]],
    ["45s", ["45s", "45_seconds"]],
    ["60s", ["60s", "60_seconds", "1min"]],
    ["90s", ["90s", "90_seconds"]],
    ["3min", ["3min", "3_minutes", "180s", "deep_dive"]],
  ];
  for (const [key, aliases] of durations) {
    const found = aliases.map((a) => scriptsObj[a] ?? obj[`script_${a}`]).find(Boolean);
    scripts[key] = normalizeScriptSections(found);
  }
  const carouselObj = asObject(obj.carousel);
  const slides = asArray(carouselObj.slides ?? obj.carousel_slides ?? obj.carousel).map(
    normalizeCarouselSlide
  );
  return {
    scripts,
    carousel: { slides },
    talking_head_notes: coerceStringArray(obj.talking_head_notes),
    voiceover_notes: coerceStringArray(obj.voiceover_notes),
  };
}

export const ScriptSectionsSchema = z.object({
  hook: z.string(),
  setup: z.string(),
  mystery: z.string(),
  technical_reveal: z.string(),
  concrete_example: z.string(),
  twist: z.string(),
  payoff: z.string(),
  cta: z.string(),
});

export const ScriptArchitectSchema = z.preprocess(
  normalizeScriptArchitect,
  z.object({
    scripts: z.object({
      "30s": ScriptSectionsSchema,
      "45s": ScriptSectionsSchema,
      "60s": ScriptSectionsSchema,
      "90s": ScriptSectionsSchema,
      "3min": ScriptSectionsSchema,
    }),
    carousel: z.object({
      slides: z.array(
        z.object({
          slide_number: z.number(),
          headline: z.string(),
          body: z.string(),
          visual_direction: z.string(),
        })
      ),
    }),
    talking_head_notes: z.array(z.string()),
    voiceover_notes: z.array(z.string()),
  })
);
export type ScriptArchitectOutput = z.infer<typeof ScriptArchitectSchema>;

// ---------- Visual Director ----------

function normalizeStyleProfile(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  return {
    visual_keywords: coerceStringArray(obj.visual_keywords ?? obj.keywords),
    color_palette: coerceStringArray(obj.color_palette ?? obj.colors),
    typography_suggestions: coerceStringArray(obj.typography_suggestions ?? obj.typography),
    texture: coerceString(obj.texture),
    composition_rules: coerceStringArray(obj.composition_rules ?? obj.composition),
  };
}

function normalizeStoryboardBeat(raw: unknown, index: number): Record<string, unknown> {
  const obj = asObject(raw);
  return {
    timestamp: coerceString(obj.timestamp ?? obj.time, `beat ${index + 1}`),
    visual: coerceString(obj.visual ?? obj.scene),
    on_screen_text: coerceString(obj.on_screen_text ?? obj.text),
    motion: coerceString(obj.motion ?? obj.movement),
    asset_prompt: coerceString(obj.asset_prompt ?? obj.prompt),
  };
}

function normalizeVisualDirector(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  return {
    style_profile: normalizeStyleProfile(obj.style_profile ?? obj.style),
    reel_storyboard: asArray(obj.reel_storyboard ?? obj.storyboard).map(normalizeStoryboardBeat),
    carousel_design: asArray(obj.carousel_design).map(normalizeCarouselSlide),
    higgsfield_prompt: coerceString(obj.higgsfield_prompt),
    kling_prompt: coerceString(obj.kling_prompt),
    thumbnail_prompt: coerceString(obj.thumbnail_prompt),
  };
}

export const VisualDirectorSchema = z.preprocess(
  normalizeVisualDirector,
  z.object({
    style_profile: z.object({
      visual_keywords: z.array(z.string()),
      color_palette: z.array(z.string()),
      typography_suggestions: z.array(z.string()),
      texture: z.string(),
      composition_rules: z.array(z.string()),
    }),
    reel_storyboard: z.array(
      z.object({
        timestamp: z.string(),
        visual: z.string(),
        on_screen_text: z.string(),
        motion: z.string(),
        asset_prompt: z.string(),
      })
    ),
    carousel_design: z.array(
      z.object({
        slide_number: z.number(),
        headline: z.string(),
        body: z.string(),
        visual_direction: z.string(),
      })
    ),
    higgsfield_prompt: z.string(),
    kling_prompt: z.string(),
    thumbnail_prompt: z.string(),
  })
);
export type VisualDirectorOutput = z.infer<typeof VisualDirectorSchema>;

// ---------- Engagement Engineer ----------

function normalizeEngagementEngineer(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  return {
    caption: coerceString(obj.caption),
    caption_variants: coerceStringArray(obj.caption_variants ?? obj.variants),
    pinned_comment: coerceString(obj.pinned_comment),
    comment_bait_questions: coerceStringArray(
      obj.comment_bait_questions ?? obj.comment_bait
    ),
    save_trigger: coerceString(obj.save_trigger),
    share_trigger: coerceString(obj.share_trigger),
    cta_variants: coerceStringArray(obj.cta_variants),
    controversy_levers: coerceStringArray(obj.controversy_levers),
    safe_claims_boundary: coerceStringArray(obj.safe_claims_boundary ?? obj.safe_claims),
    post_titles: coerceStringArray(obj.post_titles ?? obj.titles),
  };
}

export const EngagementEngineerSchema = z.preprocess(
  normalizeEngagementEngineer,
  z.object({
    caption: z.string(),
    caption_variants: z.array(z.string()),
    pinned_comment: z.string(),
    comment_bait_questions: z.array(z.string()),
    save_trigger: z.string(),
    share_trigger: z.string(),
    cta_variants: z.array(z.string()),
    controversy_levers: z.array(z.string()),
    safe_claims_boundary: z.array(z.string()),
    post_titles: z.array(z.string()),
  })
);
export type EngagementEngineerOutput = z.infer<typeof EngagementEngineerSchema>;

// ---------- Virality Critic 2.0 ----------

export const CRITIC_DIMENSIONS = [
  "scroll_stop_hook",
  "curiosity_gap",
  "clarity",
  "technical_depth",
  "novelty",
  "shareability",
  "save_worthiness",
  "comment_potential",
  "visual_potential",
  "brand_fit",
  "hallucination_risk",
  "overclaiming_risk",
  "student_project_potential",
] as const;
export type CriticDimension = (typeof CRITIC_DIMENSIONS)[number];

function coerceRecommendation(value: unknown): "publish" | "revise" | "reject" {
  const v = coerceString(value).toLowerCase();
  if (v.includes("publish")) return "publish";
  if (v.includes("reject")) return "reject";
  return "revise";
}

function normalizeViralityCritic(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  const dims = asObject(obj.dimension_scores ?? obj.dimensions);
  const dimension_scores: Record<string, number> = {};
  for (const dim of CRITIC_DIMENSIONS) {
    dimension_scores[dim] = coerceNumber(dims[dim] ?? obj[dim], 5);
  }
  return {
    overall_score: coerceNumber(obj.overall_score ?? obj.overall, 50, 1, 100),
    dimension_scores,
    top_3_issues: coerceStringArray(obj.top_3_issues ?? obj.issues).slice(0, 3),
    specific_rewrites: coerceStringArray(obj.specific_rewrites ?? obj.rewrites),
    final_recommendation: coerceRecommendation(obj.final_recommendation ?? obj.recommendation),
  };
}

export const ViralityCriticSchema = z.preprocess(
  normalizeViralityCritic,
  z.object({
    overall_score: z.number(),
    dimension_scores: z.record(z.string(), z.number()),
    top_3_issues: z.array(z.string()),
    specific_rewrites: z.array(z.string()),
    final_recommendation: z.enum(["publish", "revise", "reject"]),
  })
);
export type ViralityCriticOutput = z.infer<typeof ViralityCriticSchema>;

// ---------- Project Bridge ----------

function coerceStudentLevel(value: unknown): "middle_school" | "high_school" | "college" {
  const v = coerceString(value).toLowerCase();
  if (v.includes("middle")) return "middle_school";
  if (v.includes("college") || v.includes("uni")) return "college";
  return "high_school";
}

function normalizeProjectBridge(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  return {
    project_title: coerceString(obj.project_title ?? obj.title, "Student rebuild project"),
    student_level: coerceStudentLevel(obj.student_level ?? obj.level),
    what_they_build: coerceString(obj.what_they_build ?? obj.build),
    concepts_learned: coerceStringArray(obj.concepts_learned ?? obj.concepts),
    dataset_or_simulation_needed: coerceString(
      obj.dataset_or_simulation_needed ?? obj.dataset,
      "Toy dataset only"
    ),
    interactive_demo_spec: asObject(obj.interactive_demo_spec ?? obj.demo_spec),
    one_hour_version: coerceString(obj.one_hour_version ?? obj["1_hour_version"]),
    one_week_version: coerceString(obj.one_week_version ?? obj["1_week_version"]),
    portfolio_version: coerceString(obj.portfolio_version),
  };
}

export const ProjectBridgeSchema = z.preprocess(
  normalizeProjectBridge,
  z.object({
    project_title: z.string(),
    student_level: z.enum(["middle_school", "high_school", "college"]),
    what_they_build: z.string(),
    concepts_learned: z.array(z.string()),
    dataset_or_simulation_needed: z.string(),
    interactive_demo_spec: z.record(z.string(), z.unknown()),
    one_hour_version: z.string(),
    one_week_version: z.string(),
    portfolio_version: z.string(),
  })
);
export type ProjectBridgeOutput = z.infer<typeof ProjectBridgeSchema>;

// ---------- Style Extractor (reference-image vision call) ----------

function normalizeStyleExtractor(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  const base = normalizeStyleProfile(obj);
  return {
    ...base,
    name: coerceString(obj.name, "Extracted style"),
    prompt_snippet: coerceString(obj.prompt_snippet ?? obj.style_prompt),
  };
}

export const StyleExtractorSchema = z.preprocess(
  normalizeStyleExtractor,
  z.object({
    name: z.string(),
    visual_keywords: z.array(z.string()),
    color_palette: z.array(z.string()),
    typography_suggestions: z.array(z.string()),
    texture: z.string(),
    composition_rules: z.array(z.string()),
    prompt_snippet: z.string().min(20, "prompt_snippet must be a usable style instruction"),
  })
);
export type StyleExtractorOutput = z.infer<typeof StyleExtractorSchema>;

// ---------- Stage output union (for typed consumers) ----------

export interface ViralStageOutputs {
  curiosity_miner?: CuriosityMinerOutput;
  expert_research?: ExpertResearchOutput;
  hook_lab?: HookLabOutput;
  script_architect?: ScriptArchitectOutput;
  visual_director?: VisualDirectorOutput;
  engagement_engineer?: EngagementEngineerOutput;
  virality_critic?: ViralityCriticOutput;
  project_bridge?: ProjectBridgeOutput;
}
