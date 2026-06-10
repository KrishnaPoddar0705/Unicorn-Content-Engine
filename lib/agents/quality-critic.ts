import { runAgent } from "./runner";
import { QualityCriticSchema, type QualityCritic } from "./types";

export async function critiqueContent(
  packageData: {
    episodeTitle: string;
    hook: string;
    script60: string;
    caption: string;
    demoSpec?: string;
    deconstruction?: string;
  },
  context?: { pipelineId?: string; episodeId?: string }
): Promise<QualityCritic & { overall_viral_score: number }> {
  const prompt = `Review this Paper to Project episode package for The Unicorn Labs.

Episode: ${packageData.episodeTitle}
Hook: ${packageData.hook}
60s Script: ${packageData.script60}
Caption: ${packageData.caption}
Demo spec: ${packageData.demoSpec || "N/A"}
Deconstruction: ${packageData.deconstruction || "N/A"}

Score 1-10 on: hook_strength, surprise_factor, student_relevance, parent_relevance, demo_feasibility, shareability, brand_fit, clarity, authenticity, educational_value, rebuildability.

Provide explanation and specific improvements.`;

  const { output } = await runAgent({
    agentName: "quality_critic",
    userPrompt: prompt,
    schema: QualityCriticSchema,
    context,
    temperature: 0.3,
    extraSystem: "Be honest and constructive. Penalize fake hype, jargon, and overclaiming.",
  });

  const viralDimensions = [
    output.hook_strength,
    output.surprise_factor,
    output.student_relevance,
    output.parent_relevance,
    output.demo_feasibility,
    output.shareability,
    output.brand_fit,
  ];
  const overall_viral_score =
    Math.round((viralDimensions.reduce((a, b) => a + b, 0) / viralDimensions.length) * 10) / 10;

  return { ...output, overall_viral_score };
}
