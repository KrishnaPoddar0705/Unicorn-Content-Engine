"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_SLIDE_STYLE_PROMPT, DEFAULT_SLIDE_THEME } from "@/lib/slides/default-style";

export interface EpisodeSlide {
  id: string;
  slide_number: number;
  title: string;
  subtitle: string;
  body_text: string;
  theme: string;
  style_prompt: string;
  image_prompt: string;
  image_url: string | null;
  thumbnail_url: string | null;
  status: string;
  error_message: string | null;
}

export function ReelSlidesPanel({ episodeId }: { episodeId: string }) {
  const [slides, setSlides] = useState<EpisodeSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<number | "all" | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/episodes/${episodeId}/slides`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlides(data.slides || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load slides");
    } finally {
      setLoading(false);
    }
  }, [episodeId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSlide = (slideNumber: number, patch: Partial<EpisodeSlide>) => {
    setSlides((prev) =>
      prev.map((s) => (s.slide_number === slideNumber ? { ...s, ...patch } : s))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/episodes/${episodeId}/slides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlides(data.slides || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveSlides = async () => {
    const res = await fetch(`/api/episodes/${episodeId}/slides`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setSlides(data.slides || []);
  };

  const generate = async (slideNumber?: number) => {
    setGenerating(slideNumber ?? "all");
    setError("");
    try {
      await saveSlides();
      const res = await fetch(`/api/episodes/${episodeId}/slides/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slideNumber ? { slideNumber } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading slides...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">Reel Slides</h3>
          <p className="text-sm text-muted-foreground">
            Generate 9:16 editorial slides via Kling AI. Customize theme, style, and copy per slide.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={saveAll} disabled={saving || !!generating}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save all"}
          </Button>
          <Button
            size="sm"
            onClick={() => generate()}
            disabled={!!generating || slides.length === 0}
          >
            {generating === "all" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {generating === "all" ? "Generating all..." : "Generate all slides"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {slides.map((slide) => (
          <Card key={slide.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Slide {slide.slide_number}</CardTitle>
              <span className="text-xs capitalize text-muted-foreground">{slide.status}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {slide.image_url && (
                <a href={slide.image_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={slide.thumbnail_url || slide.image_url}
                    alt={slide.title}
                    className="mx-auto max-h-80 rounded-lg border object-contain"
                  />
                </a>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Title</Label>
                  <Input
                    className="mt-1"
                    value={slide.title}
                    onChange={(e) => updateSlide(slide.slide_number, { title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input
                    className="mt-1"
                    value={slide.subtitle}
                    onChange={(e) => updateSlide(slide.slide_number, { subtitle: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Left-side text</Label>
                <Textarea
                  className="mt-1 min-h-[72px]"
                  value={slide.body_text}
                  onChange={(e) => updateSlide(slide.slide_number, { body_text: e.target.value })}
                />
              </div>

              <div>
                <Label>Theme</Label>
                <Textarea
                  className="mt-1 min-h-[60px]"
                  placeholder={DEFAULT_SLIDE_THEME}
                  value={slide.theme}
                  onChange={(e) => updateSlide(slide.slide_number, { theme: e.target.value })}
                />
              </div>

              <div>
                <Label>Style prompt</Label>
                <p className="text-xs text-muted-foreground">
                  Kling allows up to 2,500 characters total per image prompt (style + theme + slide copy).
                </p>
                <Textarea
                  className="mt-1 min-h-[120px] font-mono text-xs"
                  placeholder={DEFAULT_SLIDE_STYLE_PROMPT}
                  value={slide.style_prompt}
                  onChange={(e) => updateSlide(slide.slide_number, { style_prompt: e.target.value })}
                />
              </div>

              {slide.error_message && (
                <p className="text-xs text-destructive">{slide.error_message}</p>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => generate(slide.slide_number)}
                disabled={!!generating}
              >
                {generating === slide.slide_number ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="mr-2 h-4 w-4" />
                )}
                {generating === slide.slide_number ? "Generating..." : "Generate this slide"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
