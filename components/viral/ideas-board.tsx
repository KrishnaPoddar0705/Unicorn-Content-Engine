"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Wand2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VIRAL_DOMAINS } from "@/lib/viral/domains";
import type { ViralIdea } from "@/lib/supabase/types";

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-amber-400";
  return "text-muted-foreground";
}

export function IdeasBoard({
  initialIdeas,
  findEndpoint = "/api/viral/ideas/find",
  newBasePath = "/viral",
}: {
  initialIdeas: ViralIdea[];
  /** API route that scouts + persists new ideas for this vertical. */
  findEndpoint?: string;
  /** Base path whose `/new` form "Make reel" pre-fills (e.g. "/viral" or "/labs"). */
  newBasePath?: string;
}) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<ViralIdea[]>(initialIdeas);
  const [domain, setDomain] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findIdeas = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(findEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to find ideas");
      setIdeas((prev) => [...(json.ideas as ViralIdea[]), ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to find ideas");
    } finally {
      setLoading(false);
    }
  };

  const patchStatus = (id: string, status: ViralIdea["status"]) =>
    fetch(`/api/viral/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});

  const dismiss = (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    void patchStatus(id, "dismissed");
  };

  const makeReel = (idea: ViralIdea) => {
    void patchStatus(idea.id, "used");
    const ideaText = [idea.hook, idea.summary].filter(Boolean).join("\n\n");
    // The labs "/new" form is series-based (one `topic` field); the viral one is
    // single-episode (mode/title/idea).
    const qs =
      newBasePath === "/labs"
        ? new URLSearchParams({ topic: [idea.title, ideaText].filter(Boolean).join(" — ") })
        : new URLSearchParams({ mode: "idea", title: idea.title, idea: ideaText });
    if (idea.domain) qs.set("domain", idea.domain);
    router.push(`${newBasePath}/new?${qs.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glass-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Focus</span>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={loading}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm capitalize"
          >
            <option value="">Any field</option>
            {VIRAL_DOMAINS.map((d) => (
              <option key={d} value={d} className="capitalize">
                {d}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={findIdeas} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {loading ? "Scouting the web…" : "Find new ideas"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {ideas.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted-foreground">
          No ideas yet. Hit <span className="text-foreground">Find new ideas</span> to scout the live
          web for wild interdisciplinary research worth deconstructing.
        </div>
      ) : (
        <div className="grid gap-4">
          {ideas.map((idea) => (
            <div key={idea.id} className="glass-panel p-5 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {idea.domain && (
                      <Badge variant="secondary" className="capitalize">
                        {idea.domain}
                      </Badge>
                    )}
                    {idea.fields?.map((f) => (
                      <Badge key={f} variant="outline" className="capitalize">
                        {f}
                      </Badge>
                    ))}
                    {idea.audience && (
                      <span className="text-xs text-muted-foreground">for {idea.audience}</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold">{idea.title}</h3>
                  {idea.hook && (
                    <p className="mt-1 text-sm italic text-foreground/90">“{idea.hook}”</p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">{idea.summary}</p>
                  {idea.why_viral && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">Why it travels:</span>{" "}
                      {idea.why_viral}
                    </p>
                  )}
                  {idea.source_urls?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {idea.source_urls.slice(0, 4).map((url, i) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          source {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3">
                  <div className="text-right">
                    <span
                      className={cn(
                        "font-display text-2xl font-semibold",
                        scoreColor(idea.virality_score)
                      )}
                    >
                      {idea.virality_score}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" onClick={() => makeReel(idea)}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Make reel
                </Button>
                <Button size="sm" variant="ghost" onClick={() => dismiss(idea.id)}>
                  <X className="mr-1 h-4 w-4" />
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
