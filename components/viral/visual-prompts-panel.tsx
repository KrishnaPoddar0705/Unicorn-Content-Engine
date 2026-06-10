"use client";

import { Badge } from "@/components/ui/badge";
import { FieldBlock, WaitingFor } from "./panel-bits";
import type { VisualDirectorOutput } from "@/lib/prompts/viral/output-schemas";
import type { StyleProfile } from "@/lib/supabase/types";

export function VisualPromptsPanel({
  output,
  styleProfile,
}: {
  output?: VisualDirectorOutput;
  styleProfile?: StyleProfile | null;
}) {
  if (!output) return <WaitingFor stage="Visual Director" />;

  const profile = output.style_profile;

  return (
    <div className="space-y-3">
      <div className="glass-panel p-5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Style profile{styleProfile ? ` — from "${styleProfile.name}"` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profile.visual_keywords.map((k, i) => (
            <Badge key={i} variant="secondary">
              {k}
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.color_palette.map((c, i) => {
            const isHex = /^#[0-9a-f]{3,8}$/i.test(c.trim());
            return (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs"
              >
                {isHex && (
                  <span
                    className="h-3 w-3 rounded-full border border-white/20"
                    style={{ background: c.trim() }}
                  />
                )}
                {c}
              </span>
            );
          })}
        </div>
        {profile.texture && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/70">Texture:</span> {profile.texture}
          </p>
        )}
        {profile.typography_suggestions.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/70">Typography:</span>{" "}
            {profile.typography_suggestions.join(", ")}
          </p>
        )}
        {profile.composition_rules.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/70">Composition:</span>{" "}
            {profile.composition_rules.join("; ")}
          </p>
        )}
      </div>

      <FieldBlock label="Higgsfield prompt (video)" value={output.higgsfield_prompt} />
      <FieldBlock label="Kling prompt (image)" value={output.kling_prompt} />
      <FieldBlock label="Thumbnail prompt" value={output.thumbnail_prompt} />
    </div>
  );
}
