import Link from "next/link";
import { ExternalLink, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Paper } from "@/lib/supabase/types";

export function PaperCitationCard({ paper }: { paper: Paper }) {
  const authors = paper.authors?.length ? paper.authors.join(", ") : "Unknown authors";
  const meta = paper.metadata as Record<string, string>;

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
      <div className="flex items-start gap-3">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
        <div className="flex-1 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Research Paper</p>
          <p className="font-medium leading-snug">{paper.title}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {authors}
              {paper.year ? ` · ${paper.year}` : ""}
            </span>
            <Badge variant={paper.citation_status === "verified" ? "success" : "warning"}>
              {paper.citation_status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={`/papers/${paper.id}`} className="text-sm font-medium text-primary underline">
              View in Paper Library
            </Link>
            {paper.source_url ? (
              <a
                href={paper.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline"
              >
                Original paper
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : paper.citation_status === "research_inspired" ? (
              <span className="text-sm text-muted-foreground">
                Research-inspired reconstruction — no single canonical paper URL
              </span>
            ) : null}
          </div>
          {meta?.key_result && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Key result: </span>
              {meta.key_result}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
