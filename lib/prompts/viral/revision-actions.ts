import type { ViralStage } from "@/lib/supabase/types";

export interface RevisionAction {
  key: string;
  label: string;
  applicableStages: ViralStage[];
  instruction: string;
}

/** Single source of truth for one-click revision actions (UI buttons + revise route). */
export const REVISION_ACTIONS: RevisionAction[] = [
  {
    key: "more_controversial",
    label: "Make it more controversial",
    applicableStages: ["hook_lab", "script_architect", "engagement_engineer"],
    instruction:
      "Make this more controversial and contrarian — sharpen the provocations and lead with the most defensible contrarian claim. Stay strictly honest to the research: every provocation must survive a fact-check. Do not cross into overclaiming.",
  },
  {
    key: "more_technical",
    label: "Make it more technical",
    applicableStages: ["script_architect", "expert_research", "hook_lab"],
    instruction:
      "Increase the technical depth: use real terminology, show more of the actual mechanism, include the key equation or algorithm where natural. Keep it gripping — clarity must not drop.",
  },
  {
    key: "make_easier",
    label: "Make it easier",
    applicableStages: ["script_architect", "expert_research", "hook_lab"],
    instruction:
      "Simplify for a broader audience: replace jargon with plain language and concrete imagery, shorten sentences, add one more everyday analogy. Drop detail, never correctness.",
  },
  {
    key: "add_indian_example",
    label: "Add an Indian example",
    applicableStages: ["script_architect", "expert_research", "engagement_engineer", "curiosity_miner"],
    instruction:
      "Replace or augment the main example with a concrete Indian example (Indian markets, UPI, Indian startups, IIT/board exams, cricket, Indian economic events) — real and accurate, not token. Keep all numbers honest.",
  },
  {
    key: "more_cinematic",
    label: "Make it more cinematic",
    applicableStages: ["script_architect", "visual_director"],
    instruction:
      "Make this more cinematic: stronger scene-setting, visual language inside the script lines, dramatic pacing with deliberate pauses, every beat paintable as a shot. No purple prose — cinematic precision.",
  },
  {
    key: "less_clickbaity",
    label: "Make it less clickbaity",
    applicableStages: ["hook_lab", "script_architect", "engagement_engineer"],
    instruction:
      "Reduce clickbait: remove any overpromise the content doesn't deliver, replace hype adjectives with specific claims, let the substance carry the intrigue. The hook should still stop the scroll — through specificity, not exaggeration.",
  },
  {
    key: "ten_more_hooks",
    label: "Generate 10 more hooks",
    applicableStages: ["hook_lab"],
    instruction:
      "Generate 10 NEW hooks not present in the current list, exploring archetypes and emotions the current set underuses. Score them on the same dimensions. Return the COMPLETE updated JSON with all existing hooks plus the 10 new ones appended, and re-evaluate the winner across the full set.",
  },
  {
    key: "turn_into_carousel",
    label: "Strengthen the carousel",
    applicableStages: ["script_architect"],
    instruction:
      "Rework the carousel as the primary format: expand to 8-10 slides, make slide 1 a scroll-stopping visual statement, give every slide a save-worthy standalone insight, and sharpen each visual_direction into a complete design brief.",
  },
  {
    key: "three_part_series",
    label: "Turn into a 3-part series",
    applicableStages: ["script_architect"],
    instruction:
      "Restructure the content as a 3-part series: rewrite the 60s and 90s scripts as Part 1 ending on a genuine cliffhanger, and use talking_head_notes to outline Parts 2 and 3 (their hooks, reveals, and payoffs). Each part must stand alone AND pull forward.",
  },
  {
    key: "regenerate_higgsfield",
    label: "Regenerate Higgsfield prompt",
    applicableStages: ["visual_director"],
    instruction:
      "Regenerate the higgsfield_prompt: more cinematic motion design, explicit camera movement, lighting transitions, and a stronger hero moment. Keep it copy-ready and 9:16.",
  },
  {
    key: "regenerate_kling",
    label: "Regenerate Kling prompt",
    applicableStages: ["visual_director"],
    instruction:
      "Regenerate the kling_prompt: tighter composition, stronger focal hierarchy, under 2000 characters, 9:16 vertical, copy-ready.",
  },
];

export function getRevisionAction(key: string): RevisionAction | undefined {
  return REVISION_ACTIONS.find((a) => a.key === key);
}

export function getActionsForStage(stage: ViralStage): RevisionAction[] {
  return REVISION_ACTIONS.filter((a) => a.applicableStages.includes(stage));
}
