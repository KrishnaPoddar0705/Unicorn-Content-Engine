"use client";

import { Badge } from "@/components/ui/badge";
import { FieldBlock, ListBlock, WaitingFor } from "./panel-bits";
import { RevisionMenu } from "./revision-actions";
import type { CuriosityMinerOutput } from "@/lib/prompts/viral/output-schemas";

export function CuriosityPanel({
  episodeId,
  output,
}: {
  episodeId: string;
  output?: CuriosityMinerOutput;
}) {
  if (!output) return <WaitingFor stage="Curiosity Miner" />;
  return (
    <div className="space-y-3">
      <div className="glass-panel border-primary/30 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
                Best angle
              </p>
              <Badge variant="secondary" className="capitalize">
                {output.best_angle.target_emotion}
              </Badge>
            </div>
            <p className="mt-1 font-display text-xl font-semibold">{output.best_angle.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {output.best_angle.why_it_stops_scroll}
            </p>
          </div>
          <RevisionMenu episodeId={episodeId} stage="curiosity_miner" />
        </div>
      </div>
      <FieldBlock label="Core paradox" value={output.core_paradox} />
      <FieldBlock label="Hidden mechanism" value={output.hidden_mechanism} />
      <FieldBlock
        label="Unexpected real-world connection"
        value={output.unexpected_real_world_connection}
      />
      <ListBlock label="Counterintuitive claims" items={output.counterintuitive_claims} />
      <ListBlock label="Mystery hooks" items={output.mystery_hooks} />
      <ListBlock label="What people think wrong" items={output.things_people_think_wrong} />
    </div>
  );
}
