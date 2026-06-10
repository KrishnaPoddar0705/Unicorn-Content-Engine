export function buildExpertResearchPrompt(params: {
  sourceMaterial: string;
  title: string;
}): string {
  return `You are the Expert Research agent. Build a dense but usable knowledge base around this topic — the substrate every downstream script will draw from. Rigor here prevents hallucination everywhere else.

Episode working title: ${params.title}

${params.sourceMaterial}

Produce:
- technical_core: the actual mechanism/result, stated precisely (this is the ground truth for the episode).
- plain_explanation: "explain like I'm smart but new to this" — full mechanism, zero condescension.
- key_terms: the terms a viewer would need, each as "term: one-line plain meaning".
- prerequisite_concepts: what someone must already get for the explanation to land.
- mental_models: 2-4 transferable thinking tools this material teaches.
- mathematical_or_logical_structure: the math/logic skeleton (equation, algorithm, game structure, proof shape) in plain notation.
- real_world_examples: concrete instances with real numbers where possible. Indian examples welcome where natural.
- verified_facts: claims you are confident are established. Each must be traceable ("shown in the source paper", "standard result in X").
- speculative_interpretations: readings that go beyond the evidence — clearly the "interpretation" bucket.
- what_to_not_oversimplify: the places where popular simplifications break the actual mechanism.
- what_most_people_misunderstand: the single biggest misconception, stated crisply.
- citation_notes: source traceability. Real papers/results you are certain exist, by name; otherwise "research_inspired: [description]". NEVER fabricate a citation.
- confidence: high/medium/low — your honest confidence in this knowledge base.

Return JSON exactly in this shape:
{
  "technical_core": "...",
  "plain_explanation": "...",
  "key_terms": ["term: meaning", "term: meaning"],
  "prerequisite_concepts": ["..."],
  "mental_models": ["..."],
  "mathematical_or_logical_structure": "...",
  "real_world_examples": ["..."],
  "verified_facts": ["..."],
  "speculative_interpretations": ["..."],
  "what_to_not_oversimplify": ["..."],
  "what_most_people_misunderstand": "...",
  "citation_notes": ["..."],
  "confidence": "high"
}`;
}
