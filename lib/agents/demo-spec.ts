import { runAgent } from "./runner";
import { DemoSpecSchema, type DemoSpec, type Deconstruction } from "./types";

export async function generateDemoSpec(
  deconstruction: Deconstruction,
  episodeTitle: string,
  context?: { pipelineId?: string; episodeId?: string }
): Promise<DemoSpec> {
  const prompt = `Create an interactive web demo spec for students to rebuild the core intuition of this research.

Episode: ${episodeTitle}
Deconstruction: ${JSON.stringify(deconstruction, null, 2)}

Rules:
- Toy model, simulation, or heuristic only — no complex ML training
- Single "Run Demo" button
- Beautiful simple UI
- Sliders/inputs where useful
- Must be buildable in React in under 200 lines

Return a single JSON object with EXACTLY these string/array fields (no nesting, no markdown):
{
  "demo_title": "string",
  "user_inputs": ["string"],
  "sample_dataset": "string description of toy data",
  "algorithm_or_heuristic": "string",
  "visualization": "string",
  "step_by_step_interaction": ["step 1", "step 2"],
  "expected_result": "string",
  "ui_layout": "string describing layout",
  "educational_notes": "string",
  "code_implementation_plan": "string",
  "edge_cases": ["string"],
  "simplicity_notes": "string",
  "component_key_suggestion": "kebab-case-slug"
}`;

  const { output } = await runAgent({
    agentName: "demo_spec",
    userPrompt: prompt,
    schema: DemoSpecSchema,
    context,
    extraSystem:
      "Keep demos educational and magical but simple. Prefer mock/toy data. All fields required. ui_layout must be a plain string, not an object.",
  });

  return output;
}
