"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getActionsForStage } from "@/lib/prompts/viral/revision-actions";
import type { ViralStage } from "@/lib/supabase/types";

export function RevisionMenu({ episodeId, stage }: { episodeId: string; stage: ViralStage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);

  const actions = getActionsForStage(stage);

  const revise = async (actionKey: string, instruction?: string) => {
    setRunning(actionKey);
    setError(null);
    try {
      const res = await fetch(`/api/viral/${episodeId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, action: actionKey, instruction }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Revision failed");
      setOpen(false);
      setCustom("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revision failed");
    } finally {
      setRunning(null);
    }
  };

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Wand2 className="mr-1 h-3 w-3" />
        Revise
      </Button>

      {open && (
        <div className="glass-panel mt-3 space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <Button
                key={a.key}
                variant="outline"
                size="sm"
                disabled={running !== null}
                onClick={() => revise(a.key)}
              >
                {running === a.key && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {a.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Or write a custom revision instruction…"
              className="min-h-16 flex-1 text-sm"
            />
            <Button
              size="sm"
              disabled={running !== null || !custom.trim()}
              onClick={() => revise("custom", custom.trim())}
            >
              {running === "custom" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Run"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Revisions update this stage in place and are recorded in Revision History. Downstream
            stages keep their existing output — retry them from the pipeline rail if you want them
            regenerated against the new version.
          </p>
        </div>
      )}
    </div>
  );
}
