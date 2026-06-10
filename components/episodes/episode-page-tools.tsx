"use client";

import { useState } from "react";
import { GenerateEpisodeButton } from "@/components/episodes/generate-episode-button";
import { BuildWebappButton } from "@/components/episodes/build-webapp-button";
import { ScriptPreferencesPanel } from "@/components/episodes/script-preferences-panel";
import { mergeEpisodeScriptPreferences } from "@/components/episodes/script-preferences-fields";
import type { ScriptPreferences } from "@/lib/agents/script-preferences";

interface Props {
  episodeId: string;
  paperId?: string;
  title?: string;
  initialPreferences?: Partial<ScriptPreferences> | null;
  webappUrl?: string | null;
}

export function EpisodePageTools({
  episodeId,
  paperId,
  title,
  initialPreferences,
  webappUrl,
}: Props) {
  const [prefs, setPrefs] = useState(() => mergeEpisodeScriptPreferences(initialPreferences));

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <GenerateEpisodeButton
          episodeId={episodeId}
          paperId={paperId}
          title={title}
          scriptPreferences={prefs}
        />
        <BuildWebappButton episodeId={episodeId} webappUrl={webappUrl} />
      </div>
      <ScriptPreferencesPanel
        episodeId={episodeId}
        initialPreferences={initialPreferences}
        onSaved={setPrefs}
      />
    </div>
  );
}
