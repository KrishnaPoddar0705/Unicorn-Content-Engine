"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EpisodeScore } from "@/lib/supabase/types";

const METRICS = ["views", "likes", "comments", "shares", "saves"] as const;

export function PerformanceForm({
  episodeId,
  score,
}: {
  episodeId: string;
  score: EpisodeScore | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({
    views: score?.views?.toString() ?? "",
    likes: score?.likes?.toString() ?? "",
    comments: score?.comments?.toString() ?? "",
    shares: score?.shares?.toString() ?? "",
    saves: score?.saves?.toString() ?? "",
    krishna_rating: score?.krishna_rating?.toString() ?? "",
    performance_notes: score?.performance_notes ?? "",
    posted_url: score?.posted_url ?? "",
    posted_at: score?.posted_at ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setSaved(false);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/viral/${episodeId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel max-w-2xl space-y-4 p-6">
      <div>
        <h3 className="font-display text-lg font-semibold">Real-world performance</h3>
        <p className="text-sm text-muted-foreground">
          These numbers feed Krishna&apos;s content memory — future episodes learn from what
          actually performed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {METRICS.map((m) => (
          <div key={m}>
            <Label htmlFor={m} className="text-xs capitalize text-muted-foreground">
              {m}
            </Label>
            <Input
              id={m}
              type="number"
              min={0}
              value={values[m]}
              onChange={set(m)}
              className="mt-1"
            />
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="rating" className="text-xs text-muted-foreground">
            Krishna&apos;s rating (1-10)
          </Label>
          <Input
            id="rating"
            type="number"
            min={1}
            max={10}
            value={values.krishna_rating}
            onChange={set("krishna_rating")}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="posted_at" className="text-xs text-muted-foreground">
            Posted on
          </Label>
          <Input
            id="posted_at"
            type="date"
            value={values.posted_at}
            onChange={set("posted_at")}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="posted_url" className="text-xs text-muted-foreground">
            Post URL
          </Label>
          <Input
            id="posted_url"
            value={values.posted_url}
            onChange={set("posted_url")}
            placeholder="https://…"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="text-xs text-muted-foreground">
          Notes (what worked, what didn&apos;t, comments worth reading)
        </Label>
        <Textarea
          id="notes"
          value={values.performance_notes}
          onChange={set("performance_notes")}
          className="mt-1 min-h-20"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {saved ? "Saved" : "Save performance"}
      </Button>
    </div>
  );
}
