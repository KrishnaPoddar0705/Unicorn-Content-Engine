"use client";

import { Badge } from "@/components/ui/badge";
import { FieldBlock, ListBlock, WaitingFor } from "./panel-bits";
import { RevisionMenu } from "./revision-actions";
import type { ExpertResearchOutput } from "@/lib/prompts/viral/output-schemas";

const CONFIDENCE_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  high: "success",
  medium: "warning",
  low: "destructive",
};

export function ResearchPanel({
  episodeId,
  output,
}: {
  episodeId: string;
  output?: ExpertResearchOutput;
}) {
  if (!output) return <WaitingFor stage="Expert Research" />;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant={CONFIDENCE_VARIANT[output.confidence]}>
          confidence: {output.confidence}
        </Badge>
        <RevisionMenu episodeId={episodeId} stage="expert_research" />
      </div>
      <FieldBlock label="Technical core" value={output.technical_core} />
      <FieldBlock label="Plain explanation (smart but new)" value={output.plain_explanation} />
      <FieldBlock
        label="Mathematical / logical structure"
        value={output.mathematical_or_logical_structure}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="glass-panel border-emerald-500/30 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
            Verified facts
          </p>
          <ul className="mt-2 space-y-1.5">
            {output.verified_facts.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-emerald-400">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel border-amber-500/30 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400">
            Speculative interpretations
          </p>
          <ul className="mt-2 space-y-1.5">
            {output.speculative_interpretations.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-amber-400">~</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <FieldBlock
        label="What most people misunderstand"
        value={output.what_most_people_misunderstand}
      />
      <ListBlock label="Key terms" items={output.key_terms} />
      <ListBlock label="Mental models" items={output.mental_models} />
      <ListBlock label="Real-world examples" items={output.real_world_examples} />
      <ListBlock label="Do not oversimplify" items={output.what_to_not_oversimplify} />
      <ListBlock label="Prerequisites" items={output.prerequisite_concepts} />
      <ListBlock label="Citation notes" items={output.citation_notes} />
    </div>
  );
}
