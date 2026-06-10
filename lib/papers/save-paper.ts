import { getSupabase } from "@/lib/supabase/server";
import type { PaperIngestion } from "@/lib/agents/types";
import type { Paper } from "@/lib/supabase/types";

export async function savePaperFromIngestion(
  ingestion: PaperIngestion,
  rawText: string,
  sourceUrl?: string | null
): Promise<Paper> {
  const supabase = getSupabase();
  const { data: paper, error } = await supabase
    .from("papers")
    .insert({
      title: ingestion.title,
      authors: ingestion.authors,
      year: ingestion.year,
      source_url: sourceUrl || null,
      abstract: ingestion.abstract,
      raw_text: rawText,
      core_idea: ingestion.core_insight,
      why_cool: ingestion.possible_instagram_hook,
      difficulty_level: ingestion.difficulty_level,
      rebuild_type: ingestion.rebuild_type,
      suggested_project: ingestion.possible_student_project,
      citation_status: ingestion.citation_status,
      is_rebuildable: true,
      audience_suitability: ["student"],
      content_status: "ingested",
      metadata: {
        problem_statement: ingestion.problem_statement,
        method: ingestion.method,
        key_result: ingestion.key_result,
        limitations: ingestion.limitations,
        possible_mini_demo: ingestion.possible_mini_demo,
        required_data: ingestion.required_data,
      },
    })
    .select()
    .single();

  if (error || !paper) throw error || new Error("Failed to save paper");
  return paper as Paper;
}
