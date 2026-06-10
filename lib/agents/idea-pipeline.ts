import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabase/server";
import { scoutForContentIdea } from "./research-scout";
import { runEpisodePipeline } from "./orchestrator";
import type { EpisodePipelineResult } from "./orchestrator";
import type { DifficultyLevel, TargetAudience } from "@/lib/supabase/types";
import { coerceDifficultyLevel } from "./coerce";

export interface IdeaPipelineResult extends EpisodePipelineResult {
  paperId: string;
  contentIdea: string;
  selectedPaperTitle: string;
}

export async function runIdeaPipeline(params: {
  contentIdea: string;
  episodeTitle?: string;
  targetAudience?: TargetAudience;
  contentPillarId?: string;
  scriptPreferences?: Record<string, string>;
}): Promise<IdeaPipelineResult> {
  const supabase = getSupabase();
  const pipelineId = randomUUID();
  const contentIdea = params.contentIdea.trim();
  if (!contentIdea) throw new Error("Content idea is required");

  const scout = await scoutForContentIdea(contentIdea, {
    pipelineId,
    count: 5,
  });

  const best = [...scout.suggestions].sort(
    (a, b) => b.rebuildability_score - a.rebuildability_score
  )[0];

  if (!best) throw new Error("No suitable papers found for this content idea");

  const difficulty = coerceDifficultyLevel(best.difficulty_level) as DifficultyLevel;

  const { data: paper, error: paperError } = await supabase
    .from("papers")
    .insert({
      title: best.paper_title,
      authors: [],
      abstract: best.research_idea,
      raw_text: [
        `Content idea: ${contentIdea}`,
        `Research angle: ${best.research_idea}`,
        `Hook: ${best.hook}`,
        `Why viral: ${best.why_viral}`,
        `Demo idea: ${best.demo_idea}`,
      ].join("\n\n"),
      topic: contentIdea,
      core_idea: best.research_idea,
      why_cool: best.why_viral,
      difficulty_level: difficulty,
      citation_status: best.citation_status,
      content_status: "idea",
      is_rebuildable: true,
      suggested_project: best.demo_idea,
      metadata: {
        content_idea: contentIdea,
        scout_hook: best.hook,
        demo_idea: best.demo_idea,
        rebuildability_score: best.rebuildability_score,
      },
    })
    .select()
    .single();

  if (paperError || !paper) throw paperError || new Error("Failed to create paper from research");

  const episodeTitle =
    params.episodeTitle ||
    best.hook ||
    `I rebuilt: ${best.paper_title}`.slice(0, 120);

  const result = await runEpisodePipeline({
    paperId: paper.id,
    episodeTitle,
    targetAudience: params.targetAudience,
    contentPillarId: params.contentPillarId,
    scriptPreferences: params.scriptPreferences,
  });

  await supabase
    .from("episodes")
    .update({
      topic: contentIdea,
      script_preferences: params.scriptPreferences || {},
    })
    .eq("id", result.episodeId);

  return {
    ...result,
    paperId: paper.id,
    contentIdea,
    selectedPaperTitle: best.paper_title,
  };
}
