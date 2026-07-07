import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { partProgress, type SeriesWithParts } from "@/lib/db/labs-queries";
import type { SeriesArcPart } from "@/lib/supabase/types";

const PART_STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  complete: "success",
  running: "warning",
  failed: "destructive",
  queued: "secondary",
};

export function SeriesBoard({ series }: { series: SeriesWithParts }) {
  const arcParts = series.arc?.parts ?? [];

  return (
    <div className="space-y-4">
      {series.parts.map((part) => {
        const { done, total } = partProgress(part);
        const plan: SeriesArcPart | undefined = arcParts.find(
          (p) => p.part_number === part.part_number
        );
        return (
          <Link key={part.id} href={`/labs/${part.id}`}>
            <div className="glass-panel p-5 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Part {part.part_number}</Badge>
                    <Badge variant={PART_STATUS_VARIANT[part.status] || "secondary"}>
                      {part.status === "running" ? "generating" : part.status}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {part.status === "complete" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : part.status === "running" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : null}
                      {done}/{total} stages
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold">{part.title}</h3>
                  {plan?.covers && (
                    <p className="mt-1 text-sm text-muted-foreground">{plan.covers}</p>
                  )}
                  {plan?.interdisciplinary_bridges?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {plan.interdisciplinary_bridges.map((b) => (
                        <Badge key={b} variant="secondary" className="text-[10px]">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {plan?.teases_next && (
                    <p className="mt-2 text-xs italic text-muted-foreground">
                      → teases: {plan.teases_next}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 self-center text-sm text-primary">
                  {part.status === "queued" ? "Generate" : "Open"}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
