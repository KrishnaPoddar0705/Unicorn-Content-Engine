import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/episodes/copy-button";
import { QualityScorePanel } from "@/components/episodes/quality-score-panel";
import { EpisodePageTools } from "@/components/episodes/episode-page-tools";
import { ReelSlidesPanel } from "@/components/episodes/reel-slides-panel";
import { PaperCitationCard } from "@/components/episodes/paper-citation-card";
import { EpisodeSummary } from "@/components/episodes/episode-summary";
import { getEpisode, getInteractiveWebpageForEpisode } from "@/lib/db/queries";
import {
  formatCaption,
  formatCarouselSlides,
  formatCta,
  formatHashtags,
  formatHookOptions,
  formatScriptBody,
  formatScripts,
} from "@/lib/episodes/format-content";

export default async function EpisodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [episode, webapp] = await Promise.all([getEpisode(id), getInteractiveWebpageForEpisode(id)]);
  if (!episode) notFound();

  const script = episode.scripts;
  const demo = episode.demos?.[0];
  const scores = episode.quality_scores || [];
  const paper = episode.papers;

  const cta = script ? formatCta(script.cta) : "";
  const hashtags = script ? formatHashtags(script.hashtags) : [];
  const hooks = script ? formatHookOptions(script.hook_options) : [];
  const caption = script ? formatCaption(script.caption) : "";
  const slides = script
    ? formatCarouselSlides(
        script.carousel_slides,
        script.title_variants,
        hooks[0] || formatScriptBody(script.hook_3s),
        caption
      )
    : [];
  const scripts = formatScripts(script);

  return (
    <div className="p-8">
      <PageHeader
        title={`E${episode.episode_number}: ${episode.title}`}
        description={episode.viral_hook || episode.one_line_positioning || undefined}
      />

      <EpisodePageTools
        episodeId={episode.id}
        paperId={episode.paper_id || undefined}
        title={episode.title}
        initialPreferences={episode.script_preferences}
        webappUrl={webapp ? `/webapps/${webapp.slug}` : null}
      />

      {paper && <div className="mb-6"><PaperCitationCard paper={paper} /></div>}

      <div className="mb-6 flex flex-wrap gap-2">
        {episode.content_pillars && <Badge variant="secondary">{episode.content_pillars.name}</Badge>}
        <Badge variant="outline" className="capitalize">
          {episode.target_audience}
        </Badge>
        <Badge variant="outline">{episode.status}</Badge>
        <Badge variant={episode.demo_build_status === "ready" ? "success" : "warning"}>
          demo: {episode.demo_build_status}
        </Badge>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="script">Script</TabsTrigger>
          <TabsTrigger value="caption">Caption & CTA</TabsTrigger>
          <TabsTrigger value="reel-slides">Reel Slides</TabsTrigger>
          <TabsTrigger value="demo">Demo Spec</TabsTrigger>
          {webapp && <TabsTrigger value="webapp">Interactive Webpage</TabsTrigger>}
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <EpisodeSummary episode={episode} paper={paper} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Why This Is Cool</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{episode.why_cool || "—"}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parent Positioning</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{episode.parent_positioning || script?.parent_angle || "—"}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Student Project Extension</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{episode.student_project_extension || "—"}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Magnet Angle</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{episode.lead_magnet_angle || "—"}</CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="script" className="space-y-4">
          {!script ? (
            <p className="text-muted-foreground">No script yet. Click Generate Full Package.</p>
          ) : (
            <>
              {hooks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Hook Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {hooks.map((h, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 rounded-lg bg-muted p-3 text-sm">
                        <span className="leading-relaxed">{h}</span>
                        <CopyButton text={h} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {Object.entries(scripts).map(([label, body]) => (
                <Card key={label}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{label} script</CardTitle>
                    {body && <CopyButton text={body} />}
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">
                    {body || (
                      <span className="text-muted-foreground">
                        Empty — click Generate Full Package to regenerate
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
              {script.explain_curious && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Explain Like I&apos;m Curious</CardTitle>
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">
                    {formatScriptBody(script.explain_curious)}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="reel-slides">
          <ReelSlidesPanel episodeId={episode.id} />
        </TabsContent>

        <TabsContent value="caption" className="space-y-4">
          {!script ? (
            <p className="text-muted-foreground">No caption yet.</p>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Caption</CardTitle>
                  {caption && <CopyButton text={caption} />}
                </CardHeader>
                <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">{caption || "—"}</CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">CTA</CardTitle>
                  {cta && <CopyButton text={cta} />}
                </CardHeader>
                <CardContent className="text-sm leading-relaxed">{cta || "—"}</CardContent>
              </Card>
              {script.first_comment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">First Comment</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">{formatScriptBody(script.first_comment)}</CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hashtags</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">{hashtags.join(" ") || "—"}</CardContent>
              </Card>
              {slides.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Carousel Slides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {slides.map((slide, i) => (
                      <div key={i} className="rounded-lg border p-4 text-sm">
                        <p className="font-medium">{slide.title}</p>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed text-muted-foreground">
                          {slide.body || "—"}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {webapp && (
          <TabsContent value="webapp">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{webapp.title}</CardTitle>
                <a
                  href={`/webapps/${webapp.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  Open full screen
                </a>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">Theme: {webapp.theme || "—"}</p>
                <iframe
                  src={`/webapps/${webapp.slug}`}
                  title={webapp.title}
                  className="h-[min(70vh,800px)] w-full rounded-lg border bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="demo">
          {!demo ? (
            <p className="text-muted-foreground">No demo spec yet.</p>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{demo.title}</CardTitle>
                  {demo.component_key && (
                    <Link href={`/demos/${demo.slug}`} className="text-sm text-primary underline">
                      Open demo
                    </Link>
                  )}
                </CardHeader>
                <CardContent>
                  <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
                    {JSON.stringify(demo.spec, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quality">
          <QualityScorePanel scores={scores} />
        </TabsContent>

        <TabsContent value="recording">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recording Notes</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">
              {episode.recording_notes || script?.b_roll_suggestions?.join("\n") || "No recording notes yet."}
            </CardContent>
          </Card>
          {script?.visual_props && script.visual_props.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Visual Props</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{script.visual_props.join(", ")}</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
