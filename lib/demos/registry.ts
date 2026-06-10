import type { ComponentType } from "react";
import { PageRankDemo } from "@/components/demos/pagerank/pagerank-demo";
import { RecommenderDemo } from "@/components/demos/recommender/recommender-demo";
import { SpreadDemo } from "@/components/demos/misinformation/spread-demo";

export interface DemoMeta {
  slug: string;
  title: string;
  component: ComponentType;
  educationalNotes: string;
  paperConnection: string;
}

export const DEMO_REGISTRY: Record<string, DemoMeta> = {
  pagerank: {
    slug: "pagerank",
    title: "PageRank Visualizer",
    component: PageRankDemo,
    educationalNotes: "Links are votes; votes from popular pages matter more.",
    paperConnection: "This is the core insight behind Google's original PageRank algorithm.",
  },
  recommender: {
    slug: "recommender",
    title: "Mini Recommendation Engine",
    component: RecommenderDemo,
    educationalNotes: "Recommendations come from people with similar taste, not magic.",
    paperConnection: "Netflix-style recommendations started with tables like this.",
  },
  "misinformation-spread": {
    slug: "misinformation-spread",
    title: "Misinformation Spread Simulator",
    component: SpreadDemo,
    educationalNotes: "Virality is a network property, not just content quality.",
    paperConnection: "Researchers model misinformation spread like disease epidemics.",
  },
};

export function getDemo(slug: string): DemoMeta | undefined {
  return DEMO_REGISTRY[slug];
}
