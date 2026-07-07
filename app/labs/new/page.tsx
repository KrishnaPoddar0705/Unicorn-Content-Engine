import { PageHeader } from "@/components/layout/page-header";
import { SeriesForm } from "@/components/labs/series-form";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewSeriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <div className="p-8">
      <PageHeader
        title="New Series"
        description="Give a deep-tech topic. The Series Architect plans the multi-part arc — first principles, interdisciplinary bridges, and the India angle, part by part."
      />
      <SeriesForm initialTopic={first(params.topic)} initialDomain={first(params.domain)} />
    </div>
  );
}
