import { runAgent } from "./runner";
import { z } from "zod";
import type { DemoSpec } from "./types";

const DemoBuilderSchema = z.object({
  component_code: z.string(),
  dependencies: z.array(z.string()),
  notes: z.string(),
});

export async function buildDemoComponent(
  spec: DemoSpec,
  context?: { pipelineId?: string; episodeId?: string }
): Promise<{ component_code: string; dependencies: string[]; notes: string }> {
  const prompt = `Generate a React client component for this educational demo spec.

Demo spec:
${JSON.stringify(spec, null, 2)}

Requirements:
- "use client" directive
- Use Tailwind CSS for styling
- Single Run Demo button
- Toy data / heuristics only
- Comments explaining learning points
- Export default function named DemoComponent
- No external API calls
- Under 250 lines

Return JSON with component_code, dependencies (npm packages if any), notes.`;

  const { output } = await runAgent({
    agentName: "demo_builder",
    userPrompt: prompt,
    schema: DemoBuilderSchema,
    context,
    extraSystem: "Code is stored for review — must be safe, no eval, no dangerouslySetInnerHTML with user input.",
  });

  return output;
}
