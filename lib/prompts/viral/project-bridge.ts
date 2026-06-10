import type { CuriosityMinerOutput, ExpertResearchOutput } from "./output-schemas";

export function buildProjectBridgePrompt(params: {
  title: string;
  curiosity: CuriosityMinerOutput;
  research: ExpertResearchOutput;
}): string {
  return `You are the Project Bridge agent. Convert this episode's content into a buildable student project — the "we turn research into projects students can actually build" half of the brand promise.

Episode: ${params.title}

THE MECHANISM (what the project must let students touch):
- Technical core: ${params.research.technical_core}
- Math/logic structure: ${params.research.mathematical_or_logical_structure}
- Hidden mechanism: ${params.curiosity.hidden_mechanism}
- Do not oversimplify: ${params.research.what_to_not_oversimplify.join(" | ")}

Design ONE project at three commitment levels — same core idea, increasing depth:
- one_hour_version: spreadsheet/20-lines-of-code/dice-and-paper scale. A student finishes in one sitting and SEES the mechanism work.
- one_week_version: a real small build (simulation, dashboard, toy model) with concrete steps, tools, and a defined "it works when..." outcome.
- portfolio_version: the ambitious version worth putting on a college application or GitHub profile — real data, an extension question, something genuinely theirs.

Also produce:
- interactive_demo_spec: a spec for a single-page interactive web demo of the mechanism — inputs (sliders/buttons), the algorithm/heuristic it runs, the visualization, and the one insight the user should walk away with. Keep it implementable as one self-contained React component with toy data.
- concepts_learned: the transferable concepts, named honestly.
- dataset_or_simulation_needed: what data/simulation the builds need; prefer toy/synthetic data; name real public datasets only if you are certain they exist.

The project must demonstrate the ACTUAL mechanism from the research — not a vaguely-related craft activity.

Return JSON exactly in this shape:
{
  "project_title": "...",
  "student_level": "high_school",
  "what_they_build": "one-paragraph description of the build",
  "concepts_learned": ["..."],
  "dataset_or_simulation_needed": "...",
  "interactive_demo_spec": {
    "demo_title": "...",
    "user_inputs": ["..."],
    "algorithm_or_heuristic": "...",
    "visualization": "...",
    "key_insight": "..."
  },
  "one_hour_version": "...",
  "one_week_version": "...",
  "portfolio_version": "..."
}
student_level must be exactly one of: middle_school, high_school, college.`;
}
