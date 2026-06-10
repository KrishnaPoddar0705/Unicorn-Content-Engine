import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PaperCard } from "@/components/papers/paper-card";
import { Button } from "@/components/ui/button";
import { getPapers } from "@/lib/db/queries";

export default async function PapersPage() {
  const papers = await getPapers();

  return (
    <div className="p-8">
      <PageHeader
        title="Paper Library"
        description="Research papers and research-inspired topics for Paper to Project episodes."
        action={
          <Link href="/papers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Paper
            </Button>
          </Link>
        }
      />

      {papers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No papers yet. Paste a paper or run the seed script.</p>
          <Link href="/papers/new" className="mt-4 inline-block text-primary underline">
            Upload your first paper
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {papers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  );
}
