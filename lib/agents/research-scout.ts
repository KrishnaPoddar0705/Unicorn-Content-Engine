import { runAgent } from "./runner";
import { ResearchScoutSchema, type ResearchScout } from "./types";

export async function scoutResearch(params: {
  topics?: string[];
  pillar?: string;
  count?: number;
  context?: { pipelineId?: string };
}): Promise<ResearchScout> {
  const prompt = `Suggest ${params.count || 5} cool research papers or research-inspired topics for Instagram "Paper to Project" content.

Topics filter: ${(params.topics || ["AI", "science", "social behavior", "education", "gaming"]).join(", ")}
Pillar: ${params.pillar || "any"}

Criteria:
- Visually explainable
- Rebuildable as toy demo by high school students
- Surprising hook potential
- Relevant to students or parents

Never hallucinate citations. Mark uncertain papers as research_inspired.

Return JSON with suggestions array.`;

  const { output } = await runAgent({
    agentName: "research_scout",
    userPrompt: prompt,
    schema: ResearchScoutSchema,
    context: params.context,
    extraSystem: "Prioritize ideas with high rebuildability and viral hooks.",
  });

  return output;
}

export async function scoutForContentIdea(
  contentIdea: string,
  options?: { pipelineId?: string; count?: number }
): Promise<ResearchScout> {
  const prompt = `A creator wants to build Instagram "Paper to Project" content around this idea:

"${contentIdea}"

Research and suggest ${options?.count || 5} real papers OR research-inspired reconstructions that best support this content idea.

For each suggestion include:
- paper_title (real paper name if verified, or descriptive research-inspired title)
- research_idea (what the paper claims and why it fits the content idea)
- hook (viral opening line for a Reel)
- why_viral (shareability angle)
- rebuildability_score (1-10, how easy for students to rebuild)
- demo_idea (interactive demo students could build)
- target_audience (student, parent, school, or founder)
- difficulty_level (beginner, intermediate, or advanced)
- citation_status (verified only if confident; otherwise research_inspired)

Prioritize papers with strong educational depth, clear methods, and simulatable results.
Never invent author names or fake DOIs. Mark uncertain papers as research_inspired.

Return JSON with suggestions array sorted by fit for the content idea.`;

  const { output } = await runAgent({
    agentName: "research_scout",
    userPrompt: prompt,
    schema: ResearchScoutSchema,
    context: options?.pipelineId ? { pipelineId: options.pipelineId } : undefined,
    extraSystem:
      "You are a research librarian helping a science educator find the best papers for a specific content angle. Be rigorous about citations.",
  });

  return output;
}
