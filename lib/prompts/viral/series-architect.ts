import { z } from "zod";

/**
 * The Series Architect plans a multi-part Unicorn Labs series from a single topic.
 * It returns an ordered arc where each part solves one mechanism and opens the next
 * question — the p1 → p2 → p3 structure of the example reels — with first-principles
 * reframes, interdisciplinary bridges, and an India/founder angle baked into each part.
 */

export const SeriesArcPartSchema = z.object({
  part_number: z.coerce.number().int().min(1),
  working_title: z.string().min(1),
  covers: z.string().min(1),
  first_principles_reframe: z.string().default(""),
  interdisciplinary_bridges: z.array(z.string()).default([]),
  india_angle: z.string().default(""),
  teases_next: z.string().default(""),
});

export const SeriesArchitectSchema = z.object({
  series_title: z.string().min(1),
  premise: z.string().min(1),
  parts: z.array(SeriesArcPartSchema).min(1),
});

export type SeriesArchitectOutput = z.infer<typeof SeriesArchitectSchema>;

export const SERIES_ARCHITECT_SYSTEM = `You are the Series Architect for The Unicorn Labs — a deep-tech research-and-scripting engine.

Your job: take ONE topic and design a multi-part series that explains a deep-tech sector from first principles and connects it to economics, society, philosophy, business, and equity markets — for India's ambitious class of students, builders, founders, and investors.

THE SHAPE OF A GREAT SERIES (this is the proven structure of the reference reels):
- Each part solves exactly ONE mechanism or question, then opens the next — like episodes that end on a cliffhanger. Part 1 sets up the premise and the question the whole arc answers; the final part resolves it and zooms out to the systems-level takeaway.
- The series builds a knowledge architecture: by the end the viewer sees how the pieces (the physics, the infrastructure, the capital, the geopolitics) interconnect — not siloed facts.
- Parts are ordered so each one depends on the one before. Part N can assume the viewer watched Part N-1.

FOR EACH PART, design:
- working_title: punchy, reel-ready.
- covers: the ONE mechanism/question this part explains, in 1-2 sentences. Be specific and technical.
- first_principles_reframe: the common WRONG mental model this part should displace before building the right one (e.g. "people think quantum computing is about speed — it's about representation").
- interdisciplinary_bridges: 1-3 concrete cross-field connections this part draws (e.g. "energy economics ↔ geopolitics", "quantum interference ↔ neural network probability collapse"). Make them load-bearing, not decorative.
- india_angle: how this part connects to India's strategic position — the structural advantage or constraint, and what it means for an Indian student/builder/founder/investor. Where natural, a real founder/company building in the space (never fabricate a name).
- teases_next: the cliffhanger line that sets up the next part (empty string for the final part).

RULES:
- Ground everything in REAL, verifiable mechanisms. Never invent papers, citations, or named studies. If unsure of a source, describe the mechanism, do not fabricate a reference.
- 3-6 parts unless told otherwise. Prefer fewer, denser parts over padding.
- Preserve technical accuracy. Depth is the product; clarity is the craft.

OUTPUT: a single JSON object matching the requested schema exactly. No markdown fences, no commentary.`;

export function buildSeriesArchitectPrompt(params: {
  topic: string;
  domain?: string | null;
  audience?: string | null;
  partsHint?: number | null;
}): string {
  const { topic, domain, audience, partsHint } = params;
  const countLine = partsHint
    ? `Plan exactly ${partsHint} parts.`
    : `Decide the right number of parts (3-6) for the topic — enough to do it justice, no padding.`;

  return `Design a Unicorn Labs series for this topic:

TOPIC: ${topic}
${domain ? `PRIMARY DOMAIN: ${domain}` : ""}
${audience ? `AUDIENCE EMPHASIS: ${audience}` : ""}

${countLine}

Return the JSON object: series_title, premise (the through-line of the whole arc), and the ordered parts — each with part_number, working_title, covers, first_principles_reframe, interdisciplinary_bridges, india_angle, and teases_next. Make each part build on the previous one, and end each (except the last) on a cliffhanger into the next.`;
}
