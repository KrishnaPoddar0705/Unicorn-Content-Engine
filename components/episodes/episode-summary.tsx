import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaperCitationCard } from "@/components/episodes/paper-citation-card";
import type { Episode, Paper } from "@/lib/supabase/types";

interface EpisodeSummaryProps {
  episode: Episode;
  paper: Paper | null | undefined;
}

export function EpisodeSummary({ episode, paper }: EpisodeSummaryProps) {
  const meta = (paper?.metadata || {}) as Record<string, unknown>;
  const deconstruction = meta.deconstruction as Record<string, string> | undefined;

  const highlights = [
    { label: "Core question", value: deconstruction?.core_research_question || String(meta.problem_statement || "") },
    { label: "One-sentence summary", value: paper?.core_idea || deconstruction?.one_sentence_summary },
    { label: "Method", value: deconstruction?.method || String(meta.method || "") },
    { label: "Key result", value: deconstruction?.result || String(meta.key_result || "") },
    { label: "Why it matters", value: deconstruction?.why_this_matters || episode.why_cool },
    { label: "Analogy", value: deconstruction?.analogy },
    { label: "Common misunderstanding", value: deconstruction?.common_misunderstanding },
    { label: "Student rebuild", value: deconstruction?.student_rebuild_plan || episode.student_project_extension },
  ].filter((h) => h.value);

  return (
    <div className="space-y-4">
      {paper && <PaperCitationCard paper={paper} />}

      {paper?.abstract && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Abstract</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">{paper.abstract}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Highlights & Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {highlights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Run Generate Full Package to extract paper highlights, or view the linked paper.
            </p>
          ) : (
            highlights.map((h) => (
              <div key={h.label}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{h.label}</p>
                <p className="mt-1 text-sm leading-relaxed">{h.value}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {Boolean(meta.limitations) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Limitations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{String(meta.limitations)}</CardContent>
        </Card>
      )}
    </div>
  );
}
