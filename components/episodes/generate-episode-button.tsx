"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScriptPreferences } from "@/lib/agents/script-preferences";

interface Props {
  episodeId?: string;
  paperId?: string;
  title?: string;
  scriptPreferences?: Partial<ScriptPreferences>;
}

export function GenerateEpisodeButton({ episodeId, paperId, title, scriptPreferences }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agents/generate-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId, paperId, episodeTitle: title, scriptPreferences }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/episodes/${data.episodeId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={generate} disabled={loading}>
        <Sparkles className="mr-2 h-4 w-4" />
        {loading ? "Generating..." : "Generate Full Package"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
