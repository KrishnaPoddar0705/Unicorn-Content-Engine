import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { getScoredEpisodes } from "@/lib/db/viral-queries";

export const dynamic = "force-dynamic";

function engagement(score: {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
}): number | null {
  if (!score.views) return null;
  return (
    ((score.saves ?? 0) * 4 + (score.shares ?? 0) * 4 + (score.comments ?? 0) * 2 + (score.likes ?? 0)) /
    score.views
  );
}

export default async function LabsInsightsPage() {
  const rows = await getScoredEpisodes("labs");

  const ranked = [...rows].sort((a, b) => {
    const ae = engagement(a.score) ?? -1;
    const be = engagement(b.score) ?? -1;
    return be - ae;
  });

  return (
    <div className="p-8">
      <Link
        href="/labs"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        The Unicorn Labs
      </Link>
      <PageHeader
        title="Insights"
        description="What actually performed across your series parts."
      />

      <h2 className="mb-3 font-display text-lg font-semibold">Parts by engagement</h2>
      {ranked.length === 0 ? (
        <div className="glass-panel p-10 text-center text-sm text-muted-foreground">
          No performance data yet. Enter metrics on a part&apos;s Performance tab.
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map(({ episode, score }) => {
            const eng = engagement(score);
            return (
              <Link key={score.id} href={`/labs/${episode.id}`}>
                <div className="glass-panel mb-2 p-4 transition-colors hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{episode.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {episode.part_number != null && (
                          <Badge variant="outline">Part {episode.part_number}</Badge>
                        )}
                        {episode.domain && (
                          <Badge variant="secondary" className="capitalize">
                            {episode.domain}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      {eng !== null && (
                        <p className="font-mono text-sm text-primary">{(eng * 100).toFixed(1)}%</p>
                      )}
                      {score.views != null && <p>{score.views.toLocaleString()} views</p>}
                      {score.krishna_rating && <p>rated {score.krishna_rating}/10</p>}
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
