"use client";

import { CopyButton } from "@/components/episodes/copy-button";
import { WaitingFor } from "./panel-bits";
import type { ScriptArchitectOutput, VisualDirectorOutput } from "@/lib/prompts/viral/output-schemas";

export function CarouselPanel({
  script,
  visual,
}: {
  script?: ScriptArchitectOutput;
  visual?: VisualDirectorOutput;
}) {
  if (!script) return <WaitingFor stage="Script Architect" />;

  // Prefer Visual Director's refined designs when available
  const slides =
    visual?.carousel_design && visual.carousel_design.length > 0
      ? visual.carousel_design
      : script.carousel.slides;

  if (slides.length === 0) {
    return (
      <div className="glass-panel p-10 text-center text-sm text-muted-foreground">
        No carousel slides generated.
      </div>
    );
  }

  const allText = slides
    .map((s) => `Slide ${s.slide_number}: ${s.headline}\n${s.body}`)
    .join("\n\n");

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CopyButton text={allText} label="Copy all slides" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="glass-panel flex aspect-[9/16] w-56 shrink-0 flex-col p-4"
          >
            <span className="text-[10px] font-medium text-muted-foreground">
              {slide.slide_number} / {slides.length}
            </span>
            <h4 className="mt-2 font-display text-base font-semibold leading-snug">
              {slide.headline}
            </h4>
            <p className="mt-2 flex-1 overflow-y-auto text-xs leading-relaxed text-foreground/85">
              {slide.body}
            </p>
            {slide.visual_direction && (
              <p className="mt-2 border-t border-border pt-2 text-[10px] italic leading-relaxed text-muted-foreground">
                {slide.visual_direction}
              </p>
            )}
            <div className="mt-2">
              <CopyButton text={`${slide.headline}\n\n${slide.body}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
