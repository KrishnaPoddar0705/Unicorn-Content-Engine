export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type CitationStatus = "verified" | "research_inspired" | "pending_verification";
export type RebuildType =
  | "simulation"
  | "toy_model"
  | "dashboard"
  | "calculator"
  | "visualizer"
  | "game"
  | "classifier"
  | "recommender"
  | "network_graph";

const REBUILD_TYPES: RebuildType[] = [
  "simulation",
  "toy_model",
  "dashboard",
  "calculator",
  "visualizer",
  "game",
  "classifier",
  "recommender",
  "network_graph",
];

export function coerceString(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function coerceStringArray(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) return value.map((v) => coerceString(v)).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return fallback;
}

export function coerceNumber(value: unknown, fallback: number, min = 1, max = 10): number {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function normalizeDemoSpec(raw: unknown): Record<string, unknown> {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    demo_title: coerceString(obj.demo_title ?? obj.title, "Interactive Demo"),
    user_inputs: coerceStringArray(obj.user_inputs ?? obj.inputs, ["Primary input", "Run Demo button"]),
    sample_dataset: coerceString(obj.sample_dataset ?? obj.dataset, "Small toy dataset"),
    algorithm_or_heuristic: coerceString(obj.algorithm_or_heuristic ?? obj.algorithm, "Simple heuristic"),
    visualization: coerceString(obj.visualization ?? obj.viz, "Interactive chart or network graph"),
    step_by_step_interaction: coerceStringArray(obj.step_by_step_interaction ?? obj.steps, [
      "Adjust inputs",
      "Click Run Demo",
      "View results",
    ]),
    expected_result: coerceString(obj.expected_result ?? obj.result, "Clear visual output students can interpret"),
    ui_layout: coerceString(obj.ui_layout, "Two columns: controls left, visualization right"),
    educational_notes: coerceString(obj.educational_notes, "What students learn from running the demo"),
    code_implementation_plan: coerceString(
      obj.code_implementation_plan ?? obj.implementation_plan,
      "Single React component with toy data"
    ),
    edge_cases: coerceStringArray(obj.edge_cases, ["Empty input", "Extreme slider values"]),
    simplicity_notes: coerceString(obj.simplicity_notes, "Under 200 lines, no backend required"),
    component_key_suggestion: coerceString(
      obj.component_key_suggestion ?? obj.component_key ?? obj.slug,
      "demo"
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
  };
}

function extractHookText(hook: unknown): string {
  if (typeof hook === "string") {
    try {
      const parsed = JSON.parse(hook);
      if (parsed && typeof parsed === "object") return extractHookText(parsed);
    } catch {
      /* plain string */
    }
    return hook.trim();
  }
  if (hook && typeof hook === "object") {
    const h = hook as Record<string, unknown>;
    return coerceString(h.text ?? h.hook ?? h.content);
  }
  return coerceString(hook);
}

function extractScriptField(obj: Record<string, unknown>, key: string, altKey: string): string {
  let val = obj[key];
  if (!val && obj.scripts && typeof obj.scripts === "object") {
    val = (obj.scripts as Record<string, unknown>)[altKey] ?? (obj.scripts as Record<string, unknown>)[key];
  }
  if (val && typeof val === "object") {
    const v = val as Record<string, unknown>;
    return coerceString(v.text ?? v.script ?? v.content ?? v.main);
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object") return extractScriptField({ x: parsed } as Record<string, unknown>, "x", "x");
    } catch {
      /* plain string */
    }
    return val.replace(/\\n/g, "\n");
  }
  return coerceString(val);
}

function extractCaption(val: unknown): string {
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object") return extractCaption(parsed);
    } catch {
      return val.replace(/\\n/g, "\n");
    }
  }
  if (val && typeof val === "object") {
    const c = val as Record<string, unknown>;
    return coerceString(c.main ?? c.text ?? c.caption).replace(/\\n/g, "\n");
  }
  return coerceString(val);
}

function extractCta(val: unknown): string {
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object") return extractCta(parsed);
    } catch {
      return val;
    }
  }
  if (val && typeof val === "object") {
    const c = val as Record<string, unknown>;
    const prompt = coerceString(c.prompt ?? c.text);
    const keyword = coerceString(c.keyword);
    if (keyword && prompt) {
      if (prompt.toLowerCase().includes(keyword.toLowerCase())) return prompt;
      return `Comment ${keyword.toUpperCase()} — ${prompt}`;
    }
    return prompt || coerceString(val);
  }
  return coerceString(val, "Comment DEMO for the rebuild worksheet.");
}

