"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND_LINES, TONE_RULES, TAGLINE } from "@/lib/brand/voice";
import {
  ScriptPreferencesFields,
  mergeEpisodeScriptPreferences,
} from "@/components/episodes/script-preferences-fields";
import type { ScriptPreferences } from "@/lib/agents/script-preferences";

interface Settings {
  llm_provider: string;
  openai_model: string;
  anthropic_model: string;
  content_preferences?: Record<string, unknown>;
}

export function SettingsForm({ initial }: { initial: Settings | null }) {
  const contentPrefs = (initial?.content_preferences || {}) as Record<string, unknown>;
  const initialScript = (contentPrefs.script_writing || {}) as Partial<ScriptPreferences>;

  const [provider, setProvider] = useState(initial?.llm_provider || "anthropic");
  const [openaiModel, setOpenaiModel] = useState(initial?.openai_model || "gpt-4o");
  const [anthropicModel, setAnthropicModel] = useState(initial?.anthropic_model || "claude-opus-4-8");
  const [scriptPrefs, setScriptPrefs] = useState(() => mergeEpisodeScriptPreferences(initialScript));
  const [testResult, setTestResult] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          llm_provider: provider,
          openai_model: openaiModel,
          anthropic_model: anthropicModel,
          content_preferences: {
            ...contentPrefs,
            script_writing: scriptPrefs,
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const testLLM = async () => {
    setTesting(true);
    setTestResult("");
    try {
      const res = await fetch("/api/settings/test-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setTestResult(data.success ? `✓ ${data.response}` : `✗ ${data.error}`);
    } catch (e) {
      setTestResult(`✗ ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>LLM Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            API keys are read from environment variables (.env.local). Never commit keys to the database.
          </p>
          <div>
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">Anthropic (default)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>OpenAI Model</Label>
            <Input value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label>Anthropic Model</Label>
            <Input value={anthropicModel} onChange={(e) => setAnthropicModel(e.target.value)} className="mt-2" />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            <Button variant="outline" onClick={testLLM} disabled={testing}>
              {testing ? "Testing..." : "Test Connection"}
            </Button>
          </div>
          {testResult && <p className="text-sm">{testResult}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Script Agent Style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Global defaults for the scriptwriting agent. Per-episode overrides are available on each episode
            page. Default tone is educational professor with moderate-high technical depth.
          </p>
          <ScriptPreferencesFields value={scriptPrefs} onChange={setScriptPrefs} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Brand Voice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="font-medium">{TAGLINE}</p>
          <div>
            <p className="mb-2 font-medium">Brand Lines</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {BRAND_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 font-medium">Tone Rules</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {TONE_RULES.slice(0, 6).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
