import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { IdeasBoard } from "@/components/viral/ideas-board";
import { getViralIdeas } from "@/lib/db/viral-queries";

export const dynamic = "force-dynamic";

export default async function ViralIdeasPage() {
  const ideas = await getViralIdeas();

  return (
    <div className="p-8">
      <Link
        href="/viral"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Viral Lab
      </Link>
      <PageHeader
        title="Ideas"
        description="Wild, interdisciplinary research and facts — scouted from the live web, ranked for retention, ready to deconstruct on camera."
      />
      <IdeasBoard initialIdeas={ideas} />
    </div>
  );
}