function buildScriptsFromContent(hook: string, caption: string, positioning: string): {
  script_45s: string;
  script_60s: string;
  script_90s: string;
} {
  if (!hook && !caption) {
    return { script_45s: "", script_60s: "", script_90s: "" };
  }
  const paragraphs = caption.split(/\n\n+/).filter(Boolean);
  const close = positioning || "We turn research papers into projects students can actually build.";
  const script_45s = [hook, ...paragraphs.slice(0, 2), close].filter(Boolean).join("\n\n");
  const script_60s = [hook, ...paragraphs.slice(0, 4), close].filter(Boolean).join("\n\n");
  const script_90s = [hook, caption, close].filter(Boolean).join("\n\n");
  return { script_45s, script_60s, script_90s };
}

function fillCarouselSlides(
  slides: { title: string; body: string }[],
  titleVariants: string[],
  hook: string,
  caption: string
): { title: string; body: string }[] {
  const hasContent = slides.some((s) => s.body.trim());
  if (hasContent) return slides;

  if (titleVariants.length >= 3) {
    return titleVariants.slice(0, 5).map((body, i) => ({
      title: i === 0 ? "The hook" : `Slide ${i + 1}`,
      body,
    }));
  }

  const paragraphs = caption.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length >= 2) {
    return paragraphs.slice(0, 5).map((body, i) => ({
      title: i === 0 ? "The insight" : `Slide ${i + 1}`,
      body,
    }));
  }

  return [{ title: "The insight", body: hook || caption || "Research → project" }];
}

export function normalizeScriptwriting(raw: unknown): Record<string, unknown> {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rawHooks = obj.hook_options ?? obj.hooks;
  const hooks = Array.isArray(rawHooks)
    ? rawHooks.map(extractHookText).filter(Boolean)
    : coerceStringArray(rawHooks);
  while (hooks.length < 3) {
    hooks.push(extractHookText(obj.hook_3s) || "Wait — what if research could be this simple?");
  }

  const slides = Array.isArray(obj.carousel_slides)
    ? obj.carousel_slides.map((s) => {
        if (typeof s === "string") {
          try {
            const parsed = JSON.parse(s) as Record<string, unknown>;
            return {
              title: coerceString(parsed.title ?? parsed.headline, "Slide"),
              body: coerceString(parsed.body ?? parsed.content ?? parsed.text),
            };
          } catch {
            return { title: "Slide", body: s };
          }
        }
        const slide = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
        return {
          title: coerceString(slide.title ?? slide.headline ?? slide.slide_title, "Slide"),
          body: coerceString(slide.body ?? slide.content ?? slide.text),
        };
      })
    : [];

  const caption = extractCaption(obj.caption);
  const positioning = coerceString(
    obj.positioning_line,
    "We turn research papers into projects students can actually build."
  );
  const hook3s = extractHookText(obj.hook_3s) || hooks[0];
  const titleVariants = coerceStringArray(obj.title_variants, [hook3s]);

  let script45 = extractScriptField(obj, "script_45s", "45s");
  let script60 = extractScriptField(obj, "script_60s", "60s");
  let script90 = extractScriptField(obj, "script_90s", "90s");

  if (!script45.trim() && !script60.trim() && !script90.trim()) {
    const built = buildScriptsFromContent(hook3s, caption, positioning);
    script45 = built.script_45s;
    script60 = built.script_60s;
    script90 = built.script_90s;
  }

  const carouselSlides = fillCarouselSlides(
    slides.length > 0 ? slides : [],
    titleVariants,
    hook3s,
    caption
  );

  return {
    hook_3s: hook3s,
    hook_options: hooks.slice(0, 3),
    script_45s: script45,
    script_60s: script60,
    script_90s: script90,
    caption,
    first_comment: extractCaption(obj.first_comment) || "Which part surprised you most?",
    hashtags: coerceStringArray(obj.hashtags, ["#PaperToProject", "#STEM", "#LearnAI"]),
    carousel_slides: carouselSlides,
    title_variants: titleVariants,
    thumbnail_text: coerceString(obj.thumbnail_text, "I rebuilt this paper"),
    parent_angle: coerceString(obj.parent_angle),
    student_angle: coerceString(obj.student_angle),
    school_angle: coerceString(obj.school_angle),
    founder_angle: coerceString(obj.founder_angle),
    cta: extractCta(obj.cta),
    explain_curious: coerceString(obj.explain_curious),
    b_roll_suggestions: coerceStringArray(obj.b_roll_suggestions, ["Show laptop screen", "Point at graph"]),
    visual_props: coerceStringArray(obj.visual_props, ["Whiteboard", "Laptop"]),
    positioning_line: positioning,
  };
}

export function normalizeQualityCritic(raw: unknown): Record<string, unknown> {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const score = (key: string) => coerceNumber(obj[key], 7);
  return {
    hook_strength: score("hook_strength"),
    surprise_factor: score("surprise_factor"),
    student_relevance: score("student_relevance"),
    parent_relevance: score("parent_relevance"),
    demo_feasibility: score("demo_feasibility"),
    shareability: score("shareability"),
    brand_fit: score("brand_fit"),
    clarity: score("clarity"),
    authenticity: score("authenticity"),
    educational_value: score("educational_value"),
    rebuildability: score("rebuildability"),
    explanation: coerceString(obj.explanation, "Solid episode package with room to sharpen the hook."),
    improvements: coerceStringArray(obj.improvements, ["Tighten the opening hook", "Add one more concrete example"]),
  };
}

