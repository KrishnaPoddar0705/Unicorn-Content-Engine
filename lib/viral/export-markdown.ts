import type { ViralStageOutputs } from "@/lib/prompts/viral/output-schemas";
import type { ViralEpisode } from "@/lib/supabase/types";

const BEATS: [string, string][] = [
  ["hook", "Hook"],
  ["setup", "Setup"],
  ["mystery", "Mystery"],
  ["technical_reveal", "Technical Reveal"],
  ["concrete_example", "Concrete Example"],
  ["twist", "Twist"],
  ["payoff", "Payoff"],
  ["cta", "CTA"],
];

function section(title: string, body: string): string {
  return body.trim() ? `## ${title}\n\n${body.trim()}\n` : "";
}

function bullets(items: string[] | undefined): string {
  return (items || []).map((i) => `- ${i}`).join("\n");
}

/** Pure transform: full episode package → a structured markdown document. */
export function viralEpisodeToMarkdown(
  episode: Pick<
    ViralEpisode,
    "title" | "domain" | "platform" | "tone" | "depth" | "winner_hook" | "created_at"
  >,
  outputs: ViralStageOutputs
): string {
  const parts: string[] = [
    `# ${episode.title}`,
    "",
    [
      episode.domain && `**Domain:** ${episode.domain}`,
      `**Platform:** ${episode.platform.replace(/_/g, " ")}`,
      `**Tone:** ${episode.tone.replace(/_/g, " ")}`,
      `**Depth:** ${episode.depth.replace(/_/g, " ")}`,
    ]
      .filter(Boolean)
      .join(" · "),
    "",
  ];

  if (episode.winner_hook) {
    parts.push(`> ${episode.winner_hook}`, "");
  }

  const c = outputs.curiosity_miner;
  if (c) {
    parts.push(
      section(
        "Curiosity Angles",
        [
          `**Best angle:** ${c.best_angle.title} _(${c.best_angle.target_emotion})_`,
          `**Core paradox:** ${c.core_paradox}`,
          `**Hidden mechanism:** ${c.hidden_mechanism}`,
          `**Real-world connection:** ${c.unexpected_real_world_connection}`,
          "",
          "**Counterintuitive claims:**",
          bullets(c.counterintuitive_claims),
        ].join("\n")
      )
    );
  }

  const r = outputs.expert_research;
  if (r) {
    parts.push(
      section(
        "Research Notes",
        [
          `**Confidence:** ${r.confidence}`,
          "",
          `**Technical core:** ${r.technical_core}`,
          "",
          r.plain_explanation,
          "",
          "**Verified facts:**",
          bullets(r.verified_facts),
          "",
          "**Speculative interpretations:**",
          bullets(r.speculative_interpretations),
          "",
          `**What most people misunderstand:** ${r.what_most_people_misunderstand}`,
          "",
          "**Citation notes:**",
          bullets(r.citation_notes),
        ].join("\n")
      )
    );
  }

  const h = outputs.hook_lab;
  if (h) {
    const rows = h.hooks.map(
      (hk) =>
        `| ${hk.hook.replace(/\|/g, "\\|")} | ${hk.archetype.replace(/\|/g, "\\|")} | ${hk.curiosity_score} | ${hk.clarity_score} | ${hk.technical_depth_score} | ${hk.risk_of_clickbait} | ${hk.recommended ? "★" : ""} |`
    );
    parts.push(
      section(
        "Hooks",
        [
          `**Winner:** ${h.winner} _(${h.winner_archetype})_`,
          "",
          "| Hook | Archetype | Curiosity | Clarity | Depth | Clickbait | Rec |",
          "|---|---|---|---|---|---|---|",
          ...rows,
        ].join("\n")
      )
    );
  }

  const s = outputs.script_architect;
  if (s) {
    const scriptSections = Object.entries(s.scripts)
      .map(([duration, sections]) => {
        const beats = BEATS.map(([key, label]) => {
          const text = (sections as Record<string, string>)[key];
          return text?.trim() ? `**${label}:** ${text}` : "";
        })
          .filter(Boolean)
          .join("\n\n");
        return `### ${duration}\n\n${beats}`;
      })
      .join("\n\n");
    parts.push(section("Scripts", scriptSections));

    if (s.carousel.slides.length > 0) {
      parts.push(
        section(
          "Carousel",
          s.carousel.slides
            .map(
              (sl) =>
                `### Slide ${sl.slide_number}: ${sl.headline}\n\n${sl.body}\n\n_Visual: ${sl.visual_direction}_`
            )
            .join("\n\n")
        )
      );
    }
    if (s.talking_head_notes.length > 0) {
      parts.push(section("Talking-head notes", bullets(s.talking_head_notes)));
    }
    if (s.voiceover_notes.length > 0) {
      parts.push(section("Voiceover notes", bullets(s.voiceover_notes)));
    }
  }

  const v = outputs.visual_director;
  if (v) {
    parts.push(
      section(
        "Storyboard",
        [
          "| Time | Visual | On-screen text | Motion |",
          "|---|---|---|---|",
          ...v.reel_storyboard.map(
            (b) =>
              `| ${b.timestamp} | ${b.visual.replace(/\|/g, "\\|")} | ${b.on_screen_text.replace(/\|/g, "\\|")} | ${b.motion.replace(/\|/g, "\\|")} |`
          ),
          "",
          "### Asset prompts",
          ...v.reel_storyboard.flatMap((b) =>
            b.asset_prompt ? [``, `**${b.timestamp}:**`, "```", b.asset_prompt, "```"] : []
          ),
        ].join("\n")
      )
    );
    parts.push(
      section(
        "Generation Prompts",
        [
          "### Higgsfield",
          "```",
          v.higgsfield_prompt,
          "```",
          "### Kling",
          "```",
          v.kling_prompt,
          "```",
          "### Thumbnail",
          "```",
          v.thumbnail_prompt,
          "```",
        ].join("\n")
      )
    );
  }

  const e = outputs.engagement_engineer;
  if (e) {
    parts.push(
      section(
        "Captions & Engagement",
        [
          `**Caption:**\n\n${e.caption}`,
          "",
          "**Variants:**",
          bullets(e.caption_variants),
          "",
          `**Pinned comment:** ${e.pinned_comment}`,
          "",
          "**Comment bait:**",
          bullets(e.comment_bait_questions),
          "",
          `**Save trigger:** ${e.save_trigger}`,
          `**Share trigger:** ${e.share_trigger}`,
          "",
          "**CTA variants:**",
          bullets(e.cta_variants),
          "",
          "**Safe claims boundary:**",
          bullets(e.safe_claims_boundary),
        ].join("\n")
      )
    );
  }

  const p = outputs.project_bridge;
  if (p) {
    parts.push(
      section(
        "Student Project",
        [
          `**${p.project_title}** _(${p.student_level.replace("_", " ")})_`,
          "",
          p.what_they_build,
          "",
          `**1-hour version:** ${p.one_hour_version}`,
          "",
          `**1-week version:** ${p.one_week_version}`,
          "",
          `**Portfolio version:** ${p.portfolio_version}`,
          "",
          "**Concepts learned:**",
          bullets(p.concepts_learned),
        ].join("\n")
      )
    );
  }

  const w = outputs.interactive_webpage;
  if (w) {
    parts.push(
      section(
        "Interactive Research Page",
        [
          `**${w.title}** _(theme: ${w.theme})_`,
          "",
          `**Share link:** ${w.share_path}`,
          `**Comment keyword:** \`${w.comment_keyword}\` — viewers comment this on the post to receive the page.`,
        ].join("\n")
      )
    );
  }

  const q = outputs.virality_critic;
  if (q) {
    parts.push(
      section(
        "Virality Critique",
        [
          `**Overall: ${q.overall_score}/100 — ${q.final_recommendation.toUpperCase()}**`,
          "",
          ...Object.entries(q.dimension_scores).map(([k, v2]) => `- ${k.replace(/_/g, " ")}: ${v2}/10`),
          "",
          "**Top issues:**",
          bullets(q.top_3_issues),
          "",
          "**Specific rewrites:**",
          bullets(q.specific_rewrites),
        ].join("\n")
      )
    );
  }

  return parts.filter((p2) => p2 !== "").join("\n");
}

/** All copy-ready generation prompts concatenated for one-click clipboard. */
export function collectVisualPrompts(outputs: ViralStageOutputs): string {
  const v = outputs.visual_director;
  if (!v) return "";
  return [
    ...v.reel_storyboard
      .filter((b) => b.asset_prompt)
      .map((b) => `[${b.timestamp}]\n${b.asset_prompt}`),
    v.higgsfield_prompt && `[Higgsfield]\n${v.higgsfield_prompt}`,
    v.kling_prompt && `[Kling]\n${v.kling_prompt}`,
    v.thumbnail_prompt && `[Thumbnail]\n${v.thumbnail_prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
}
