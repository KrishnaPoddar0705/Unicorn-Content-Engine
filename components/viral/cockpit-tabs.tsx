"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CuriosityPanel } from "./curiosity-panel";
import { ResearchPanel } from "./research-panel";
import { HooksPanel } from "./hooks-panel";
import { ScriptsPanel } from "./scripts-panel";
import { StoryboardTimeline } from "./storyboard-timeline";
import { VisualPromptsPanel } from "./visual-prompts-panel";
import { CarouselPanel } from "./carousel-panel";
import { CaptionsPanel } from "./captions-panel";
import { ProjectBridgePanel } from "./project-bridge-panel";
import { ScoresPanel } from "./scores-panel";
import { RevisionHistoryPanel } from "./revision-history-panel";
import { PerformanceForm } from "./performance-form";
import type { ViralStageOutputs } from "@/lib/prompts/viral/output-schemas";
import type { EpisodeRevision, EpisodeScore, ViralEpisode } from "@/lib/supabase/types";

const TABS = [
  ["curiosity", "Curiosity"],
  ["research", "Research"],
  ["hooks", "Hooks"],
  ["scripts", "Scripts"],
  ["storyboard", "Storyboard"],
  ["visuals", "Visual Prompts"],
  ["carousel", "Carousel"],
  ["captions", "Captions"],
  ["project", "Project Bridge"],
  ["scores", "Scores"],
  ["revisions", "Revisions"],
  ["performance", "Performance"],
] as const;

export function CockpitTabs({
  episode,
  outputs,
  score,
  revisions,
}: {
  episode: ViralEpisode;
  outputs: ViralStageOutputs;
  score: EpisodeScore | null;
  revisions: EpisodeRevision[];
}) {
  return (
    <Tabs defaultValue="curiosity">
      <TabsList className="h-auto flex-wrap justify-start">
        {TABS.map(([value, label]) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="curiosity">
        <CuriosityPanel episodeId={episode.id} output={outputs.curiosity_miner} />
      </TabsContent>
      <TabsContent value="research">
        <ResearchPanel episodeId={episode.id} output={outputs.expert_research} />
      </TabsContent>
      <TabsContent value="hooks">
        <HooksPanel episodeId={episode.id} output={outputs.hook_lab} />
      </TabsContent>
      <TabsContent value="scripts">
        <ScriptsPanel episodeId={episode.id} output={outputs.script_architect} />
      </TabsContent>
      <TabsContent value="storyboard">
        <StoryboardTimeline episodeId={episode.id} output={outputs.visual_director} />
      </TabsContent>
      <TabsContent value="visuals">
        <VisualPromptsPanel
          output={outputs.visual_director}
          styleProfile={episode.style_profiles}
        />
      </TabsContent>
      <TabsContent value="carousel">
        <CarouselPanel script={outputs.script_architect} visual={outputs.visual_director} />
      </TabsContent>
      <TabsContent value="captions">
        <CaptionsPanel episodeId={episode.id} output={outputs.engagement_engineer} />
      </TabsContent>
      <TabsContent value="project">
        <ProjectBridgePanel output={outputs.project_bridge} />
      </TabsContent>
      <TabsContent value="scores">
        <ScoresPanel output={outputs.virality_critic} />
      </TabsContent>
      <TabsContent value="revisions">
        <RevisionHistoryPanel revisions={revisions} />
      </TabsContent>
      <TabsContent value="performance">
        <PerformanceForm episodeId={episode.id} score={score} />
      </TabsContent>
    </Tabs>
  );
}
