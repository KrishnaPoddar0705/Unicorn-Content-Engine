"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ListBlock, WaitingFor } from "./panel-bits";
import type { ViralityCriticOutput } from "@/lib/prompts/viral/output-schemas";

const DIMENSION_LABELS: Record<string, string> = {
  scroll_stop_hook: "Scroll-stop hook",
  curiosity_gap: "Curiosity gap",
  clarity: "Clarity",
  technical_depth: "Technical depth",
  novelty: "Novelty",
  shareability: "Shareability",
  save_worthiness: "Save-worthiness",
  comment_potential: "Comment potential",
  visual_potential: "Visual potential",
  brand_fit: "Brand fit",
  hallucination_risk: "Hallucination risk",
  overclaiming_risk: "Overclaiming risk",
  student_project_potential: "Student project potential",
};

const RISK_DIMENSIONS = new Set(["hallucination_risk", "overclaiming_risk"]);

const REC_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  publish: "success",
  revise: "warning",
  reject: "destructive",
};

export function ScoresPanel({ output }: { output?: ViralityCriticOutput }) {
  if (!output) return <WaitingFor stage="Virality Critic" />;

  return (
    <div className="space-y-3">
      <div className="glass-panel flex items-center justify-between p-6">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Overall score
          </p>
          <p className="font-display text-6xl font-semibold leading-none">
            <span
              className={cn(
                output.overall_score >= 75
                  ? "text-emerald-400"
                  : output.overall_score >= 50
                    ? "text-primary"
                    : "text-destructive"
              )}
            >
              {output.overall_score}
            </span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </p>
        </div>
        <Badge variant={REC_VARIANT[output.final_recommendation]} className="px-4 py-1.5 text-sm uppercase">
          {output.final_recommendation}
        </Badge>
      </div>

      <div className="glass-panel space-y-3 p-5">
        {Object.entries(output.dimension_scores).map(([dim, score]) => {
          const isRisk = RISK_DIMENSIONS.has(dim);
          const bad = isRisk ? score >= 6 : score <= 4;
          return (
            <div key={dim}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className={cn(bad && "text-destructive")}>
                  {DIMENSION_LABELS[dim] ?? dim}
                  {isRisk && <span className="ml-1 text-muted-foreground">(lower is better)</span>}
                </span>
                <span className="font-mono text-muted-foreground">{score}/10</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    bad
                      ? "bg-destructive"
                      : isRisk
                        ? "bg-emerald-400"
                        : "bg-gradient-to-r from-primary to-accent"
                  )}
                  style={{ width: `${score * 10}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <ListBlock label="Top 3 issues" items={output.top_3_issues} />
      <ListBlock label="Specific rewrites" items={output.specific_rewrites} />
    </div>
  );
}
