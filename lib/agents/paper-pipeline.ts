import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabase/server";
import { ingestPaperText } from "./paper-ingestion";
import { runEpisodePipeline, type EpisodePipelineResult } from "./orchestrator";
import { buildInteractiveWebpage } from "./interactive-webpage";
import { saveInteractiveWebpage } from "./save-interactive-webpage";
import { savePaperFromIngestion } from "@/lib/papers/save-paper";
import type { PaperIngestion } from "./types";
import type { Paper } from "@/lib/supabase/types";

export interface PaperPipelineResult {
  pipelineId: string;
  ingestion: PaperIngestion;
  paper: Paper;
  episode: EpisodePipelineResult;
  webapp: {
    slug: string;
    url: string;
    title: string;
    theme: string;
  };
}

export async function runPaperIngestionPipeline(params: {
  text: string;
  sourceUrl?: string;
  episodeTitle?: string;
}): Promise<PaperPipelineResult> {
  const pipelineId = randomUUID();
  const text = params.text.trim();
  if (text.length < 50) {
    throw new Error("Please provide at least 50 characters of paper text");
  }

  const ingestion = await ingestPaperText(text, params.sourceUrl, { pipelineId });
  const paper = await savePaperFromIngestion(ingestion, text, params.sourceUrl);

  const episodeTitle =
    params.episodeTitle ||
    ingestion.possible_instagram_hook ||
    `I rebuilt: ${ingestion.title}`.slice(0, 120);

  const episode = await runEpisodePipeline({
    paperId: paper.id,
    episodeTitle,
  });

  const supabase = getSupabase();
  const { data: episodeRow } = await supabase
    .from("episodes")
    .select("episode_number, title")
    .eq("id", episode.episodeId)
    .single();

  if (!episodeRow) throw new Error("Episode not found after pipeline");

  const { data: updatedPaper } = await supabase
    .from("papers")
    .select("*")
    .eq("id", paper.id)
    .single();

  const paperForWebapp = (updatedPaper || paper) as Paper;

  const webappOutput = await buildInteractiveWebpage(
    paperForWebapp,
    episode.deconstruction,
    episodeRow.title,
    { pipelineId, episodeId: episode.episodeId, paperId: paper.id }
  );

  const savedWebapp = await saveInteractiveWebpage({
    episodeId: episode.episodeId,
    paperId: paper.id,
    episodeNumber: episodeRow.episode_number,
    title: webappOutput.title,
    theme: webappOutput.theme,
    slug: webappOutput.slug,
    html: webappOutput.html,
  });

  return {
    pipelineId,
    ingestion,
    paper: paperForWebapp,
    episode,
    webapp: {
      slug: savedWebapp.slug,
      url: `/webapps/${savedWebapp.slug}`,
      title: savedWebapp.title,
      theme: savedWebapp.theme,
    },
  };
}
