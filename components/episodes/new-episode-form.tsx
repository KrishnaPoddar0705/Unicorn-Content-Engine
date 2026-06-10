"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Props {
  episodes: { id: string; episode_number: number; title: string; paper_id: string | null }[];
  papers: { id: string; title: string }[];
  pillars: { id: string; code: string; name: string }[];
}

const STEPS = ["Deconstruction", "Scriptwriting", "Demo Spec", "Quality Critic"];

export function NewEpisodeForm({ episodes, papers, pillars }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"episode" | "paper">(episodes.length > 0 ? "episode" : "paper");
  const [episodeId, setEpisodeId] = useState("");
  const [paperId, setPaperId] = useState("");
  const [pillarId, setPillarId] = useState("");
  const [audience, setAudience] = useState("student");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    setStep(1);

    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length));
    }, 3000);

    try {
      const res = await fetch("/api/agents/generate-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId: mode === "episode" ? episodeId : undefined,
          paperId: mode === "paper" ? paperId : undefined,
          contentPillarId: pillarId || undefined,
          targetAudience: audience,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearInterval(interval);
      setStep(STEPS.length);
      router.push(`/episodes/${data.episodeId}`);
    } catch (e) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Episode Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant={mode === "episode" ? "default" : "outline"} onClick={() => setMode("episode")}>
            From Seed Episode
          </Button>
          <Button variant={mode === "paper" ? "default" : "outline"} onClick={() => setMode("paper")}>
            From Paper
          </Button>
        </div>

        {mode === "episode" ? (
          <div>
            <Label>Seed episode</Label>
            {episodes.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                No episodes found. Run <code className="rounded bg-amber-100 px-1">npm run seed</code> in your terminal first.
              </p>
            ) : (
              <Select value={episodeId} onValueChange={setEpisodeId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select episode" />
                </SelectTrigger>
                <SelectContent>
                  {episodes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      E{e.episode_number}: {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <div>
            <Label>Paper</Label>
            {papers.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                No papers in library. Run <code className="rounded bg-amber-100 px-1">npm run seed</code> or add a paper first.
              </p>
            ) : (
              <Select value={paperId} onValueChange={setPaperId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select paper" />
                </SelectTrigger>
                <SelectContent>
                  {papers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div>
          <Label>Content pillar</Label>
          <Select value={pillarId} onValueChange={setPillarId}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {pillars.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code}. {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Target audience</Label>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["student", "parent", "school", "founder"].map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Step {step}/{STEPS.length}: {STEPS[step - 1] || "Starting..."}
            </p>
            <Progress value={(step / STEPS.length) * 100} />
          </div>
        )}

        <Button
          onClick={generate}
          disabled={loading || (mode === "episode" ? !episodeId : !paperId)}
          className="w-full"
        >
          {loading ? "Running agents..." : "Run Agents"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
