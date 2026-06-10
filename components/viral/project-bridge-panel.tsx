"use client";

import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/episodes/copy-button";
import { FieldBlock, ListBlock, WaitingFor } from "./panel-bits";
import type { ProjectBridgeOutput } from "@/lib/prompts/viral/output-schemas";

export function ProjectBridgePanel({ output }: { output?: ProjectBridgeOutput }) {
  if (!output) return <WaitingFor stage="Project Bridge" />;

  const tiers: { label: string; value: string; accent: string }[] = [
    { label: "1-hour version", value: output.one_hour_version, accent: "text-emerald-400" },
    { label: "1-week version", value: output.one_week_version, accent: "text-primary" },
    { label: "Portfolio version", value: output.portfolio_version, accent: "text-accent" },
  ];

  return (
    <div className="space-y-3">
      <div className="glass-panel border-primary/30 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
                Student project
              </p>
              <Badge variant="secondary" className="capitalize">
                {output.student_level.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-1 font-display text-xl font-semibold">{output.project_title}</p>
            <p className="mt-2 text-sm leading-relaxed">{output.what_they_build}</p>
          </div>
          <CopyButton text={`${output.project_title}\n\n${output.what_they_build}`} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.label} className="glass-panel p-4">
            <p className={`text-[10px] font-medium uppercase tracking-wider ${t.accent}`}>
              {t.label}
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{t.value}</p>
          </div>
        ))}
      </div>

      <ListBlock label="Concepts learned" items={output.concepts_learned} />
      <FieldBlock label="Dataset / simulation needed" value={output.dataset_or_simulation_needed} />

      {Object.keys(output.interactive_demo_spec).length > 0 && (
        <div className="glass-panel p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Interactive demo spec
            </p>
            <CopyButton text={JSON.stringify(output.interactive_demo_spec, null, 2)} />
          </div>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
            {JSON.stringify(output.interactive_demo_spec, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
