import { runAgent } from "./runner";
import { PaperIngestionSchema, type PaperIngestion } from "./types";

export async function ingestPaperText(
  text: string,
  sourceUrl?: string,
  context?: { pipelineId?: string }
): Promise<PaperIngestion> {
  const prompt = `Extract structured information from this research paper text for content creation.

${sourceUrl ? `Source URL: ${sourceUrl}` : ""}

Paper text:
${text.slice(0, 12000)}

Return JSON with: title, authors, year, abstract, problem_statement, method, key_result, limitations, core_insight, possible_mini_demo, possible_instagram_hook, possible_student_project, difficulty_level (exactly one of: "beginner", "intermediate", "advanced"), required_data, rebuild_type (exactly one of: "simulation", "toy_model", "dashboard", "calculator", "visualizer", "game", "classifier", "recommender", "network_graph"), citation_status (exactly one of: "verified", "research_inspired", "pending_verification").

If you cannot verify this is a real published paper, set citation_status to research_inspired. Never invent author names or years.`;

  const { output } = await runAgent({
    agentName: "paper_ingestion",
    userPrompt: prompt,
    schema: PaperIngestionSchema,
    context,
    extraSystem: "Be conservative with citations. Extract what's actually in the text.",
  });

  return output;
}
