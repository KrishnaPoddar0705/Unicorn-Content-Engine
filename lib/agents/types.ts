import { z } from "zod";
import {
  coerceCitationStatus,
  coerceDifficultyLevel,
  coerceRebuildType,
  normalizeDeconstruction,
  normalizePaperIngestion,
  normalizeDemoSpec,
  normalizeQualityCritic,
  normalizeScriptwriting,
} from "./coerce";

const difficultyLevelSchema = z.preprocess(
  coerceDifficultyLevel,
  z.enum(["beginner", "intermediate", "advanced"])
);

const citationStatusSchema = z.preprocess(
  coerceCitationStatus,
  z.enum(["verified", "research_inspired", "pending_verification"])
);

export const DeconstructionSchema = z.preprocess(
  normalizeDeconstruction,
  z.object({
    one_sentence_summary: z.string(),
    core_research_question: z.string(),
    problem: z.string(),
    method: z.string(),
    result: z.string(),
    analogy: z.string(),
    why_this_matters: z.string(),
    common_misunderstanding: z.string(),
    student_rebuild_plan: z.string(),
    mini_project_idea: z.string(),
    difficulty_level: difficultyLevelSchema,
    rebuild_type: z.string(),
    required_data: z.string(),
    instagram_hook: z.string(),
    citation_status: citationStatusSchema.optional(),
  })
);

export const ScriptwritingSchema = z.preprocess(
  normalizeScriptwriting,
  z.object({
    hook_3s: z.string(),
    hook_options: z.array(z.string()).length(3),
    script_45s: z.string().min(80, "script_45s must be a complete spoken script"),
    script_60s: z.string().min(100, "script_60s must be a complete spoken script"),
    script_90s: z.string().min(120, "script_90s must be a complete spoken script"),
    caption: z.string(),
    first_comment: z.string(),
    hashtags: z.array(z.string()),
    carousel_slides: z.array(z.object({ title: z.string(), body: z.string() })),
    title_variants: z.array(z.string()),
    thumbnail_text: z.string(),
    parent_angle: z.string(),
    student_angle: z.string(),
    school_angle: z.string(),
    founder_angle: z.string(),
    cta: z.string(),
    explain_curious: z.string(),
    b_roll_suggestions: z.array(z.string()),
    visual_props: z.array(z.string()),
    positioning_line: z.string(),
  })
);

export const DemoSpecSchema = z.preprocess(
  normalizeDemoSpec,
  z.object({
    demo_title: z.string(),
    user_inputs: z.array(z.string()),
    sample_dataset: z.string(),
    algorithm_or_heuristic: z.string(),
    visualization: z.string(),
    step_by_step_interaction: z.array(z.string()),
    expected_result: z.string(),
    ui_layout: z.string(),
    educational_notes: z.string(),
    code_implementation_plan: z.string(),
    edge_cases: z.array(z.string()),
    simplicity_notes: z.string(),
    component_key_suggestion: z.string(),
  })
);

export const QualityCriticSchema = z.preprocess(
  normalizeQualityCritic,
  z.object({
    hook_strength: z.number().min(1).max(10),
    surprise_factor: z.number().min(1).max(10),
    student_relevance: z.number().min(1).max(10),
    parent_relevance: z.number().min(1).max(10),
    demo_feasibility: z.number().min(1).max(10),
    shareability: z.number().min(1).max(10),
    brand_fit: z.number().min(1).max(10),
    clarity: z.number().min(1).max(10),
    authenticity: z.number().min(1).max(10),
    educational_value: z.number().min(1).max(10),
    rebuildability: z.number().min(1).max(10),
    explanation: z.string(),
    improvements: z.array(z.string()),
  })
);

export const ResearchScoutSchema = z.object({
  suggestions: z.array(
    z.object({
      paper_title: z.string(),
      research_idea: z.string(),
      hook: z.string(),
      why_viral: z.string(),
      rebuildability_score: z.number(),
      demo_idea: z.string(),
      target_audience: z.string(),
      difficulty_level: z.string(),
      citation_status: z.enum(["verified", "research_inspired", "pending_verification"]),
    })
  ),
});

export const CalendarStrategistSchema = z.object({
  items: z.array(
    z.object({
      episode_number: z.number(),
      scheduled_date: z.string(),
      post_title: z.string(),
      pillar_code: z.string(),
      target_audience: z.string(),
      primary_cta: z.string(),
      ordering_reason: z.string(),
      recording_notes: z.string(),
      viral_mechanism: z.string(),
      format: z.enum(["reel", "carousel", "story"]),
    })
  ),
});

const rebuildTypeSchema = z.preprocess(
  coerceRebuildType,
  z.enum([
    "simulation",
    "toy_model",
    "dashboard",
    "calculator",
    "visualizer",
    "game",
    "classifier",
    "recommender",
    "network_graph",
  ])
);

export const PaperIngestionSchema = z.preprocess(
  normalizePaperIngestion,
  z.object({
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number().nullable(),
    abstract: z.string(),
    problem_statement: z.string(),
    method: z.string(),
    key_result: z.string(),
    limitations: z.string(),
    core_insight: z.string(),
    possible_mini_demo: z.string(),
    possible_instagram_hook: z.string(),
    possible_student_project: z.string(),
    difficulty_level: difficultyLevelSchema,
    required_data: z.string(),
    rebuild_type: rebuildTypeSchema,
    citation_status: citationStatusSchema,
  })
);

export type Deconstruction = z.infer<typeof DeconstructionSchema>;
export type Scriptwriting = z.infer<typeof ScriptwritingSchema>;
export type DemoSpec = z.infer<typeof DemoSpecSchema>;
export type QualityCritic = z.infer<typeof QualityCriticSchema>;
export type ResearchScout = z.infer<typeof ResearchScoutSchema>;
export type CalendarStrategist = z.infer<typeof CalendarStrategistSchema>;
export type PaperIngestion = z.infer<typeof PaperIngestionSchema>;
