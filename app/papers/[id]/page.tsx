import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaper } from "@/lib/db/queries";
import { GenerateEpisodeButton } from "@/components/episodes/generate-episode-button";

export default async function PaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) notFound();

  const meta = paper.metadata as Record<string, string>;

  return (
    <div className="p-8">
      <PageHeader
        title={paper.title}
        description={paper.core_idea || undefined}
        action={<GenerateEpisodeButton paperId={paper.id} title={paper.title} />}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant={paper.citation_status === "verified" ? "success" : "warning"}>
          {paper.citation_status}
        </Badge>
        <Badge variant="secondary">{paper.difficulty_level}</Badge>
        {paper.rebuild_type && <Badge variant="outline">{paper.rebuild_type}</Badge>}
        {paper.year && <Badge variant="outline">{paper.year}</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abstract</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{paper.abstract || "No abstract"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why It&apos;s Cool</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{paper.why_cool || "—"}</p>
            <p className="mt-4 text-sm">
              <strong>Suggested project:</strong> {paper.suggested_project || "—"}
            </p>
          </CardContent>
        </Card>

        {meta && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Problem & Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{meta.problem_statement || meta.problem}</p>
                <p className="text-muted-foreground">{meta.method}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Key Result</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{meta.key_result || meta.result}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {paper.source_url && (
        <p className="mt-6 text-sm">
          <Link href={paper.source_url} target="_blank" className="text-primary underline">
            View source
          </Link>
        </p>
      )}
    </div>
  );
}
