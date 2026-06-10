import Link from "next/link";
import { Clapperboard, FileText, FlaskConical, TrendingUp, Calendar, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";
import { TAGLINE } from "@/lib/brand/voice";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: "Total Episodes", value: stats.episodeCount, icon: Clapperboard },
    { label: "Drafts", value: stats.draftCount, icon: FileText },
    { label: "Papers", value: stats.paperCount, icon: FileText },
    { label: "Demos Pending", value: stats.demoPending, icon: FlaskConical },
    { label: "Avg Viral Score", value: stats.avgViral || "—", icon: TrendingUp },
    { label: "Upcoming Posts", value: stats.upcoming.length, icon: Calendar },
  ];

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        description={TAGLINE}
        action={
          <Link
            href="/episodes/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Generate Episode
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No scheduled posts.{" "}
                <Link href="/calendar" className="text-primary underline">
                  Generate a calendar
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.upcoming.map((item: { id: string; scheduled_date: string; episodes?: { title: string; episode_number: number } }) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span>
                      <Badge variant="secondary" className="mr-2">
                        E{item.episodes?.episode_number}
                      </Badge>
                      {item.episodes?.title}
                    </span>
                    <span className="text-muted-foreground">{formatDate(item.scheduled_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Pillar Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.pillarDist).length === 0 ? (
              <p className="text-sm text-muted-foreground">Run seed script to load episodes.</p>
            ) : (
              <div className="space-y-3">
                {stats.pillars.map((pillar: { code: string; name: string }) => {
                  const dist = stats.pillarDist as Record<string, number>;
                  const count = dist[pillar.code] || 0;
                  const max = Math.max(...Object.values(dist), 1);
                  return (
                    <div key={pillar.code}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>
                          {pillar.code}. {pillar.name}
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
