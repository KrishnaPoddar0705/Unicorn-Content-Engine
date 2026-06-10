import { runAgent } from "./runner";
import { DeconstructionSchema, type Deconstruction } from "./types";
import type { Paper } from "@/lib/supabase/types";

export async function deconstructPaper(
  paper: Partial<Paper>,
  context?: { pipelineId?: string; episodeId?: string; paperId?: string }
): Promise<Deconstruction> {
  const prompt = `Deconstruct this research paper for a high-school audience Instagram episode.

Title: ${paper.title}
Authors: ${(paper.authors || []).join(", ")}
Year: ${paper.year || "unknown"}
Citation status: ${paper.citation_status || "pending_verification"}
Abstract: ${paper.abstract || "N/A"}
Core idea: ${paper.core_idea || "N/A"}
Raw text excerpt: ${(paper.raw_text || "").slice(0, 3000)}

Return JSON with: one_sentence_summary, core_research_question, problem, method, result, analogy, why_this_matters, common_misunderstanding, student_rebuild_plan, mini_project_idea, difficulty_level (exactly one of: "beginner", "intermediate", "advanced"), rebuild_type (exactly one of: "simulation", "toy_model", "dashboard", "calculator", "visualizer", "game", "classifier", "recommender", "network_graph"), required_data, instagram_hook, citation_status (exactly one of: "verified", "research_inspired", "pending_verification").`;

  const { output } = await runAgent({
    agentName: "paper_deconstruction",
    userPrompt: prompt,
    schema: DeconstructionSchema,
    context: { ...context, paperId: paper.id },
    extraSystem: "Focus on reconstructing the insight, not academic summary. Use a vivid high-school-friendly analogy.",
  });

  return output;
}
