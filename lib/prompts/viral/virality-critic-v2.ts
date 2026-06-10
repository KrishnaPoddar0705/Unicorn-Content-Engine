import { CRITIC_DIMENSIONS } from "./output-schemas";
import type {
  CuriosityMinerOutput,
  EngagementEngineerOutput,
  ProjectBridgeOutput,
  ScriptArchitectOutput,
  VisualDirectorOutput,
} from "./output-schemas";

const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  scroll_stop_hook: "Does the hook stop the scroll in under 2 seconds?",
  curiosity_gap: "How hard does the open loop pull through to the payoff?",
  clarity: "Is every beat instantly understandable for the target audience?",
  technical_depth: "Is there real intellectual substance, not just vibes?",
  novelty: "Will even informed viewers learn something genuinely new?",
  shareability: "Is there a clear send-this-to-someone trigger?",
  save_worthiness: "Is there reference value worth saving?",
  comment_potential: "Does it genuinely invite opinions and disagreement?",
  visual_potential: "Can every beat be made visually striking?",
  brand_fit: "Curious, rigorous, founder-led, buildable — does it sound like Unicorn Labs?",
  hallucination_risk: "Risk that any claim/citation is fabricated or unverifiable (10 = high risk = bad)",
  overclaiming_risk: "Risk of overstating what the research shows (10 = high risk = bad)",
  student_project_potential: "How buildable and exciting is the project angle?",
};

export function buildViralityCriticPrompt(params: {
  title: string;
  winnerHook: string;
  curiosity: CuriosityMinerOutput;
  script: ScriptArchitectOutput;
  engagement: EngagementEngineerOutput;
  projectBridge: ProjectBridgeOutput;
  visual?: VisualDirectorOutput;
  verifiedFacts: string[];
}): string {
  return `You are the Virality Critic 2.0 — the harshest, most useful reviewer this episode will face. Score the COMPLETE episode package below. Be honest: a 90+ should be rare. Generic praise is failure.

Episode: ${params.title}
Hook: "${params.winnerHook}"

CURIOSITY ANGLE: ${params.curiosity.best_angle.title} (${params.curiosity.best_angle.target_emotion})
Core paradox: ${params.curiosity.core_paradox}

THE 60s SCRIPT:
${JSON.stringify(params.script.scripts["60s"], null, 2)}

THE 3min DEEP DIVE (technical_reveal + payoff only):
${JSON.stringify(
    {
      technical_reveal: params.script.scripts["3min"].technical_reveal,
      payoff: params.script.scripts["3min"].payoff,
    },
    null,
    2
  )}

CAROUSEL (first 3 slides):
${JSON.stringify(params.script.carousel.slides.slice(0, 3), null, 2)}

CAPTION: ${params.engagement.caption}
PINNED COMMENT: ${params.engagement.pinned_comment}

PROJECT BRIDGE: ${params.projectBridge.project_title} — ${params.projectBridge.what_they_build}
${params.visual ? `VISUAL SYSTEM: ${params.visual.style_profile.visual_keywords.join(", ")}; ${params.visual.reel_storyboard.length} storyboard beats` : ""}

VERIFIED FACTS the content may rely on (anything in the scripts NOT traceable to these raises hallucination_risk):
${params.verifiedFacts.map((f) => `- ${f}`).join("\n")}

Score each dimension 1-10:
${CRITIC_DIMENSIONS.map((d) => `- ${d}: ${DIMENSION_DESCRIPTIONS[d]}`).join("\n")}

Then:
- overall_score: 1-100. Weigh hook, curiosity gap, and honesty (hallucination/overclaiming risk) heaviest. High risk scores must drag the overall down hard.
- top_3_issues: the three weakest points, specific and located ("the 60s twist restates the reveal instead of recontextualizing it").
- specific_rewrites: concrete replacement text for the weakest lines — actual rewritten sentences, not advice.
- final_recommendation: "publish" (ship as is), "revise" (fix the issues first), or "reject" (the angle itself is broken).

Return JSON exactly in this shape:
{
  "overall_score": 74,
  "dimension_scores": { ${CRITIC_DIMENSIONS.map((d) => `"${d}": 7`).join(", ")} },
  "top_3_issues": ["...", "...", "..."],
  "specific_rewrites": ["..."],
  "final_recommendation": "revise"
}`;
}
