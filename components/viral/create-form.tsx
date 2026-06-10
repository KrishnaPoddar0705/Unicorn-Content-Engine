"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ReferenceImageUploader } from "./reference-image-uploader";
import type {
  ContentSeriesTemplate,
  ReferenceImage,
  StyleProfile,
  ViralInputMode,
  VisualStyleMode,
} from "@/lib/supabase/types";

const INPUT_MODES: { value: ViralInputMode; label: string; hint: string }[] = [
  { value: "paper", label: "Paper", hint: "Paste a research paper" },
  { value: "idea", label: "Idea", hint: "A rough idea to develop" },
  { value: "topic", label: "Topic", hint: "Pick a domain to mine" },
  { value: "trend", label: "Trend", hint: "Connect news to research" },
  { value: "reference_visual", label: "Visual", hint: "Style-first episode" },
];

const DOMAINS = [
  "economics",
  "philosophy",
  "ai",
  "logic",
  "mathematics",
  "science",
  "business",
  "space",
  "markets",
];

const SELECTS: {
  key: "target_audience" | "depth" | "output_format" | "tone" | "cta_goal" | "platform";
  label: string;
  options: [string, string][];
}[] = [
  {
    key: "target_audience",
    label: "Target audience",
    options: [
      ["general_curious_adult", "General curious adult"],
      ["middle_school", "Middle school"],
      ["high_school", "High school"],
      ["college", "College"],
    ],
  },
  {
    key: "depth",
    label: "Depth",
    options: [
      ["light", "Light"],
      ["medium", "Medium"],
      ["technical", "Technical"],
      ["extremely_technical", "Extremely technical but understandable"],
    ],
  },
  {
    key: "output_format",
    label: "Output format",
    options: [
      ["all", "All formats"],
      ["reel", "Reel"],
      ["carousel", "Carousel"],
      ["deep_dive", "Deep dive"],
    ],
  },
  {
    key: "tone",
    label: "Tone",
    options: [
      ["founder_led", "Founder-led"],
      ["mysterious", "Mysterious"],
      ["cinematic", "Cinematic"],
      ["technical", "Technical"],
      ["provocative", "Provocative"],
      ["calm_professor", "Calm professor"],
    ],
  },
  {
    key: "cta_goal",
    label: "CTA goal",
    options: [
      ["follow", "Follow"],
      ["comment", "Comment"],
      ["save", "Save"],
      ["share", "Share"],
      ["join_unicorn_labs", "Join Unicorn Labs"],
      ["visit_demo", "Visit demo"],
    ],
  },
  {
    key: "platform",
    label: "Platform",
    options: [
      ["instagram_reels", "Instagram Reels"],
      ["tiktok", "TikTok"],
      ["youtube_shorts", "YouTube Shorts"],
      ["linkedin", "LinkedIn"],
    ],
  },
];

