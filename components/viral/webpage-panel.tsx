"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/episodes/copy-button";
import { WaitingFor } from "./panel-bits";
import type { WebpageStageOutput } from "@/lib/prompts/viral/output-schemas";

export function WebpagePanel({ output }: { output?: WebpageStageOutput }) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!output) return <WaitingFor stage="Interactive Webpage" />;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${output.share_path}`
      : output.share_path;

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="glass-panel border-primary/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
              Viewer-facing research page
            </p>
            <p className="mt-1 font-display text-xl font-semibold">{output.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{output.theme}</Badge>
              <Badge variant="outline">{Math.round(output.html_length / 1024)} KB</Badge>
            </div>
            {output.blog_path && (
              <p className="mt-2 text-xs text-muted-foreground">
                Public blog URL:{" "}
                <a
                  href={output.blog_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  theunicornlabs.com{output.blog_path}
                </a>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyUrl}>
              {copiedUrl ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              {copiedUrl ? "Copied" : "Copy link"}
            </Button>
            <a href={output.share_path} target="_blank" rel="noopener noreferrer">
              <Button size="sm">
                <ExternalLink className="mr-1 h-3 w-3" />
                Open
              </Button>
            </a>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3">
          <MessageCircle className="h-5 w-5 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              Viewers comment this keyword on the post to receive the page:
            </p>
            <p className="font-mono text-lg font-bold tracking-widest text-accent">
              {output.comment_keyword}
            </p>
          </div>
          <div className="ml-auto">
            <CopyButton text={output.comment_keyword} />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          To regenerate the page (e.g. after revising research or scripts), retry the Interactive
          Webpage stage from the pipeline rail above.
        </p>
      </div>

      <div className="glass-panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs text-muted-foreground">Preview — {output.share_path}</span>
          <span className="text-[10px] text-muted-foreground">9:16 viewers see the mobile layout</span>
        </div>
        <iframe
          src={output.share_path}
          title={output.title}
          className="h-[70vh] w-full bg-[#0a0812]"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
