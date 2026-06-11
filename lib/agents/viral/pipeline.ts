import type { ZodSchema } from "zod";
import { getSupabase } from "@/lib/supabase/server";
import { runAgent } from "@/lib/agents/runner";
import type {
  ViralEpisode,
  ViralEpisodeOutput,
  ViralStage,
  ViralEpisodeStatus,
} from "@/lib/supabase/types";
import { buildSharedContext } from "@/lib/prompts/viral/shared-brand-context";
import { getRevisionAction } from "@/lib/prompts/viral/revision-actions";
import type { ViralStageOutputs } from "@/lib/prompts/viral/output-schemas";
import { buildContentMemorySummary } from "@/lib/viral/content-memory";
import {
  VIRAL_STAGES,
  VIRAL_SCHEMAS,
  STAGE_ORDER,
  getStageDef,
  type StageRunCtx,
} from "./stages";

/** Stages that see Krishna's content memory. Research and the critic stay unbiased. */
const MEMORY_STAGES: ViralStage[] = [
  "curiosity_miner",
  "hook_lab",
  "script_architect",
  "engagement_engineer",
];

/** A stage stuck in "running" longer than this is considered dead and re-claimable. */
const STALE_RUNNING_MS = 6 * 60 * 1000;

export interface ViralPipelineStatus {
  episode: ViralEpisode;
  outputs: ViralEpisodeOutput[];
  ranStages: ViralStage[];
}

async function fetchEpisode(episodeId: string): Promise<ViralEpisode> {
  const { data, error } = await getSupabase()
    .from("viral_episodes")
    .select("*, content_series_templates(*), style_profiles(*), reference_images(*)")
    .eq("id", episodeId)
    .single();
  if (error || !data) throw new Error(`Viral episode not found: ${episodeId}`);
  return data as ViralEpisode;
}

async function fetchOutputs(episodeId: string): Promise<ViralEpisodeOutput[]> {
  const { data } = await getSupabase()
    .from("viral_episode_outputs")
    .select("*")
    .eq("viral_episode_id", episodeId);
  const rows = (data || []) as ViralEpisodeOutput[];
  return rows.sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
}

function collectOutputs(rows: ViralEpisodeOutput[]): ViralStageOutputs {
  const map: Record<string, unknown> = {};
  for (const row of rows) {
    if (row.status === "success" && row.output) map[row.stage] = row.output;
  }
  return map as ViralStageOutputs;
}

function resolveStyleInstruction(episode: ViralEpisode): string | undefined {
  if (episode.visual_style_mode === "pasted_prompt" && episode.pasted_style_prompt) {
    return episode.pasted_style_prompt;
  }
  if (episode.visual_style_mode === "reference_image") {
    return episode.style_profiles?.profile?.prompt_snippet || undefined;
  }
  return undefined;
}

function rollupStatus(rows: ViralEpisodeOutput[]): {
  status: ViralEpisodeStatus;
  currentStage: ViralStage | null;
} {
  const anyFailed = rows.some((r) => r.status === "failed");
  const allSuccess = rows.length > 0 && rows.every((r) => r.status === "success");
  const running = rows.find((r) => r.status === "running");
  const pending = rows.find((r) => r.status === "pending");
  if (allSuccess) return { status: "complete", currentStage: null };
  if (anyFailed && !running && !pending) return { status: "failed", currentStage: null };
  if (anyFailed && !running) {
    // failed stage blocks downstream pending stages
    const blocked = rows
      .filter((r) => r.status === "pending")
      .every((r) => getStageDef(r.stage).deps.some((d) => rows.find((x) => x.stage === d)?.status !== "success"));
    if (blocked) return { status: "failed", currentStage: null };
  }
  return {
    status: anyFailed && !running && !pending ? "failed" : "running",
    currentStage: (running ?? pending)?.stage ?? null,
  };
}

async function updateEpisodeRollup(episodeId: string, rows: ViralEpisodeOutput[]) {
  const { status, currentStage } = rollupStatus(rows);
  await getSupabase()
    .from("viral_episodes")
    .update({ status, current_stage: currentStage })
    .eq("id", episodeId);
  return status;
}

/** Marks stages stuck in "running" past the staleness window as failed. */
async function failStaleRunning(rows: ViralEpisodeOutput[]): Promise<ViralEpisodeOutput[]> {
  const now = Date.now();
  const stale = rows.filter(
    (r) =>
      r.status === "running" &&
      r.started_at &&
      now - new Date(r.started_at).getTime() > STALE_RUNNING_MS
  );
  for (const row of stale) {
    await getSupabase()
      .from("viral_episode_outputs")
      .update({ status: "failed", error: "Stage timed out (stale run); retry to re-run." })
      .eq("id", row.id)
      .eq("status", "running");
    row.status = "failed";
    row.error = "Stage timed out (stale run); retry to re-run.";
  }
  return rows;
}

