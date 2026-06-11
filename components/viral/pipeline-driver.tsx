"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleDashed, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViralStage } from "@/lib/supabase/types";

const STAGE_LABELS: Record<string, string> = {
  curiosity_miner: "Curiosity Miner",
  expert_research: "Expert Research",
  hook_lab: "Hook Lab",
  script_architect: "Script Architect",
  project_bridge: "Project Bridge",
  visual_director: "Visual Director",
  engagement_engineer: "Engagement Engineer",
  virality_critic: "Virality Critic",
  interactive_webpage: "Interactive Webpage",
};

export interface StageState {
  stage: ViralStage;
  status: "pending" | "running" | "success" | "failed";
  error?: string | null;
}

export function PipelineDriver({
  episodeId,
  initialStages,
  initialStatus,
}: {
  episodeId: string;
  initialStages: StageState[];
  initialStatus: string;
}) {
  const router = useRouter();
  const [stages, setStages] = useState<StageState[]>(initialStages);
  const [episodeStatus, setEpisodeStatus] = useState(initialStatus);
  const [driving, setDriving] = useState(false);
  const mounted = useRef(true);
  const drivingRef = useRef(false);

  const applyStatus = useCallback(
    (json: { status: string; stages: StageState[]; ran_stages?: string[] }) => {
      if (!mounted.current) return;
      setStages(json.stages);
      setEpisodeStatus(json.status);
      if (json.ran_stages && json.ran_stages.length > 0) {
        router.refresh();
      }
    },
    [router]
  );

  const drive = useCallback(async () => {
    if (drivingRef.current) return;
    drivingRef.current = true;
    setDriving(true);

    // Light status poll while advance calls are in flight, for mid-stage UI.
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/viral/${episodeId}/status`);
        if (res.ok) {
          const json = await res.json();
          if (mounted.current) {
            setStages(json.stages);
            setEpisodeStatus(json.status);
          }
        }
      } catch {
        /* polling is best-effort */
      }
    }, 2500);

    try {
      let idleRounds = 0;
      while (mounted.current) {
        const res = await fetch(`/api/viral/${episodeId}/advance`, { method: "POST" });
        if (!res.ok) break;
        const json = await res.json();
        applyStatus(json);
        if (json.status === "complete" || json.status === "failed") break;
        if (!json.ran_stages || json.ran_stages.length === 0) {
          // Nothing runnable right now (another tab driving, or blocked) — back off.
          idleRounds += 1;
          if (idleRounds > 40) break;
          await new Promise((r) => setTimeout(r, 3000));
        } else {
          idleRounds = 0;
        }
      }
    } finally {
      clearInterval(poll);
      drivingRef.current = false;
      if (mounted.current) {
        setDriving(false);
        router.refresh();
      }
    }
  }, [episodeId, applyStatus, router]);

  useEffect(() => {
    mounted.current = true;
    const hasWork = initialStages.some((s) => s.status === "pending" || s.status === "running");
    if (hasWork && initialStatus !== "failed") {
      drive();
    }
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = async (stage: ViralStage) => {
    setStages((prev) =>
      prev.map((s) => (s.stage === stage ? { ...s, status: "pending", error: null } : s))
    );
    await fetch(`/api/viral/${episodeId}/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    drive();
  };

  const done = stages.filter((s) => s.status === "success").length;
  const allDone = done === stages.length && stages.length > 0;

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold">Pipeline</h2>
          {driving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        <span
          className={cn(
            "text-sm",
            allDone ? "text-emerald-400" : episodeStatus === "failed" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {allDone ? "Complete" : `${done}/${stages.length} stages`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stages.map((s) => (
          <div
            key={s.stage}
            className={cn(
              "rounded-xl border p-3 transition-colors",
              s.status === "success" && "border-emerald-500/40 bg-emerald-500/5",
              s.status === "running" && "border-primary/60 bg-primary/10",
              s.status === "failed" && "border-destructive/60 bg-destructive/10",
              s.status === "pending" && "border-border"
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium">{STAGE_LABELS[s.stage] ?? s.stage}</span>
              {s.status === "success" && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
              {s.status === "running" && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
              )}
              {s.status === "failed" && <X className="h-3.5 w-3.5 shrink-0 text-destructive" />}
              {s.status === "pending" && (
                <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
            </div>
            {s.status === "failed" && (
              <div className="mt-2 space-y-1">
                {s.error && (
                  <p className="line-clamp-2 text-[10px] text-destructive" title={s.error}>
                    {s.error}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-full text-[10px]"
                  onClick={() => retry(s.stage)}
                >
                  <RotateCcw className="mr-1 h-2.5 w-2.5" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
