"use client";

import { CopyButton } from "@/components/episodes/copy-button";
import { WaitingFor } from "./panel-bits";
import { RevisionMenu } from "./revision-actions";
import type { VisualDirectorOutput } from "@/lib/prompts/viral/output-schemas";

export function StoryboardTimeline({
  episodeId,
  output,
}: {
  episodeId: string;
  output?: VisualDirectorOutput;
}) {
  if (!output) return <WaitingFor stage="Visual Director" />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RevisionMenu episodeId={episodeId} stage="visual_director" />
      </div>
      <div className="relative space-y-0 pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-primary via-accent to-transparent" />
        {output.reel_storyboard.map((beat, i) => (
          <div key={i} className="relative pb-4">
            <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
            <div className="glass-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-accent">{beat.timestamp}</p>
                  <p className="mt-1.5 text-sm leading-relaxed">{beat.visual}</p>
                  {beat.on_screen_text && (
                    <p className="mt-2 inline-block rounded-md bg-primary/15 px-2 py-1 text-sm font-semibold">
                      {beat.on_screen_text}
                    </p>
                  )}
                  {beat.motion && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70">Motion:</span> {beat.motion}
                    </p>
                  )}
                  {beat.asset_prompt && (
                    <div className="mt-2 rounded-lg bg-muted p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                          {beat.asset_prompt}
                        </p>
                        <CopyButton text={beat.asset_prompt} label="Copy prompt" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
