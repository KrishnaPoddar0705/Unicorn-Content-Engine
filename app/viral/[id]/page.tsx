import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PipelineDriver, type StageState } from "@/components/viral/pipeline-driver";
import { CockpitTabs } from "@/components/viral/cockpit-tabs";
import { ExportMenu } from "@/components/viral/export-menu";
import {
  getEpisodeRevisions,
  getEpisodeScore,
  getViralEpisode,
  getViralEpisodeOutputs,
} from "@/lib/db/viral-queries";
import type { ViralStageOutputs } from "@/lib/prompts/viral/output-schemas";

export default async function ViralEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [episode, outputs, score, revisions] = await Promise.all([
    getViralEpisode(id),
    getViralEpisodeOutputs(id),
    getEpisodeScore(id),
    getEpisodeRevisions(id),
  ]);
  if (!episode) notFound();

  const outputMap: Record<string, unknown> = {};
  for (const row of outputs) {
    if (row.status === "success" && row.output) outputMap[row.stage] = row.output;
  }

  const stageStates: StageState[] = outputs.map((o) => ({
    stage: o.stage,
    status: o.status,
    error: o.error,
  }));

  return (
    <div className="space-y-6 p-8">
      <div>
        <Link
          href="/viral"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Viral Lab
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {episode.input_mode.replace("_", " ")}
              </Badge>
              {episode.domain && (
                <Badge variant="secondary" className="capitalize">
                  {episode.domain}
                </Badge>
              )}
              {episode.content_series_templates && (
                <Badge variant="secondary">{episode.content_series_templates.name}</Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {episode.platform.replace(/_/g, " ")}
              </Badge>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              {episode.title}
            </h1>
            {episode.winner_hook && (
              <p className="mt-1 text-muted-foreground">“{episode.winner_hook}”</p>
            )}
          </div>
          <ExportMenu episode={episode} outputs={outputMap as ViralStageOutputs} />
        </div>
      </div>

      <PipelineDriver
        episodeId={episode.id}
        initialStages={stageStates}
        initialStatus={episode.status}
      />

      <CockpitTabs
        episode={episode}
        outputs={outputMap as ViralStageOutputs}
        score={score}
        revisions={revisions}
      />
    </div>
  );
}
