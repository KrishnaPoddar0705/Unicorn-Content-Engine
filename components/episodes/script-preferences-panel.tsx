"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScriptPreferencesFields,
  mergeEpisodeScriptPreferences,
} from "@/components/episodes/script-preferences-fields";
import type { ScriptPreferences } from "@/lib/agents/script-preferences";

interface Props {
  episodeId: string;
  initialPreferences?: Partial<ScriptPreferences> | null;
  onSaved?: (prefs: ScriptPreferences) => void;
}

export function ScriptPreferencesPanel({ episodeId, initialPreferences, onSaved }: Props) {
  const [prefs, setPrefs] = useState(() => mergeEpisodeScriptPreferences(initialPreferences));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/episodes/${episodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script_preferences: prefs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage("Saved — used on next Generate Full Package run.");
      onSaved?.(prefs);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Script Agent Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Control tone, objective, storytelling, and custom instructions for this episode&apos;s script
          agent. Defaults favor an educational, professor-style deep dive on the paper.
        </p>
        <ScriptPreferencesFields value={prefs} onChange={setPrefs} />
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving} variant="outline" size="sm">
            {saving ? "Saving..." : "Save script preferences"}
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
