"use client";

import { FieldBlock, ListBlock, WaitingFor } from "./panel-bits";
import { RevisionMenu } from "./revision-actions";
import type { EngagementEngineerOutput } from "@/lib/prompts/viral/output-schemas";

export function CaptionsPanel({
  episodeId,
  output,
}: {
  episodeId: string;
  output?: EngagementEngineerOutput;
}) {
  if (!output) return <WaitingFor stage="Engagement Engineer" />;
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RevisionMenu episodeId={episodeId} stage="engagement_engineer" />
      </div>
      <FieldBlock label="Caption" value={output.caption} />
      <ListBlock label="Caption variants" items={output.caption_variants} />
      <FieldBlock label="Pinned comment" value={output.pinned_comment} />
      <ListBlock label="Post titles" items={output.post_titles} />
      <div className="grid gap-3 lg:grid-cols-2">
        <FieldBlock label="Save trigger" value={output.save_trigger} />
        <FieldBlock label="Share trigger" value={output.share_trigger} />
      </div>
      <ListBlock label="Comment bait questions" items={output.comment_bait_questions} />
      <ListBlock label="CTA variants" items={output.cta_variants} />
      <ListBlock label="Controversy levers (defensible)" items={output.controversy_levers} />
      <ListBlock label="Safe claims boundary — do NOT cross" items={output.safe_claims_boundary} />
    </div>
  );
}
