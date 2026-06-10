"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CopyButton } from "@/components/episodes/copy-button";
import { ListBlock, WaitingFor } from "./panel-bits";
import { RevisionMenu } from "./revision-actions";
import type { ScriptArchitectOutput } from "@/lib/prompts/viral/output-schemas";

const DURATIONS = ["30s", "45s", "60s", "90s", "3min"] as const;

const BEATS: { key: keyof ScriptArchitectOutput["scripts"]["60s"]; label: string }[] = [
  { key: "hook", label: "Hook" },
  { key: "setup", label: "Setup" },
  { key: "mystery", label: "Mystery" },
  { key: "technical_reveal", label: "Technical Reveal" },
  { key: "concrete_example", label: "Concrete Example" },
  { key: "twist", label: "Twist" },
  { key: "payoff", label: "Payoff" },
  { key: "cta", label: "CTA" },
];

function fullScript(sections: ScriptArchitectOutput["scripts"]["60s"]): string {
  return BEATS.map((b) => sections[b.key]).filter(Boolean).join("\n\n");
}

export function ScriptsPanel({
  episodeId,
  output,
}: {
  episodeId: string;
  output?: ScriptArchitectOutput;
}) {
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>("60s");

  if (!output) return <WaitingFor stage="Script Architect" />;

  const sections = output.scripts[duration];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Tabs value={duration} onValueChange={(v) => setDuration(v as typeof duration)}>
          <TabsList>
            {DURATIONS.map((d) => (
              <TabsTrigger key={d} value={d}>
                {d}
              </TabsTrigger>
            ))}
          </TabsList>
          {DURATIONS.map((d) => (
            <TabsContent key={d} value={d} className="hidden" />
          ))}
        </Tabs>
        <div className="flex gap-2">
          <CopyButton text={fullScript(sections)} label="Copy full script" />
          <RevisionMenu episodeId={episodeId} stage="script_architect" />
        </div>
      </div>

      <div className="space-y-2">
        {BEATS.map((b) => {
          const text = sections[b.key];
          if (!text?.trim()) return null;
          return (
            <div key={b.key} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
                    {b.label}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
                </div>
                <CopyButton text={text} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ListBlock label="Talking-head notes" items={output.talking_head_notes} />
        <ListBlock label="Voiceover notes" items={output.voiceover_notes} />
      </div>
    </div>
  );
}
