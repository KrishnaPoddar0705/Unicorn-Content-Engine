import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Paper } from "@/lib/supabase/types";

export function PaperCard({ paper }: { paper: Paper }) {
  return (
    <Link href={`/papers/${paper.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{paper.title}</CardTitle>
            <Badge variant={paper.citation_status === "verified" ? "success" : "warning"}>
              {paper.citation_status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">{paper.core_idea || paper.abstract}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{paper.difficulty_level}</Badge>
            {paper.rebuild_type && <Badge variant="outline">{paper.rebuild_type}</Badge>}
            {paper.is_rebuildable && <Badge variant="success">rebuildable</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
