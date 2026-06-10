export function buildCuriosityMinerPrompt(params: {
  sourceMaterial: string;
  title: string;
}): string {
  return `You are the Curiosity Miner. Extract the most viral curiosity angles from this material.

Episode working title: ${params.title}

${params.sourceMaterial}

Mine this material for what makes people stop scrolling:
- The core paradox: the single most contradictory-feeling truth in here.
- Counterintuitive claims: things that are true but sound wrong.
- Mystery hooks: open questions or unexplained-seeming behavior the content can resolve.
- Things people think wrong: widely-held beliefs this material corrects.
- The hidden mechanism: the invisible machinery that actually drives the phenomenon.
- The unexpected real-world connection: where this touches the viewer's daily life in a way they'd never guess.
- The best angle: the ONE framing with the highest scroll-stop potential, and the emotion it targets.

Be specific and concrete. "AI is surprising" is worthless; "the model gets BETTER when you delete 90% of it" stops thumbs.

Return JSON exactly in this shape:
{
  "core_paradox": "one sentence stating the contradiction",
  "counterintuitive_claims": ["claim 1", "claim 2", "claim 3"],
  "mystery_hooks": ["open question 1", "open question 2"],
  "things_people_think_wrong": ["misconception 1", "misconception 2"],
  "hidden_mechanism": "the invisible machinery, in 1-2 sentences",
  "unexpected_real_world_connection": "where this touches daily life",
  "best_angle": {
    "title": "the winning framing",
    "why_it_stops_scroll": "one sentence on why",
    "target_emotion": "curiosity"
  }
}
target_emotion must be exactly one of: curiosity, shock, confusion, awe, status, fear, wonder.`;
}
