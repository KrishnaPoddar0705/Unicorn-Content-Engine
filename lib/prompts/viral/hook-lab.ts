import type { CuriosityMinerOutput, ExpertResearchOutput } from "./output-schemas";

export const HOOK_ARCHETYPES = [
  "Everyone thinks X, but actually Y.",
  "This tiny rule explains a billion-dollar system.",
  "The scariest part is not X, it's Y.",
  "I recreated this paper and found something weird.",
  "This looks like magic until you see the math.",
  "A decades-old idea explains today's AI/markets/social media.",
  "The algorithm is simpler than the outcome.",
  "This one chart changed how I see X.",
  "The hidden assumption behind X.",
  "What X gets wrong about Y.",
] as const;

export function buildHookLabPrompt(params: {
  title: string;
  curiosity: CuriosityMinerOutput;
  research: ExpertResearchOutput;
}): string {
  return `You are the Hook Lab. Generate exactly 25 scroll-stopping hooks for this episode, spread across the archetypes below. A hook is the first 1-2 spoken sentences / first on-screen text.

Episode: ${params.title}

CURIOSITY ANGLES (from the Curiosity Miner):
${JSON.stringify(params.curiosity, null, 2)}

KNOWLEDGE BASE (ground truth — hooks must be honest to this):
- Technical core: ${params.research.technical_core}
- Verified facts: ${params.research.verified_facts.join(" | ")}
- Most misunderstood: ${params.research.what_most_people_misunderstand}

HOOK ARCHETYPES (cover at least 8 of these 10 across your 25 hooks):
${HOOK_ARCHETYPES.map((a, i) => `${i + 1}. "${a}"`).join("\n")}

Score every hook honestly on 1-10:
- curiosity_score: how hard it pulls the open loop
- clarity_score: instantly understandable without context
- technical_depth_score: how much real substance it promises
- risk_of_clickbait: how much it overpromises vs what the content delivers (high = bad)

Mark recommended=true only for hooks scoring high on curiosity AND clarity with low clickbait risk. Pick the single winner: the hook you would bet the episode on.

Rules: every hook must be deliverable by the actual content (no overpromising), specific (numbers, names, concrete stakes), and free of influencer filler.

Return JSON exactly in this shape:
{
  "hooks": [
    {
      "hook": "the hook text",
      "archetype": "Everyone thinks X, but actually Y.",
      "curiosity_score": 8,
      "clarity_score": 9,
      "technical_depth_score": 7,
      "risk_of_clickbait": 2,
      "recommended": true
    }
  ],
  "winner": "the single best hook text, verbatim from the list",
  "winner_archetype": "its archetype"
}`;
}
