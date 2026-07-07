import Link from "next/link";
import { Plus, BarChart3, Lightbulb, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSeriesList, partProgress } from "@/lib/db/labs-queries";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  complete: "success",
  in_progress: "warning",
  planned: "secondary",
};

export default async function UnicornLabsPage() {
  const series = await getSeriesList();

  return (
    <div className="p-8">
      <PageHeader
        title="The Unicorn Labs"
        description="Multi-part, first-principles deep-tech series — connecting technology to economics, society, and the future, for India's builders, founders, and investors."
        action={
          <div className="flex gap-2">
            <Link href="/labs/ideas">
              <Button variant="outline">
                <Lightbulb className="mr-2 h-4 w-4" />
                Ideas
              </Button>
            </Link>
            <Link href="/labs/insights">
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Insights
              </Button>
            </Link>
            <Link href="/labs/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Series
              </Button>
            </Link>
          </div>
        }
      />

      {series.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted-foreground">
          No series yet. Start one — give a deep-tech topic and the Series Architect will plan the
          multi-part arc.
        </div>
      ) : (
        <div className="grid gap-4">
          {series.map((s) => {
            const totalParts = s.parts.length || s.total_parts;
            const completeParts = s.parts.filter((p) => p.status === "complete").length;
            return (
              <Link key={s.id} href={`/labs/series/${s.id}`}>
                <div className="glass-panel p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_VARIANT[s.status] || "secondary"}>
                          {s.status.replace("_", " ")}
                        </Badge>
                        {s.domain && (
                          <Badge variant="secondary" className="capitalize">
                            {s.domain}
                          </Badge>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Layers className="h-3.5 w-3.5" />
                          {completeParts}/{totalParts} parts complete
                        </span>
                      </div>
                      <h3 className="mt-2 truncate font-display text-lg font-semibold">{s.title}</h3>
                      {s.premise && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.premise}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {s.parts.map((p) => {
                          const { done, total } = partProgress(p);
                          return (
                            <span
                              key={p.id}
                              className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                              title={p.title}
                            >
                              P{p.part_number} · {p.status === "complete" ? "done" : `${done}/${total}`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
