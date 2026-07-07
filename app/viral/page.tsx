import Link from "next/link";
import { Plus, BarChart3, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getViralEpisodes } from "@/lib/db/viral-queries";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  complete: "success",
  running: "warning",
  failed: "destructive",
  queued: "secondary",
};

export default async function ViralLabPage() {
  const episodes = await getViralEpisodes();

  return (
    <div className="p-8">
      <PageHeader
        title="Viral Lab"
        description="The epistemic entertainment engine — research-grade content engineered for curiosity."
        action={
          <div className="flex gap-2">
            <Link href="/viral/ideas">
              <Button variant="outline">
                <Lightbulb className="mr-2 h-4 w-4" />
                Ideas
              </Button>
            </Link>
            <Link href="/viral/insights">
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Insights
              </Button>
            </Link>
            <Link href="/viral/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Viral Episode
              </Button>
            </Link>
          </div>
        }
      />

      {episodes.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted-foreground">
          No viral episodes yet. Create your first one — paste a paper, drop an idea, or pick a domain.
        </div>
      ) : (
        <div className="grid gap-4">
          {episodes.map((ep) => {
            const stages = ep.viral_episode_outputs || [];
            const done = stages.filter((s) => s.status === "success").length;
            const score = ep.episode_scores?.[0];
            return (
              <Link key={ep.id} href={`/viral/${ep.id}`}>
                <div className="glass-panel p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_VARIANT[ep.status] || "secondary"}>
                          {ep.status === "running" ? "in progress — open to resume" : ep.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {ep.input_mode.replace("_", " ")}
                        </Badge>
                        {ep.domain && (
                          <Badge variant="secondary" className="capitalize">
                            {ep.domain}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {done}/{stages.length || 8} stages
                        </span>
                      </div>
                      <h3 className="mt-2 truncate font-display text-lg font-semibold">{ep.title}</h3>
                      {ep.winner_hook && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          “{ep.winner_hook}”
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      {ep.critic_score != null && (
                        <div>
                          <span className="font-display text-2xl font-semibold text-primary">
                            {ep.critic_score}
                          </span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                      )}
                      {score?.views != null && (
                        <span className="text-xs text-muted-foreground">
                          {score.views.toLocaleString()} views
                          {score.krishna_rating ? ` · rated ${score.krishna_rating}/10` : ""}
                        </span>
                      )}
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
