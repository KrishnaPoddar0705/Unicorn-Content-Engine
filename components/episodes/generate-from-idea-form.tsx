"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ScriptPreferencesFields,
  emptyScriptPreferences,
} from "@/components/episodes/script-preferences-fields";

interface Pillar {
  id: string;
  code: string;
  name: string;
}

export function GenerateFromIdeaForm({ pillars }: { pillars: Pillar[] }) {
  const router = useRouter();
  const [contentIdea, setContentIdea] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [targetAudience, setTargetAudience] = useState("student");
  const [contentPillarId, setContentPillarId] = useState("none");
  const [scriptPrefs, setScriptPrefs] = useState(emptyScriptPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const generate = async () => {
    if (!contentIdea.trim()) {
      setError("Describe your content idea first.");
      return;
    }
    setLoading(true);
    setError("");
    setStatus("Researching papers for your idea...");
    try {
      const res = await fetch("/api/agents/generate-from-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentIdea,
          episodeTitle: episodeTitle || undefined,
          targetAudience,
          contentPillarId: contentPillarId === "none" ? undefined : contentPillarId,
          scriptPreferences: scriptPrefs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(`Created episode from: ${data.selectedPaperTitle}`);
      router.push(`/episodes/${data.episodeId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5" />
          Build from Content Idea
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Describe your content idea. Agents will research matching papers, pick the best fit, then
          run the full script and demo pipeline.
        </p>
        <div>
          <Label>Content idea</Label>
          <Textarea
            className="mt-2 min-h-[120px]"
            placeholder="e.g. A Bayesian model that predicts football matches better than pundits — students could rebuild it in Python for World Cup season"
            value={contentIdea}
            onChange={(e) => setContentIdea(e.target.value)}
          />
        </div>
        <div>
          <Label>Episode title (optional)</Label>
          <Input
            className="mt-2"
            placeholder="Auto-generated from research if empty"
            value={episodeTitle}
            onChange={(e) => setEpisodeTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Target audience</Label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="founder">Founder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Content pillar</Label>
            <Select value={contentPillarId} onValueChange={setContentPillarId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Any pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any pillar</SelectItem>
                {pillars.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code}: {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Script agent style</Label>
          <ScriptPreferencesFields value={scriptPrefs} onChange={setScriptPrefs} />
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? "Researching & generating..." : "Research Papers & Build Episode"}
        </Button>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
