import { runAgent, newPipelineId } from "@/lib/agents/runner";
import { getSupabase } from "@/lib/supabase/server";
import {
  SERIES_ARCHITECT_SYSTEM,
  SeriesArchitectSchema,
  buildSeriesArchitectPrompt,
  type SeriesArchitectOutput,
} from "@/lib/prompts/viral/series-architect";
import { createViralEpisode } from "@/lib/agents/viral/pipeline";

export interface CreateSeriesParams {
  topic: string;
  domain?: string | null;
  target_audience?: string;
  depth?: string;
  tone?: string;
  platform?: string;
  partsHint?: number | null;
}

const SERIES_CORRECTION =
  "Your previous JSON was invalid or incomplete. Return ONE valid JSON object: { series_title, premise, parts: [{ part_number, working_title, covers, first_principles_reframe, interdisciplinary_bridges, india_angle, teases_next }] }. part_number must be sequential starting at 1.";

/** Plans the multi-part arc for a topic (no DB writes). */
export async function planSeries(params: CreateSeriesParams): Promise<SeriesArchitectOutput> {
  const { output } = await runAgent({
    agentName: "labs_series_architect",
    userPrompt: buildSeriesArchitectPrompt({
      topic: params.topic,
      domain: params.domain,
      audience: params.target_audience,
      partsHint: params.partsHint,
    }),
    schema: SeriesArchitectSchema,
    context: { pipelineId: newPipelineId() },
    extraSystem: SERIES_ARCHITECT_SYSTEM,
    correctionMessage: SERIES_CORRECTION,
    temperature: 0.8,
    maxTokens: 16000,
  });
  // Normalize part numbering so downstream continuity ordering is reliable.
  const parts = [...output.parts]
    .sort((a, b) => a.part_number - b.part_number)
    .map((p, i) => ({ ...p, part_number: i + 1 }));
  return { ...output, parts };
}

/**
 * Plans a series, persists the viral_series row, and creates one queued
 * viral_episode (vertical='labs') per planned part. Parts are NOT auto-run —
 * the user generates each from the series board, driving the existing pipeline.
 */
export async function createSeries(params: CreateSeriesParams): Promise<{ seriesId: string }> {
  const supabase = getSupabase();
  const arc = await planSeries(params);

  const target_audience = params.target_audience || "general_curious_adult";
  const depth = params.depth || "extremely_technical";
  const tone = params.tone || "founder_led";
  const platform = params.platform || "instagram_reels";

  const { data: series, error } = await supabase
    .from("viral_series")
    .insert({
      title: arc.series_title,
      topic: params.topic,
      premise: arc.premise,
      domain: params.domain || null,
      target_audience,
      depth,
      tone,
      platform,
      total_parts: arc.parts.length,
      arc,
      status: "planned",
      vertical: "labs",
    })
    .select("id")
    .single();
  if (error || !series) {
    throw new Error(`Failed to create series: ${error?.message}`);
  }

  const seriesId = series.id as string;

  // Create one queued episode per part, in order.
  for (const part of arc.parts) {
    await createViralEpisode({
      title: part.working_title,
      input_mode: "topic",
      domain: params.domain || null,
      raw_input: part.covers,
      target_audience,
      depth,
      output_format: "all",
      tone,
      platform,
      visual_style_mode: "default",
      vertical: "labs",
      series_id: seriesId,
      part_number: part.part_number,
    });
  }

  return { seriesId };
}