/** Pending stages whose dependencies are all successful. */
function runnableStages(rows: ViralEpisodeOutput[]): ViralStage[] {
  const statusOf = (stage: ViralStage) => rows.find((r) => r.stage === stage)?.status;
  return VIRAL_STAGES.filter(
    (def) =>
      statusOf(def.stage) === "pending" && def.deps.every((d) => statusOf(d) === "success")
  ).map((d) => d.stage);
}

/**
 * Runs the next runnable batch of stages for an episode. Designed to be called
 * repeatedly by the client driver until the episode is complete or failed.
 * Concurrency-safe: claims stages via conditional update.
 */
export async function advanceViralPipeline(episodeId: string): Promise<ViralPipelineStatus> {
  const supabase = getSupabase();
  const episode = await fetchEpisode(episodeId);
  let rows = await fetchOutputs(episodeId);

  // Backfill stages added after this episode was created (e.g. interactive_webpage).
  const missing = STAGE_ORDER.filter((stage) => !rows.some((r) => r.stage === stage));
  if (missing.length > 0) {
    const { error } = await supabase.from("viral_episode_outputs").insert(
      missing.map((stage) => ({ viral_episode_id: episodeId, stage, status: "pending" }))
    );
    // Insert fails if the DB enum predates the new stage (migration not applied) — skip silently.
    if (!error) rows = await fetchOutputs(episodeId);
  }

  rows = await failStaleRunning(rows);

  const runnable = runnableStages(rows);
  if (runnable.length === 0) {
    await updateEpisodeRollup(episodeId, rows);
    return { episode: await fetchEpisode(episodeId), outputs: rows, ranStages: [] };
  }

  // Claim: conditional update is the lock — a second caller's update matches 0 rows.
  const claimed: ViralStage[] = [];
  for (const stage of runnable) {
    const row = rows.find((r) => r.stage === stage)!;
    const { data } = await supabase
      .from("viral_episode_outputs")
      .update({
        status: "running",
        started_at: new Date().toISOString(),
        attempt: row.attempt + 1,
        error: null,
      })
      .eq("id", row.id)
      .eq("status", "pending")
      .select("id");
    if (data && data.length > 0) claimed.push(stage);
  }

  if (claimed.length === 0) {
    return { episode, outputs: await fetchOutputs(episodeId), ranStages: [] };
  }

  await supabase
    .from("viral_episodes")
    .update({ status: "running", current_stage: claimed[0] })
    .eq("id", episodeId);

  const memorySummary = MEMORY_STAGES.some((s) => claimed.includes(s))
    ? await buildContentMemorySummary()
    : "";
  const baseContext = buildSharedContext({
    episode,
    seriesSnippet: episode.content_series_templates?.prompt_snippet,
    styleSnippet:
      episode.visual_style_mode !== "default"
        ? resolveStyleInstruction(episode)
        : undefined,
  });

  const outputs = collectOutputs(rows);
  const styleInstruction = resolveStyleInstruction(episode);

  await Promise.allSettled(
    claimed.map(async (stage) => {
      const def = getStageDef(stage);
      const ctx: StageRunCtx = {
        episode,
        outputs,
        extraSystem: MEMORY_STAGES.includes(stage) && memorySummary
          ? `${baseContext}\n\n${memorySummary}`
          : baseContext,
        styleInstruction,
        context: { pipelineId: episode.pipeline_id, viralEpisodeId: episode.id },
      };
      const row = rows.find((r) => r.stage === stage)!;
      try {
        const output = await def.run(ctx);
        await supabase
          .from("viral_episode_outputs")
          .update({
            status: "success",
            output: output as Record<string, unknown>,
            completed_at: new Date().toISOString(),
            error: null,
          })
          .eq("id", row.id);

        if (stage === "hook_lab") {
          const hookOutput = output as { winner?: string; winner_archetype?: string };
          await supabase
            .from("viral_episodes")
            .update({
              winner_hook: hookOutput.winner || null,
              winner_archetype: hookOutput.winner_archetype || null,
            })
            .eq("id", episodeId);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Stage failed";
        await supabase
          .from("viral_episode_outputs")
          .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
          .eq("id", row.id);
      }
    })
  );

  const finalRows = await fetchOutputs(episodeId);
  await updateEpisodeRollup(episodeId, finalRows);
  return { episode: await fetchEpisode(episodeId), outputs: finalRows, ranStages: claimed };
}

export async function getViralStatus(episodeId: string): Promise<ViralPipelineStatus> {
  const [episode, outputs] = await Promise.all([fetchEpisode(episodeId), fetchOutputs(episodeId)]);
  return { episode, outputs, ranStages: [] };
}

export async function retryViralStage(
  episodeId: string,
  stage: ViralStage
): Promise<ViralPipelineStatus> {
  const supabase = getSupabase();
  await supabase
    .from("viral_episode_outputs")
    .update({ status: "pending", error: null, started_at: null, completed_at: null })
    .eq("viral_episode_id", episodeId)
    .eq("stage", stage)
    .in("status", ["failed", "success"]);
  await supabase
    .from("viral_episodes")
    .update({ status: "running", current_stage: stage })
    .eq("id", episodeId);
  return getViralStatus(episodeId);
}

/**
 * Re-runs one stage's output through its schema with a revision instruction,
 * records the revision in history, and updates the stored output in place.
 */
export async function reviseViralStage(params: {
  episodeId: string;
  stage: ViralStage;
  actionKey: string;
  customInstruction?: string;
}): Promise<{ output: unknown }> {
  const { episodeId, stage, actionKey, customInstruction } = params;
  const supabase = getSupabase();
  const episode = await fetchEpisode(episodeId);
  const rows = await fetchOutputs(episodeId);
  const row = rows.find((r) => r.stage === stage);
  if (!row || row.status !== "success" || !row.output) {
    throw new Error(`Stage ${stage} has no successful output to revise`);
  }

  if (!(stage in VIRAL_SCHEMAS)) {
    throw new Error(
      `The ${stage} stage cannot be revised in place — retry it from the pipeline rail to regenerate.`
    );
  }

  const action = actionKey === "custom" ? undefined : getRevisionAction(actionKey);
  const instruction =
    customInstruction?.trim() || action?.instruction;
  if (!instruction) throw new Error(`Unknown revision action: ${actionKey}`);

  const baseContext = buildSharedContext({
    episode,
    seriesSnippet: episode.content_series_templates?.prompt_snippet,
  });

  const prompt = `Here is the current ${stage} output for the episode "${episode.title}":

${JSON.stringify(row.output, null, 2)}

REVISION INSTRUCTION: ${instruction}

Apply this revision and return the COMPLETE updated JSON in the identical schema — every field present, unrelated fields preserved as they are unless the revision requires changing them.`;

  const schema = (VIRAL_SCHEMAS as Partial<Record<ViralStage, unknown>>)[
    stage
  ] as ZodSchema<unknown>;
  const { output, runId } = await runAgent<unknown>({
    agentName: `viral_revise_${stage}`,
    userPrompt: prompt,
    schema,
    context: { pipelineId: episode.pipeline_id, viralEpisodeId: episode.id },
    extraSystem: baseContext,
    correctionMessage:
      "Your previous JSON was invalid. Return ONE valid JSON object matching exactly the original schema with ALL fields present.",
    maxTokens: stage === "script_architect" ? 20000 : 12000,
  });

  await supabase.from("episode_revision_history").insert({
    viral_episode_id: episodeId,
    stage,
    action: actionKey,
    instruction,
    previous_output: row.output,
    new_output: output as Record<string, unknown>,
    agent_run_id: runId ?? null,
  });

  await supabase
    .from("viral_episode_outputs")
    .update({ output: output as Record<string, unknown> })
    .eq("id", row.id);

  if (stage === "hook_lab") {
    const hookOutput = output as { winner?: string; winner_archetype?: string };
    if (hookOutput.winner) {
      await supabase
        .from("viral_episodes")
        .update({
          winner_hook: hookOutput.winner,
          winner_archetype: hookOutput.winner_archetype || null,
        })
        .eq("id", episodeId);
    }
  }

  return { output };
}

/** Creates the episode row plus 8 pending stage rows. Returns the new episode id. */
export async function createViralEpisode(input: {
  title: string;
  input_mode: ViralEpisode["input_mode"];
  domain?: string | null;
  raw_input?: string | null;
  paper_text?: string | null;
  target_audience?: string;
  depth?: string;
  output_format?: string;
  tone?: string;
  cta_goal?: string | null;
  platform?: string;
  visual_style_mode?: ViralEpisode["visual_style_mode"];
  pasted_style_prompt?: string | null;
  series_template_id?: string | null;
  style_profile_id?: string | null;
  reference_image_id?: string | null;
}): Promise<string> {
  const supabase = getSupabase();
  const { data: episode, error } = await supabase
    .from("viral_episodes")
    .insert({
      ...input,
      pipeline_id: crypto.randomUUID(),
      status: "queued",
    })
    .select("id")
    .single();
  if (error || !episode) {
    throw new Error(`Failed to create viral episode: ${error?.message}`);
  }

  const { error: outputsError } = await supabase.from("viral_episode_outputs").insert(
    STAGE_ORDER.map((stage) => ({
      viral_episode_id: episode.id,
      stage,
      status: "pending",
    }))
  );
  if (outputsError) {
    throw new Error(`Failed to initialize pipeline stages: ${outputsError.message}`);
  }

  return episode.id as string;
}