export function normalizePaperIngestion(raw: unknown): Record<string, unknown> {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    title: coerceString(obj.title, "Untitled Paper"),
    authors: coerceStringArray(obj.authors),
    year:
      typeof obj.year === "number"
        ? obj.year
        : obj.year
          ? parseInt(String(obj.year), 10) || null
          : null,
    abstract: coerceString(obj.abstract),
    problem_statement: coerceString(obj.problem_statement ?? obj.problem),
    method: coerceString(obj.method),
    key_result: coerceString(obj.key_result ?? obj.result),
    limitations: coerceString(obj.limitations),
    core_insight: coerceString(obj.core_insight ?? obj.insight),
    possible_mini_demo: coerceString(obj.possible_mini_demo ?? obj.mini_demo),
    possible_instagram_hook: coerceString(obj.possible_instagram_hook ?? obj.hook),
    possible_student_project: coerceString(obj.possible_student_project ?? obj.student_project),
    difficulty_level: coerceDifficultyLevel(obj.difficulty_level),
    required_data: coerceString(obj.required_data, "Toy dataset only"),
    rebuild_type: coerceRebuildType(obj.rebuild_type),
    citation_status: coerceCitationStatus(obj.citation_status),
  };
}

export function normalizeDeconstruction(raw: unknown): Record<string, unknown> {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    one_sentence_summary: coerceString(obj.one_sentence_summary ?? obj.summary),
    core_research_question: coerceString(obj.core_research_question ?? obj.research_question),
    problem: coerceString(obj.problem ?? obj.problem_statement),
    method: coerceString(obj.method),
    result: coerceString(obj.result ?? obj.key_result),
    analogy: coerceString(obj.analogy),
    why_this_matters: coerceString(obj.why_this_matters),
    common_misunderstanding: coerceString(obj.common_misunderstanding ?? obj.misunderstanding),
    student_rebuild_plan: coerceString(obj.student_rebuild_plan ?? obj.rebuild_plan),
    mini_project_idea: coerceString(obj.mini_project_idea ?? obj.project_idea),
    difficulty_level: coerceDifficultyLevel(obj.difficulty_level),
    rebuild_type: coerceRebuildType(obj.rebuild_type),
    required_data: coerceString(obj.required_data, "Toy dataset only"),
    instagram_hook: coerceString(obj.instagram_hook ?? obj.hook),
    citation_status: coerceCitationStatus(obj.citation_status),
  };
}

export function coerceDifficultyLevel(value: unknown): DifficultyLevel {
  if (typeof value !== "string") return "intermediate";
  const v = value.toLowerCase().trim();
  if (v === "beginner" || v.includes("begin") || v === "easy" || v === "low") return "beginner";
  if (v === "advanced" || v.includes("advanc") || v === "hard" || v === "high") return "advanced";
  if (v === "intermediate" || v.includes("inter") || v === "medium" || v === "moderate") {
    return "intermediate";
  }
  return "intermediate";
}

export function coerceCitationStatus(value: unknown): CitationStatus {
  if (typeof value !== "string") return "pending_verification";
  const v = value.toLowerCase().trim().replace(/\s+/g, "_");
  if (v === "verified" || v.includes("verified")) return "verified";
  if (v.includes("research_inspired") || v.includes("inspired")) return "research_inspired";
  if (v === "pending_verification" || v.includes("pending")) return "pending_verification";
  return "pending_verification";
}

export function coerceRebuildType(value: unknown): RebuildType {
  if (typeof value !== "string") return "simulation";

  const normalized = value.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (REBUILD_TYPES.includes(normalized as RebuildType)) {
    return normalized as RebuildType;
  }

  if (normalized.includes("network") || normalized.includes("graph")) return "network_graph";
  if (normalized.includes("recommend") || normalized.includes("ranking")) return "recommender";
  if (
    normalized.includes("classif") ||
    normalized.includes("predict") ||
    normalized.includes("categor")
  ) {
    return "classifier";
  }
  if (normalized.includes("game")) return "game";
  if (normalized.includes("dashboard")) return "dashboard";
  if (normalized.includes("calculat") || normalized.includes("formula")) return "calculator";
  if (normalized.includes("visual") || normalized.includes("chart")) return "visualizer";
  if (
    normalized.includes("toy") ||
    normalized.includes("scratch") ||
    normalized.includes("implement") ||
    normalized.includes("prototype")
  ) {
    return "toy_model";
  }
  if (normalized.includes("simul")) return "simulation";

  return "simulation";
}
