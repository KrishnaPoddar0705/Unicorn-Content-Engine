import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { IdeasBoard } from "@/components/viral/ideas-board";
import { getViralIdeas } from "@/lib/db/viral-queries";

export const dynamic = "force-dynamic";

export default async function LabsIdeasPage() {
  const ideas = await getViralIdeas(undefined, "labs");

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
        title="Ideas"
        description="Deep-tech, interdisciplinary topics scouted from the live web — seeds for a new multi-part series."
      />
      <IdeasBoard initialIdeas={ideas} findEndpoint="/api/labs/ideas/find" newBasePath="/labs" />
    </div>
  );
}