export function CreateViralForm({
  templates,
  styleProfiles: initialProfiles,
  referenceImages: initialImages,
}: {
  templates: ContentSeriesTemplate[];
  styleProfiles: StyleProfile[];
  referenceImages: ReferenceImage[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ViralInputMode>("idea");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [paperText, setPaperText] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({
    target_audience: "general_curious_adult",
    depth: "medium",
    output_format: "all",
    tone: "founder_led",
    cta_goal: "save",
    platform: "instagram_reels",
  });
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [styleMode, setStyleMode] = useState<VisualStyleMode>("default");
  const [pastedStyle, setPastedStyle] = useState("");
  const [images, setImages] = useState(initialImages);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Give the episode a working title.");
      return;
    }
    if (mode === "paper" && !paperText.trim()) {
      setError("Paste the paper text for paper mode.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/viral/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          input_mode: mode,
          domain,
          raw_input: rawInput.trim() || null,
          paper_text: mode === "paper" ? paperText : null,
          ...fields,
          series_template_id: seriesId,
          visual_style_mode: styleMode,
          pasted_style_prompt: styleMode === "pasted_prompt" ? pastedStyle.trim() || null : null,
          style_profile_id: styleMode === "reference_image" ? selectedProfileId : null,
          reference_image_id: styleMode === "reference_image" ? selectedImageId : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create episode");
      router.push(`/viral/${json.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create episode");
      setSubmitting(false);
    }
  };

  const filteredTemplates = domain
    ? [...templates].sort((a, b) => {
        const aMatch = a.ideal_domains.includes(domain) ? 0 : 1;
        const bMatch = b.ideal_domains.includes(domain) ? 0 : 1;
        return aMatch - bMatch || a.sort_order - b.sort_order;
      })
    : templates;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Input mode */}
      <div className="glass-panel p-6">
        <Label className="text-base">Input mode</Label>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {INPUT_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                mode === m.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              )}
            >
              <p className="font-medium">{m.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{m.hint}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="title">Working title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The auction that runs every time you open Instagram"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Domain</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDomain(domain === d ? null : d)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
                    domain === d
                      ? "border-primary bg-primary/15 text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {mode === "paper" ? (
            <div>
              <Label htmlFor="paper">Paper text</Label>
              <Textarea
                id="paper"
                value={paperText}
                onChange={(e) => setPaperText(e.target.value)}
                placeholder="Paste the full paper text or the abstract + key sections…"
                className="mt-1.5 min-h-48 font-mono text-xs"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="raw">
                {mode === "idea" && "Your rough idea"}
                {mode === "topic" && "Specific angle (optional)"}
                {mode === "trend" && "Trending topic / news item"}
                {mode === "reference_visual" && "Concept for the visual-first episode"}
              </Label>
              <Textarea
                id="raw"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={
                  mode === "idea"
                    ? "e.g. Indian capital markets structure — why do retail orders get the prices they get?"
                    : mode === "trend"
                      ? "Paste the headline or describe the trending story…"
                      : "Describe the angle…"
                }
                className="mt-1.5 min-h-24"
              />
            </div>
          )}
        </div>
      </div>

      {/* Parameters */}
      <div className="glass-panel p-6">
        <Label className="text-base">Parameters</Label>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SELECTS.map((s) => (
            <div key={s.key}>
              <Label htmlFor={s.key} className="text-xs text-muted-foreground">
                {s.label}
              </Label>
              <select
                id={s.key}
                value={fields[s.key]}
                onChange={(e) => setFields((f) => ({ ...f, [s.key]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {s.options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Series template */}
      <div className="glass-panel p-6">
        <Label className="text-base">Series format (optional)</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Lock the episode into a reusable series structure.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {filteredTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSeriesId(seriesId === t.id ? null : t.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                seriesId === t.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              )}
            >
              <p className="font-medium">{t.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
              {domain && t.ideal_domains.includes(domain) && (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-accent">
                  fits {domain}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Visual style */}
      <div className="glass-panel p-6">
        <Label className="text-base">Visual style</Label>
        <div className="mt-3 flex gap-2">
          {(
            [
              ["default", "Unicorn Labs default"],
              ["reference_image", "Reference image"],
              ["pasted_prompt", "Paste a style prompt"],
            ] as [VisualStyleMode, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStyleMode(value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                styleMode === value
                  ? "border-primary bg-primary/15"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {styleMode === "reference_image" && (
          <div className="mt-4">
            <ReferenceImageUploader
              images={images}
              styleProfiles={profiles}
              selectedImageId={selectedImageId}
              selectedProfileId={selectedProfileId}
              onSelectImage={setSelectedImageId}
              onSelectProfile={setSelectedProfileId}
              onImageUploaded={(img) => setImages((prev) => [img, ...prev])}
              onProfileExtracted={(p) => setProfiles((prev) => [p, ...prev])}
            />
          </div>
        )}

        {styleMode === "pasted_prompt" && (
          <Textarea
            value={pastedStyle}
            onChange={(e) => setPastedStyle(e.target.value)}
            placeholder="Paste the visual style prompt all assets should follow…"
            className="mt-4 min-h-24"
          />
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={submitting} size="lg" className="w-full">
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        {submitting ? "Creating episode…" : "Launch the 8-agent pipeline"}
      </Button>
    </div>
  );
}
