import type { ViralEpisode } from "@/lib/supabase/types";

/**
 * Non-negotiable quality constraints injected into every viral pipeline agent.
 * These encode the "epistemic entertainment engine" philosophy.
 */
export const VIRAL_QUALITY_CONSTRAINTS = `EPISTEMIC QUALITY RULES (non-negotiable):
- NEVER invent papers, citations, statistics, or named studies. If you cannot verify a specific source, say "research on X" and mark it research_inspired — do not fabricate authors, years, or journal names.
- Separate facts from interpretation. Verified mechanisms are stated plainly; interpretations and extrapolations are framed as such ("one reading of this", "this suggests").
- Never overclaim research implications. The gap between what a result shows and what it might mean is part of the content, not something to hide.
- Preserve technical accuracy when simplifying. Drop detail, never correctness. If a simplification breaks the mechanism, find a better simplification.
- Every piece of content must contain: a curiosity gap, one "wait, what?" contradiction, a mental-model shift, a technical reveal, one simple visual metaphor, at least one buildable student project angle, a "what most people misunderstand" element, and a dopamine payoff at the end.
- Every piece must give the viewer a reason to save, share, or comment.
- No generic influencer language, no guru energy, no shallow hype, no "game-changer"/"mind-blowing" filler. The intelligence of the content IS the hook.`;

const AUDIENCE_NOTES: Record<string, string> = {
  middle_school:
    "Audience: middle schoolers. Vivid concrete imagery, zero jargon without immediate translation, examples from games/sports/pocket money. Short sentences.",
  high_school:
    "Audience: high schoolers. Smart but new to the field. Real terminology is fine when translated inline. Examples from social media, exams, money, games.",
  college:
    "Audience: college students. Comfortable with technical language and basic math notation. Do not over-explain basics; respect their intelligence.",
  general_curious_adult:
    "Audience: generally curious adults. Smart, busy, allergic to being talked down to. Use real-world stakes (money, markets, careers, technology they use daily).",
};

const DEPTH_NOTES: Record<string, string> = {
  light:
    "Depth: light. One core idea, no equations, mechanism gestured at with a metaphor. Prioritize the feeling of understanding.",
  medium:
    "Depth: medium. The actual mechanism explained in plain language, one concrete number or example, no derivations.",
  technical:
    "Depth: technical. Use real terminology, show the actual mechanism step by step, at most one equation, name the trade-offs.",
  extremely_technical:
    "Depth: extremely technical but understandable. Full mechanism with correct terminology, the key equation or algorithm shown and unpacked term by term, edge cases acknowledged. The challenge is keeping it gripping — do not dumb it down, make it CLEAR.",
};

const TONE_NOTES: Record<string, string> = {
  founder_led:
    "Tone: founder-led. First person, building in public, sharing what you found. Curious peer, not lecturer.",
  mysterious:
    "Tone: mysterious. Withhold strategically, open loops early, resolve late. Detective energy, never clickbait dishonesty.",
  cinematic:
    "Tone: cinematic. Strong scene-setting, dramatic pacing, visual language in the script itself. Every beat paintable.",
  technical:
    "Tone: technical. Precise, confident, engineer-to-engineer. The flex is accuracy and depth, delivered cleanly.",
  provocative:
    "Tone: provocative. Lead with the contrarian claim, defend it with evidence. Invite disagreement — but every provocation must be defensible.",
  calm_professor:
    "Tone: calm professor. Measured, warm, authoritative. No urgency tricks; the material's inherent interest carries it.",
};

const PLATFORM_NOTES: Record<string, string> = {
  instagram_reels:
    "Platform: Instagram Reels. 9:16 vertical, hook within 1.5s, on-screen text assumed (many watch muted), caption does heavy lifting for saves, hashtags matter.",
  tiktok:
    "Platform: TikTok. Faster cuts, more conversational, native/raw aesthetic beats polish, comment bait drives distribution, looping endings perform well.",
  youtube_shorts:
    "Platform: YouTube Shorts. Slightly longer attention tolerance, titles matter, viewers tolerate more depth, subscribe CTA is natural here.",
  linkedin:
    "Platform: LinkedIn. Professional curiosity framing, career/market stakes, more text-forward, contrarian-but-rigorous performs, no hashtag spam.",
};

function note(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "";
  const normalized = key.toLowerCase().trim().replace(/[\s-]+/g, "_");
  return map[normalized] ?? "";
}

export function buildSharedContext(params: {
  episode: Pick<
    ViralEpisode,
    "target_audience" | "depth" | "tone" | "platform" | "cta_goal" | "output_format" | "domain"
  >;
  seriesSnippet?: string;
  memorySummary?: string;
  styleSnippet?: string;
}): string {
  const { episode } = params;
  const sections = [
    VIRAL_QUALITY_CONSTRAINTS,
    [
      episode.domain ? `Domain: ${episode.domain}.` : "",
      note(AUDIENCE_NOTES, episode.target_audience),
      note(DEPTH_NOTES, episode.depth),
      note(TONE_NOTES, episode.tone),
      note(PLATFORM_NOTES, episode.platform),
      episode.cta_goal ? `Primary CTA goal: ${episode.cta_goal}.` : "",
      episode.output_format !== "all" ? `Priority output format: ${episode.output_format}.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    params.seriesSnippet,
    params.styleSnippet,
    params.memorySummary,
  ];
  return sections.filter(Boolean).join("\n\n");
}

/** Describes the episode's source material for use inside user prompts. */
export function describeSourceMaterial(episode: {
  input_mode: string;
  raw_input: string | null;
  paper_text: string | null;
  domain: string | null;
  title: string;
}): string {
  switch (episode.input_mode) {
    case "paper":
      return `SOURCE — Research paper (full text excerpt below). Treat its claims as the primary source; quote its actual findings.\n\n${(episode.paper_text || episode.raw_input || "").slice(0, 12000)}`;
    case "idea":
      return `SOURCE — Rough idea from Krishna: "${episode.raw_input}". Ground it in real, verifiable research and mechanisms from the ${episode.domain || "relevant"} domain. Do not invent papers — reference only well-known, real work, or frame as research_inspired.`;
    case "topic":
      return `SOURCE — Domain topic: ${episode.domain || episode.title}. ${episode.raw_input ? `Specific angle: "${episode.raw_input}".` : ""} Pick the most viral-worthy real mechanism, result, or paradox in this domain. Only reference real, well-known research.`;
    case "trend":
      return `SOURCE — Trending topic / news item: "${episode.raw_input}". Connect this trend to deep, real research — find the rigorous mechanism underneath the headline. The trend is the hook; the research is the substance.`;
    case "reference_visual":
      return `SOURCE — Visual-first episode. Concept: "${episode.raw_input || episode.title}". The visual style is the anchor; build rigorous content that fits it.`;
    default:
      return `SOURCE: ${episode.raw_input || episode.title}`;
  }
}
