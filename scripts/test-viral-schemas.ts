/**
 * Feeds each viral pipeline Zod schema deliberately malformed payloads and
 * asserts the normalizers survive. Run: npx tsx scripts/test-viral-schemas.ts
 */
import {
  CuriosityMinerSchema,
  ExpertResearchSchema,
  HookLabSchema,
  ScriptArchitectSchema,
  VisualDirectorSchema,
  EngagementEngineerSchema,
  ViralityCriticSchema,
  ProjectBridgeSchema,
  StyleExtractorSchema,
} from "../lib/prompts/viral/output-schemas";

let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failures++;
    console.error(`✗ ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// --- Curiosity Miner ---
check("curiosity: alternate keys + string emotion variants", () => {
  const out = CuriosityMinerSchema.parse({
    paradox: "Deleting 90% of a model can make it better.",
    claims: "claim a; claim b\nclaim c",
    hooks: ["why does this work?"],
    misconceptions: ["bigger is always better"],
    mechanism: "Lottery tickets.",
    real_world_connection: "Your phone runs pruned models.",
    best: { angle: "The 90% delete", why: "sounds impossible", emotion: "SHOCKED" },
  });
  assert(out.best_angle.target_emotion === "shock", "emotion coercion failed");
  assert(out.counterintuitive_claims.length === 3, "string split failed");
});

check("curiosity: empty object survives", () => {
  const out = CuriosityMinerSchema.parse({});
  assert(out.best_angle.target_emotion === "curiosity", "default emotion");
});

// --- Expert Research ---
check("research: confidence coercion + missing arrays", () => {
  const out = ExpertResearchSchema.parse({
    technical_core: "x",
    explanation: "plain",
    confidence: "Very High",
  });
  assert(out.confidence === "high", "confidence");
  assert(Array.isArray(out.verified_facts), "verified_facts array");
});

// --- Hook Lab ---
check("hook lab: winner auto-picked when missing", () => {
  const out = HookLabSchema.parse({
    hooks: [
      { hook: "weak", archetype: "a", curiosity_score: 2, clarity_score: 2 },
      { hook: "strong", archetype: "b", curiosity_score: "9", clarity_score: 9, recommended: "true" },
    ],
  });
  assert(out.winner === "strong", `winner should be auto-picked, got ${out.winner}`);
  assert(out.hooks[1].recommended === true, "recommended string→bool");
  assert(out.hooks[1].curiosity_score === 9, "score string→number");
});

check("hook lab: winner as object", () => {
  const out = HookLabSchema.parse({
    hooks: [{ hook: "h1", archetype: "a" }],
    winner: { hook: "h1", archetype: "a" },
  });
  assert(out.winner === "h1", "object winner unwrap");
});

check("hook lab: empty hooks rejected", () => {
  const result = HookLabSchema.safeParse({ hooks: [] });
  assert(!result.success, "empty hooks should fail validation");
});

// --- Script Architect ---
check("scripts: aliased durations + string sections", () => {
  const out = ScriptArchitectSchema.parse({
    scripts: {
      "30_seconds": { hook: "h", setup: "s", mystery: "m", technical_reveal: "t", concrete_example: "c", twist: "tw", payoff: "p", cta: "c" },
      "45s": "one big string script",
      "60s": {},
      "90s": {},
      "3_minutes": {},
    },
    carousel_slides: [
      { title: "Slide A", content: "body text" },
      '{"headline": "Slide B", "body": "json string slide"}',
    ],
  });
  assert(out.scripts["30s"].hook === "h", "duration alias 30_seconds");
  assert(out.scripts["45s"].technical_reveal === "one big string script", "string script fallback");
  assert(out.carousel.slides.length === 2, "carousel from carousel_slides");
  assert(out.carousel.slides[0].headline === "Slide A", "title→headline");
  assert(out.carousel.slides[1].headline === "Slide B", "JSON-string slide parsed");
});

// --- Visual Director ---
check("visual: storyboard + missing prompt fields", () => {
  const out = VisualDirectorSchema.parse({
    style: { keywords: ["neon"], colors: ["#000"] },
    storyboard: [{ time: "0:00-0:03", scene: "opening", text: "WAIT", prompt: "a prompt" }],
  });
  assert(out.style_profile.visual_keywords[0] === "neon", "style alias");
  assert(out.reel_storyboard[0].timestamp === "0:00-0:03", "beat time alias");
  assert(out.reel_storyboard[0].asset_prompt === "a prompt", "prompt alias");
});

// --- Engagement Engineer ---
check("engagement: comment bait aliases", () => {
  const out = EngagementEngineerSchema.parse({
    caption: "cap",
    comment_bait: ["q1", "q2"],
    titles: "t1; t2",
  });
  assert(out.comment_bait_questions.length === 2, "comment_bait alias");
  assert(out.post_titles.length === 2, "titles split");
});

// --- Virality Critic ---
check("critic: flat dimensions + clamping + recommendation", () => {
  const out = ViralityCriticSchema.parse({
    overall: 150,
    scroll_stop_hook: 8,
    curiosity_gap: "9",
    recommendation: "PUBLISH IT",
    issues: ["a", "b", "c", "d"],
  });
  assert(out.overall_score === 100, "overall clamped to 100");
  assert(out.dimension_scores.scroll_stop_hook === 8, "flat dimension picked up");
  assert(out.final_recommendation === "publish", "recommendation coercion");
  assert(out.top_3_issues.length === 3, "issues capped at 3");
});

// --- Project Bridge ---
check("project bridge: 1_hour_version key + level coercion", () => {
  const out = ProjectBridgeSchema.parse({
    title: "Build it",
    level: "University",
    build: "a sim",
    "1_hour_version": "spreadsheet",
    "1_week_version": "react app",
  });
  assert(out.student_level === "college", "level coercion");
  assert(out.one_hour_version === "spreadsheet", "1_hour_version key");
});

// --- Style Extractor ---
check("style extractor: prompt_snippet min length enforced", () => {
  const bad = StyleExtractorSchema.safeParse({ prompt_snippet: "short" });
  assert(!bad.success, "short snippet should fail");
  const good = StyleExtractorSchema.safeParse({
    name: "Test",
    style_prompt: "A long, detailed visual style instruction paragraph naming palette and lighting.",
  });
  assert(good.success, "style_prompt alias should pass");
});

console.log(failures === 0 ? "\nAll schema tests passed." : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
