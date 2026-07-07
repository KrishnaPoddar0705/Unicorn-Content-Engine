"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { VIRAL_DOMAINS } from "@/lib/viral/domains";

const SELECTS: {
  key: "target_audience" | "depth" | "tone" | "platform";
  label: string;
  options: [string, string][];
}[] = [
  {
    key: "target_audience",
    label: "Audience emphasis",
    options: [
      ["general_curious_adult", "Curious adult (builders/founders)"],
      ["college", "College students"],
      ["high_school", "High school"],
    ],
  },
  {
    key: "depth",
    label: "Depth",
    options: [
      ["extremely_technical", "Extremely technical but clear"],
      ["technical", "Technical"],
      ["medium", "Medium"],
    ],
  },
  {
    key: "tone",
    label: "Tone",
    options: [
      ["founder_led", "Founder-led"],
      ["technical", "Technical"],
      ["calm_professor", "Calm professor"],
      ["cinematic", "Cinematic"],
    ],
  },
  {
    key: "platform",
    label: "Platform",
    options: [
      ["instagram_reels", "Instagram Reels"],
      ["youtube_shorts", "YouTube Shorts"],
      ["linkedin", "LinkedIn"],
      ["tiktok", "TikTok"],
    ],
  },
];

export function SeriesForm({
  initialTopic,
  initialDomain,
}: {
  initialTopic?: string;
  initialDomain?: string;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [domain, setDomain] = useState<string | null>(initialDomain ?? null);
  const [partsHint, setPartsHint] = useState<string>("");
  const [fields, setFields] = useState<Record<string, string>>({
    target_audience: "general_curious_adult",
    depth: "extremely_technical",
    tone: "founder_led",
    platform: "instagram_reels",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!topic.trim()) {
      setError("Give the series a topic.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/labs/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          domain,
          ...fields,
          parts_hint: partsHint ? Number(partsHint) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create series");
      router.push(`/labs/series/${json.seriesId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create series");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="glass-panel p-6">
        <Label htmlFor="topic" className="text-base">
          Series topic
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">
          A deep-tech sector or question to explain across multiple parts.
        </p>
        <Textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Wireless infrastructure from first principles — RF spectrum → Li-Fi → free space optics, and who builds the backhaul India runs on"
          className="mt-3 min-h-28"
        />

        <div className="mt-5">
          <Label>Primary domain</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {VIRAL_DOMAINS.map((d) => (
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
      </div>

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
          <div>
            <Label htmlFor="parts_hint" className="text-xs text-muted-foreground">
              Number of parts (optional)
            </Label>
            <select
              id="parts_hint"
              value={partsHint}
              onChange={(e) => setPartsHint(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="">Let the architect decide</option>
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} parts
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={submitting} size="lg" className="w-full">
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {submitting ? "Planning the series…" : "Plan the series arc"}
      </Button>
    </div>
  );
}
