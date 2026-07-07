import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { SeriesBoard } from "@/components/labs/series-board";
import { getSeriesWithParts } from "@/lib/db/labs-queries";

export const dynamic = "force-dynamic";

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const series = await getSeriesWithParts(id);
  if (!series) notFound();

  return (
    <div className="p-8">
      <Link
        href="/labs"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        The Unicorn Labs
      </Link>
      <PageHeader title={series.title} description={series.premise ?? series.topic} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {series.domain && (
          <Badge variant="secondary" className="capitalize">
            {series.domain}
          </Badge>
        )}
        <Badge variant="outline">{series.parts.length} parts</Badge>
        <span className="text-xs text-muted-foreground">
          Open a part to generate it — research, script, and the interactive webpage run through the
          pipeline, continuity-aware of earlier parts.
        </span>
      </div>
      <SeriesBoard series={series} />
    </div>
  );
}
