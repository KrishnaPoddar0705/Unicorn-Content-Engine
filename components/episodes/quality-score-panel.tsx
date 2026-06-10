import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { QualityScore } from "@/lib/supabase/types";

export function QualityScorePanel({ scores }: { scores: QualityScore[] }) {
  const latest = scores[scores.length - 1];
  if (!latest) return <p className="text-sm text-muted-foreground">No quality scores yet. Run Generate Full Package.</p>;

  const dimensions = [
    { label: "Hook Strength", value: latest.hook_strength },
    { label: "Surprise Factor", value: latest.surprise_factor },
    { label: "Student Relevance", value: latest.student_relevance },
    { label: "Parent Relevance", value: latest.parent_relevance },
    { label: "Demo Feasibility", value: latest.demo_feasibility },
    { label: "Shareability", value: latest.shareability },
    { label: "Brand Fit", value: latest.brand_fit },
    { label: "Clarity", value: latest.clarity },
    { label: "Authenticity", value: latest.authenticity },
    { label: "Educational Value", value: latest.educational_value },
    { label: "Rebuildability", value: latest.rebuildability },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-indigo-50 to-violet-50">
        <CardHeader>
          <CardTitle>Overall Viral Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold text-primary">{latest.overall_viral_score}/10</p>
          <p className="mt-2 text-sm text-muted-foreground">{latest.explanation}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {dimensions.map((d) => (
          <div key={d.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{d.label}</span>
              <span className="font-medium">{d.value}/10</span>
            </div>
            <Progress value={d.value * 10} />
          </div>
        ))}
      </div>

      {latest.improvements?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {(latest.improvements as string[]).map((imp, i) => (
                <li key={i}>{imp}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
