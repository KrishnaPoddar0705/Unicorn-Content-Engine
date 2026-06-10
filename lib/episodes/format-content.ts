import { coerceString, coerceStringArray } from "@/lib/agents/coerce";

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function unwrapText(value: unknown, keys = ["text", "main", "content", "body", "script"]): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const parsed = tryParseJson(trimmed);
      if (parsed) return unwrapText(parsed, keys);
    }
    return value.replace(/\\n/g, "\n");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of keys) {
      if (obj[key]) return unwrapText(obj[key], keys);
    }
  }
  return coerceString(value);
}

export function formatHookOption(hook: unknown): string {
  return unwrapText(hook, ["text", "hook", "content"]);
}

export function formatCaption(caption: unknown): string {
  return unwrapText(caption, ["main", "text", "caption", "content"]);
}

export function formatCta(cta: unknown): string {
  if (cta && typeof cta === "object") {
    const c = cta as Record<string, unknown>;
    const prompt = unwrapText(c.prompt ?? c.text ?? c.cta, ["text"]);
    const keyword = coerceString(c.keyword);
    if (keyword && prompt) {
      if (prompt.toLowerCase().includes(keyword.toLowerCase())) return prompt;
      return `Comment ${keyword.toUpperCase()} — ${prompt}`;
    }
    return prompt || coerceString(cta);
  }
  if (typeof cta === "string") {
    const parsed = tryParseJson(cta);
    if (parsed) return formatCta(parsed);
    return cta;
  }
  return coerceString(cta);
}

export function formatScriptBody(script: unknown): string {
  return unwrapText(script, ["text", "script", "content", "main"]);
}

export function formatCarouselSlide(slide: unknown): { title: string; body: string } {
  if (typeof slide === "string") {
    const parsed = tryParseJson(slide);
    if (parsed) return formatCarouselSlide(parsed);
    return { title: "Slide", body: slide };
  }
  if (slide && typeof slide === "object") {
    const s = slide as Record<string, unknown>;
    return {
      title: coerceString(s.title ?? s.headline ?? s.slide_title ?? `Slide ${s.slide_number ?? ""}`),
      body: unwrapText(s.body ?? s.content ?? s.text ?? s.bullets, ["text", "main"]),
    };
  }
  return { title: "Slide", body: "" };
}

export function formatHookOptions(hooks: unknown): string[] {
  if (!Array.isArray(hooks)) return [];
  return hooks.map(formatHookOption).filter(Boolean);
}

export function formatHashtags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.flatMap((t) => {
      const s = coerceString(t);
      return s.startsWith("#") ? [s] : s.split(/\s+/).filter(Boolean);
    });
  }
  if (typeof tags === "string") return tags.split(/\s+/).filter(Boolean);
  return [];
}

function buildScriptsFromContent(hook: string, caption: string): Record<"45s" | "60s" | "90s", string> {
  if (!hook && !caption) return { "45s": "", "60s": "", "90s": "" };
  const paragraphs = caption.split(/\n\n+/).filter(Boolean);
  const close = "We turn research papers into projects students can actually build.";
  return {
    "45s": [hook, ...paragraphs.slice(0, 2), close].filter(Boolean).join("\n\n"),
    "60s": [hook, ...paragraphs.slice(0, 4), close].filter(Boolean).join("\n\n"),
    "90s": [hook, caption, close].filter(Boolean).join("\n\n"),
  };
}

export function formatScripts(script: {
  script_45s?: unknown;
  script_60s?: unknown;
  script_90s?: unknown;
  hook_3s?: unknown;
  hook_options?: unknown;
  caption?: unknown;
  positioning_line?: unknown;
} | null | undefined): Record<"45s" | "60s" | "90s", string> {
  if (!script) return { "45s": "", "60s": "", "90s": "" };

  const formatted = {
    "45s": formatScriptBody(script.script_45s),
    "60s": formatScriptBody(script.script_60s),
    "90s": formatScriptBody(script.script_90s),
  };

  if (formatted["45s"] || formatted["60s"] || formatted["90s"]) return formatted;

  const hook =
    formatHookOptions(script.hook_options)[0] || formatScriptBody(script.hook_3s);
  const caption = formatCaption(script.caption);
  return buildScriptsFromContent(hook, caption);
}

export function formatCarouselSlides(
  slides: unknown,
  titleVariants?: unknown,
  hook?: string,
  caption?: string
): { title: string; body: string }[] {
  const parsed = Array.isArray(slides) ? slides.map(formatCarouselSlide) : [];
  if (parsed.some((s) => s.body.trim())) return parsed;

  const variants = Array.isArray(titleVariants)
    ? titleVariants.map((v) => coerceString(v)).filter(Boolean)
    : [];
  if (variants.length >= 3) {
    return variants.slice(0, 5).map((body, i) => ({
      title: i === 0 ? "The hook" : `Slide ${i + 1}`,
      body,
    }));
  }

  const paragraphs = (caption || "").split(/\n\n+/).filter(Boolean);
  if (paragraphs.length >= 2) {
    return paragraphs.slice(0, 5).map((body, i) => ({
      title: i === 0 ? "The insight" : `Slide ${i + 1}`,
      body,
    }));
  }

  if (hook) return [{ title: "The insight", body: hook }];
  return parsed.length > 0 ? parsed : [];
}
