import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemos } from "@/lib/db/queries";
import { DEMO_REGISTRY } from "@/lib/demos/registry";

export default async function DemosPage() {
  const dbDemos = await getDemos();
  const builtDemos = Object.values(DEMO_REGISTRY);

  return (
    <div className="p-8">
      <PageHeader
        title="Demo Library"
        description="Interactive rebuilds that bring research papers to life for students."
      />

      <h2 className="mb-4 text-lg font-semibold">Built Demos</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {builtDemos.map((demo) => (
          <Link key={demo.slug} href={`/demos/${demo.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{demo.title}</CardTitle>
                  <Badge variant="success">live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{demo.educationalNotes}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {dbDemos.length > 0 && (
        <>
          <h2 className="mb-4 text-lg font-semibold">Generated Demo Specs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dbDemos
              .filter((d) => !DEMO_REGISTRY[d.slug])
              .map((demo) => (
                <Card key={demo.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{demo.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{demo.description}</p>
                    <Badge variant="outline" className="mt-2">
                      {demo.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
