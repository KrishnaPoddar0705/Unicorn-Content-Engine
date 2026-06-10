"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/episodes/copy-button";
import { cn } from "@/lib/utils";
import { WaitingFor } from "./panel-bits";
import { RevisionMenu } from "./revision-actions";
import type { HookLabOutput } from "@/lib/prompts/viral/output-schemas";

type SortKey = "curiosity_score" | "clarity_score" | "technical_depth_score" | "risk_of_clickbait";

function ScoreBar({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value <= 3 : value >= 7;
  const bad = invert ? value >= 7 : value <= 3;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            good ? "bg-emerald-400" : bad ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="w-4 text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

export function HooksPanel({
  episodeId,
  output,
}: {
  episodeId: string;
  output?: HookLabOutput;
}) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortKey>("curiosity_score");
  const [settingWinner, setSettingWinner] = useState<string | null>(null);

  if (!output) return <WaitingFor stage="Hook Lab" />;

  const sorted = [...output.hooks].sort((a, b) =>
    sortBy === "risk_of_clickbait" ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]
  );

  const selectWinner = async (hook: string, archetype: string) => {
    setSettingWinner(hook);
    try {
      await fetch(`/api/viral/${episodeId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "hook_lab",
          action: "custom",
          instruction: `Set the winner to exactly this hook (it is already in the list): "${hook}" with archetype "${archetype}". Keep all hooks unchanged.`,
        }),
      });
      router.refresh();
    } finally {
      setSettingWinner(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="glass-panel border-primary/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              <Crown className="h-3 w-3" /> Winner
            </p>
            <p className="mt-1 font-display text-lg font-semibold">“{output.winner}”</p>
            <Badge variant="secondary" className="mt-2">
              {output.winner_archetype}
            </Badge>
          </div>
          <div className="flex shrink-0 gap-2">
            <CopyButton text={output.winner} />
            <RevisionMenu episodeId={episodeId} stage="hook_lab" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Sort by</span>
        {(
          [
            ["curiosity_score", "Curiosity"],
            ["clarity_score", "Clarity"],
            ["technical_depth_score", "Depth"],
            ["risk_of_clickbait", "Lowest clickbait"],
          ] as [SortKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 transition-colors",
              sortBy === key ? "border-primary text-foreground" : "border-border hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto">{output.hooks.length} hooks</span>
      </div>

      <div className="space-y-2">
        {sorted.map((h, i) => {
          const isWinner = h.hook === output.winner;
          return (
            <div
              key={i}
              className={cn("glass-panel p-4", isWinner && "border-primary/40")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed">
                    {isWinner && <Crown className="mr-1 inline h-3 w-3 text-primary" />}
                    {h.hook}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Badge variant="outline" className="text-[10px]">
                      {h.archetype}
                    </Badge>
                    {h.recommended && (
                      <Badge variant="success" className="text-[10px]">
                        recommended
                      </Badge>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      curiosity <ScoreBar value={h.curiosity_score} />
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      clarity <ScoreBar value={h.clarity_score} />
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      depth <ScoreBar value={h.technical_depth_score} />
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      clickbait <ScoreBar value={h.risk_of_clickbait} invert />
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <CopyButton text={h.hook} />
                  {!isWinner && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={settingWinner !== null}
                      onClick={() => selectWinner(h.hook, h.archetype)}
                    >
                      {settingWinner === h.hook ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Use this"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
