import { runAgent } from "./runner";
import { CalendarStrategistSchema, type CalendarStrategist } from "./types";
import type { Episode } from "@/lib/supabase/types";

export async function planCalendar(
  episodes: Episode[],
  horizonDays: number,
  context?: { pipelineId?: string }
): Promise<CalendarStrategist> {
  const episodeList = episodes.map((e) => ({
    episode_number: e.episode_number,
    title: e.title,
    pillar: e.content_pillars?.code,
    audience: e.target_audience,
    hook: e.viral_hook,
    status: e.status,
  }));

  const prompt = `Create a ${horizonDays}-day Instagram content calendar for Paper to Project.

Available episodes:
${JSON.stringify(episodeList, null, 2)}

Rules:
- Post 3-5 times per week (Mon/Wed/Fri preferred)
- Mix content pillars A-H
- Alternate student/parent/founder audiences
- Start from tomorrow's date
- Include ordering_reason and viral_mechanism for each
- Prefer episodes with demos ready first

Return JSON with items array including episode_number, scheduled_date (YYYY-MM-DD), post_title, pillar_code, target_audience, primary_cta, ordering_reason, recording_notes, viral_mechanism, format.`;

  const { output } = await runAgent({
    agentName: "calendar_strategist",
    userPrompt: prompt,
    schema: CalendarStrategistSchema,
    context,
    extraSystem: "Balance pillar distribution. Front-load highest viral potential episodes.",
  });

  return output;
}
