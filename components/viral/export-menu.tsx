"use client";

import { useState } from "react";
import { Check, Clipboard, FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collectVisualPrompts, viralEpisodeToMarkdown } from "@/lib/viral/export-markdown";
import type { ViralStageOutputs } from "@/lib/prompts/viral/output-schemas";
import type { ViralEpisode } from "@/lib/supabase/types";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function ExportMenu({
  episode,
  outputs,
}: {
  episode: ViralEpisode;
  outputs: ViralStageOutputs;
}) {
  const [copiedPrompts, setCopiedPrompts] = useState(false);
  const slug = slugify(episode.title) || "viral-episode";

  const exportMarkdown = () =>
    download(`${slug}.md`, viralEpisodeToMarkdown(episode, outputs), "text/markdown");

  const exportJson = () =>
    download(
      `${slug}.json`,
      JSON.stringify({ episode, outputs }, null, 2),
      "application/json"
    );

  const copyPrompts = async () => {
    const prompts = collectVisualPrompts(outputs);
    if (!prompts) return;
    await navigator.clipboard.writeText(prompts);
    setCopiedPrompts(true);
    setTimeout(() => setCopiedPrompts(false), 2000);
  };

  return (
    <div className="flex shrink-0 gap-2">
      <Button variant="outline" size="sm" onClick={exportMarkdown}>
        <FileText className="mr-1 h-3 w-3" />
        Markdown
      </Button>
      <Button variant="outline" size="sm" onClick={exportJson}>
        <FileJson className="mr-1 h-3 w-3" />
        JSON
      </Button>
      {outputs.visual_director && (
        <Button variant="outline" size="sm" onClick={copyPrompts}>
          {copiedPrompts ? (
            <Check className="mr-1 h-3 w-3" />
          ) : (
            <Clipboard className="mr-1 h-3 w-3" />
          )}
          {copiedPrompts ? "Copied" : "All prompts"}
        </Button>
      )}
    </div>
  );
}
