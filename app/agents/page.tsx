import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { getAgentRuns } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

export default async function AgentsPage() {
  const runs = await getAgentRuns();

  return (
    <div className="p-8">
      <PageHeader
        title="Agent Runs"
        description="History of LLM agent executions — inputs, outputs, tokens, and duration."
      />

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left font-medium">Time</th>
              <th className="p-3 text-left font-medium">Agent</th>
              <th className="p-3 text-left font-medium">Model</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Duration</th>
              <th className="p-3 text-left font-medium">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No agent runs yet. Generate an episode to see activity.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{formatDate(run.created_at)}</td>
                  <td className="p-3 font-mono text-xs">{run.agent_name}</td>
                  <td className="p-3 text-xs">{run.model}</td>
                  <td className="p-3">
                    <Badge variant={run.status === "success" ? "success" : run.status === "failed" ? "destructive" : "warning"}>
                      {run.status}
                    </Badge>
                  </td>
                  <td className="p-3">{run.duration_ms ? `${run.duration_ms}ms` : "—"}</td>
                  <td className="p-3">
                    {(run.token_usage as { total_tokens?: number })?.total_tokens ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
