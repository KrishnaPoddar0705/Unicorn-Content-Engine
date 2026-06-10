"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_SCRIPT_PREFERENCES,
  OBJECTIVE_OPTIONS,
  STORYTELLING_OPTIONS,
  TECHNICAL_DEPTH_OPTIONS,
  TONE_OPTIONS,
  type ScriptPreferences,
} from "@/lib/agents/script-preferences";

interface Props {
  value: ScriptPreferences;
  onChange: (value: ScriptPreferences) => void;
}

export function ScriptPreferencesFields({ value, onChange }: Props) {
  const set = <K extends keyof ScriptPreferences>(key: K, val: ScriptPreferences[K]) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Tone</Label>
        <Select value={value.tone} onValueChange={(v) => set("tone", v)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TONE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Objective</Label>
        <Select value={value.objective} onValueChange={(v) => set("objective", v)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OBJECTIVE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Storytelling</Label>
        <Select value={value.storytelling} onValueChange={(v) => set("storytelling", v)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STORYTELLING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Technical depth</Label>
        <Select value={value.technical_depth} onValueChange={(v) => set("technical_depth", v)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TECHNICAL_DEPTH_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Custom instructions</Label>
        <Textarea
          className="mt-2 min-h-[100px]"
          placeholder="e.g. Emphasize the Bayesian updating step. Mention Poisson goals model. Compare to Elo ratings."
          value={value.custom_instructions}
          onChange={(e) => set("custom_instructions", e.target.value)}
        />
      </div>
    </div>
  );
}

export function emptyScriptPreferences(): ScriptPreferences {
  return { ...DEFAULT_SCRIPT_PREFERENCES };
}

export function mergeEpisodeScriptPreferences(
  stored?: Partial<ScriptPreferences> | null
): ScriptPreferences {
  return { ...DEFAULT_SCRIPT_PREFERENCES, ...stored };
}
