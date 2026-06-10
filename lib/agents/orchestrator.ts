import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabase/server";
import { deconstructPaper } from "./paper-deconstruction";
import { writeScript } from "./scriptwriting";
import { generateDemoSpec } from "./demo-spec";
import { critiqueContent } from "./quality-critic";
import type { Paper, Episode } from "@/lib/supabase/types";
import type { ScriptPreferences } from "./script-preferences";

export interface EpisodePipelineResult {
  episodeId: string;
  pipelineId: string;
  deconstruction: Awaited<ReturnType<typeof deconstructPaper>>;
  script: Awaited<ReturnType<typeof writeScript>>;
  demoSpec: Awaited<ReturnType<typeof generateDemoSpec>>;
  quality: Awaited<ReturnType<typeof critiqueContent>>;
}

export async function runEpisodePipeline(params: {
  episodeId?: string;
  paperId?: string;
  episodeTitle?: string;
  targetAudience?: string;
  contentPillarId?: string;
  scriptPreferences?: Partial<ScriptPreferences>;
}): Promise<EpisodePipelineResult> {
  const supabase = getSupabase();
  const pipelineId = randomUUID();

  let paper: Paper | null = null;
  let episode: Episode | null = null;

  if (params.episodeId) {
    const { data } = await supabase
      .from("episodes")
      .select("*, papers(*)")
      .eq("id", params.episodeId)
      .single();
    episode = data;
    paper = data?.papers || null;
  }

  if (params.paperId && !paper) {
    const { data } = await supabase.from("papers").select("*").eq("id", params.paperId).single();
    paper = data;
  }

  if (!paper) throw new Error("Paper not found for episode generation");

  if (!episode) {
    const { count } = await supabase.from("episodes").select("*", { count: "exact", head: true });
    const { data: newEpisode } = await supabase
      .from("episodes")
      .insert({
        episode_number: (count || 0) + 1,
        title: params.episodeTitle || `I rebuilt: ${paper.title}`,
        paper_id: paper.id,
        content_pillar_id: params.contentPillarId,
        target_audience: params.targetAudience || "student",
        status: "draft",
        demo_build_status: "not_started",
      })
      .select()
      .single();
    episode = newEpisode;
  }

  const ctx = { pipelineId, episodeId: episode!.id, paperId: paper.id };

  const episodePrefs =
    params.scriptPreferences ||
    ((episode as Episode & { script_preferences?: Partial<ScriptPreferences> })?.script_preferences ?? null);

  const deconstruction = await deconstructPaper(paper, ctx);

  const [script, demoSpec] = await Promise.all([
    writeScript(deconstruction, episode!.title, ctx, episodePrefs),
    generateDemoSpec(deconstruction, episode!.title, ctx),
  ]);

  const quality = await critiqueContent(
    {
      episodeTitle: episode!.title,
      hook: script.hook_3s,
      script60: script.script_60s,
      caption: script.caption,
      demoSpec: JSON.stringify(demoSpec),
      deconstruction: JSON.stringify(deconstruction),
    },
    ctx
  );

  // Save script
  await supabase.from("scripts").upsert(
    {
      episode_id: episode!.id,
      hook_3s: script.hook_3s,
      hook_options: script.hook_options,
      script_45s: script.script_45s,
      script_60s: script.script_60s,
      script_90s: script.script_90s,
      caption: script.caption,
      first_comment: script.first_comment,
      hashtags: script.hashtags,
      carousel_slides: script.carousel_slides,
      title_variants: script.title_variants,
      thumbnail_text: script.thumbnail_text,
      parent_angle: script.parent_angle,
      student_angle: script.student_angle,
      school_angle: script.school_angle,
      founder_angle: script.founder_angle,
      cta: script.cta,
      explain_curious: script.explain_curious,
      b_roll_suggestions: script.b_roll_suggestions,
      visual_props: script.visual_props,
    },
    { onConflict: "episode_id" }
  );

  // Save demo spec
  const slug = demoSpec.component_key_suggestion
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  await supabase.from("demos").upsert(
    {
      episode_id: episode!.id,
      slug: slug || `demo-${episode!.episode_number}`,
      title: demoSpec.demo_title,
      description: demoSpec.expected_result,
      spec: demoSpec,
      status: "spec",
      educational_notes: demoSpec.educational_notes,
    },
    { onConflict: "slug" }
  );

  // Save quality scores
  await supabase.from("quality_scores").insert({
    episode_id: episode!.id,
    hook_strength: quality.hook_strength,
    surprise_factor: quality.surprise_factor,
    student_relevance: quality.student_relevance,
    parent_relevance: quality.parent_relevance,
    demo_feasibility: quality.demo_feasibility,
    shareability: quality.shareability,
    brand_fit: quality.brand_fit,
    overall_viral_score: quality.overall_viral_score,
    clarity: quality.clarity,
    authenticity: quality.authenticity,
    educational_value: quality.educational_value,
    rebuildability: quality.rebuildability,
    explanation: quality.explanation,
    improvements: quality.improvements,
  });

  // Update episode
  await supabase
    .from("episodes")
    .update({
      viral_hook: deconstruction.instagram_hook || script.hook_3s,
      why_cool: deconstruction.why_this_matters,
      parent_positioning: script.parent_angle,
      one_line_positioning: script.positioning_line,
      student_project_extension: deconstruction.mini_project_idea,
      status: "script_ready",
      demo_build_status: "spec_ready",
      ...(params.scriptPreferences ? { script_preferences: params.scriptPreferences } : {}),
    })
    .eq("id", episode!.id);

  // Update paper metadata
  await supabase
    .from("papers")
    .update({
      core_idea: deconstruction.one_sentence_summary,
      suggested_project: deconstruction.mini_project_idea,
      content_status: "episode_created",
      metadata: {
        deconstruction,
        method: deconstruction.method,
        result: deconstruction.result,
      },
    })
    .eq("id", paper.id);

  return {
    episodeId: episode!.id,
    pipelineId,
    deconstruction,
    script,
    demoSpec,
    quality,
  };
}
