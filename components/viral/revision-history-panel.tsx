"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EpisodeRevision } from "@/lib/supabase/types";

export function RevisionHistoryPanel({ revisions }: { revisions: EpisodeRevision[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (revisions.length === 0) {
    return (
      <div className="glass-panel p-10 text-center text-sm text-muted-foreground">
        No revisions yet. Use the Revise button on any output to start iterating.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {revisions.map((rev) => {
        const open = openId === rev.id;
        return (
          <div key={rev.id} className="glass-panel p-4">
            <button
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setOpenId(open ? null : rev.id)}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {open ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <Badge variant="outline">{rev.stage.replace(/_/g, " ")}</Badge>
                <span className="text-sm">{rev.action.replace(/_/g, " ")}</span>
                {rev.instruction && rev.action === "custom" && (
                  <span className="truncate text-xs text-muted-foreground">
                    “{rev.instruction}”
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(rev.created_at).toLocaleString()}
              </span>
            </button>
            {open && (
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-destructive">
                    Before
                  </p>
                  <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 font-mono text-[11px] leading-relaxed">
                    {JSON.stringify(rev.previous_output, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                    After
                  </p>
                  <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 font-mono text-[11px] leading-relaxed">
                    {JSON.stringify(rev.new_output, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
