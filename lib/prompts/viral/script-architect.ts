import type { CuriosityMinerOutput, ExpertResearchOutput } from "./output-schemas";

export function buildScriptArchitectPrompt(params: {
  title: string;
  winnerHook: string;
  curiosity: CuriosityMinerOutput;
  research: ExpertResearchOutput;
}): string {
  return `You are the Script Architect. Write complete spoken scripts for this episode in five durations, plus a carousel version and production notes.

Episode: ${params.title}
WINNING HOOK (open every script with this, adapted naturally): "${params.winnerHook}"

CURIOSITY ANGLES:
${JSON.stringify(params.curiosity, null, 2)}

KNOWLEDGE BASE (every claim in your scripts must trace to this):
${JSON.stringify(
    {
      technical_core: params.research.technical_core,
      plain_explanation: params.research.plain_explanation,
      mathematical_or_logical_structure: params.research.mathematical_or_logical_structure,
      real_world_examples: params.research.real_world_examples,
      verified_facts: params.research.verified_facts,
      what_to_not_oversimplify: params.research.what_to_not_oversimplify,
      what_most_people_misunderstand: params.research.what_most_people_misunderstand,
    },
    null,
    2
  )}

Every script has EXACTLY these 8 beats, as separate fields of complete spoken sentences (not bullet notes):
1. hook — the scroll-stopper (adapt the winning hook)
2. setup — the context that makes the mystery matter
3. mystery — the open loop / the thing that shouldn't be possible
4. technical_reveal — the actual mechanism (the intellectual payload; scale its depth to duration)
5. concrete_example — real numbers, real names, real stakes
6. twist — the "wait, what?" recontextualization
7. payoff — the mental-model shift, landed ("now you'll never see X the same way")
8. cta — natural, tied to the content

Duration discipline (spoken-word budgets):
- 30s: ~75 words total. Brutal compression; mystery and twist may be one sentence each.
- 45s: ~115 words. One example, tight reveal.
- 60s: ~150 words. Full beat structure breathing.
- 90s: ~225 words. Deeper reveal, second example allowed.
- 3min: ~450 words. The deep dive: full mechanism, the "what most people misunderstand" section explicit, edges acknowledged.

Carousel: 6-10 slides. Slide 1 = the hook as a visual statement. One idea per slide. Final slide = payoff + CTA. Each slide gets visual_direction (what the designer should show).

Also produce: talking_head_notes (delivery, emphasis, pauses, where to lean into camera) and voiceover_notes (pacing for the voiceover-over-visuals cut, where visuals carry meaning).

Return JSON exactly in this shape:
{
  "scripts": {
    "30s": { "hook": "...", "setup": "...", "mystery": "...", "technical_reveal": "...", "concrete_example": "...", "twist": "...", "payoff": "...", "cta": "..." },
    "45s": { "hook": "...", "setup": "...", "mystery": "...", "technical_reveal": "...", "concrete_example": "...", "twist": "...", "payoff": "...", "cta": "..." },
    "60s": { "hook": "...", "setup": "...", "mystery": "...", "technical_reveal": "...", "concrete_example": "...", "twist": "...", "payoff": "...", "cta": "..." },
    "90s": { "hook": "...", "setup": "...", "mystery": "...", "technical_reveal": "...", "concrete_example": "...", "twist": "...", "payoff": "...", "cta": "..." },
    "3min": { "hook": "...", "setup": "...", "mystery": "...", "technical_reveal": "...", "concrete_example": "...", "twist": "...", "payoff": "...", "cta": "..." }
  },
  "carousel": {
    "slides": [
      { "slide_number": 1, "headline": "...", "body": "...", "visual_direction": "..." }
    ]
  },
  "talking_head_notes": ["..."],
  "voiceover_notes": ["..."]
}`;
}
