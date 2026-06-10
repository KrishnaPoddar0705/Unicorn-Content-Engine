import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEpisodes } from "@/lib/db/queries";

export default async function EpisodesPage() {
  const episodes = await getEpisodes();

  return (
    <div className="p-8">
      <PageHeader
        title="Episodes"
        description="All Paper to Project episodes — scripts, demos, and quality scores."
        action={
          <Link href="/episodes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Episode
            </Button>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left font-medium">#</th>
              <th className="p-3 text-left font-medium">Title</th>
              <th className="p-3 text-left font-medium">Pillar</th>
              <th className="p-3 text-left font-medium">Audience</th>
              <th className="p-3 text-left font-medium">Viral</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Demo</th>
            </tr>
          </thead>
          <tbody>
            {episodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No episodes. Run <code className="rounded bg-muted px-1">npx tsx scripts/seed-database.ts</code>
                </td>
              </tr>
            ) : (
              episodes.map((ep) => {
                const score = ep.quality_scores?.[0]?.overall_viral_score;
                return (
                  <tr key={ep.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">{ep.episode_number}</td>
                    <td className="p-3">
                      <Link href={`/episodes/${ep.id}`} className="font-medium hover:text-primary">
                        {ep.title}
                      </Link>
                    </td>
                    <td className="p-3">
                      {ep.content_pillars ? (
                        <Badge variant="secondary">{ep.content_pillars.code}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 capitalize">{ep.target_audience}</td>
                    <td className="p-3">{score ?? "—"}</td>
                    <td className="p-3">
                      <Badge variant="outline">{ep.status}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={ep.demo_build_status === "ready" ? "success" : "warning"}>
                        {ep.demo_build_status}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
