/**
 * Run with: npx tsx scripts/seed-database.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const PILLARS = [
  { code: "A", name: "Rebuilding Research Papers", description: "Core Paper to Project episodes" },
  { code: "B", name: "School vs Real Learning", description: "Contrast traditional vs project-based learning" },
  { code: "C", name: "Cool Student Research Questions", description: "Student-driven curiosity" },
  { code: "D", name: "AI Tools for Curious Students", description: "Practical AI literacy" },
  { code: "E", name: "Founder Education Takes", description: "Founder-led education philosophy" },
  { code: "F", name: "Parent Education", description: "Parent-trust-building content" },
  { code: "G", name: "Student Project Ideas", description: "Actionable project starters" },
  { code: "H", name: "Behind the Scenes of Learning", description: "Process and meta content" },
];

const CTAS = [
  { label: "Worksheet", text: "Comment WORKSHEET if you want the step-by-step rebuild guide.", target_audience: "student" },
  { label: "Link", text: "Comment LINK if you want the project template.", target_audience: "student" },
  { label: "Demo", text: "Comment DEMO and I'll send you the interactive version.", target_audience: "student" },
  { label: "Parent Guide", text: "Parents: comment GUIDE for the conversation starter PDF.", target_audience: "parent" },
  { label: "School", text: "Teachers: comment CLASSROOM for the 45-min workshop outline.", target_audience: "school" },
];

interface SeedEpisode {
  episode_number: number;
  title: string;
  content_pillar: string;
  target_audience: string;
  paper: {
    title: string;
    authors: string[];
    year: number | null;
    citation_status: string;
    source_url?: string;
    core_idea: string;
    rebuild_type: string;
    difficulty_level: string;
  };
  viral_hook: string;
  why_cool: string;
  demo_slug?: string;
  rebuildability_score: number;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const seedPath = resolve(process.cwd(), "data/seed-episodes.json");
  const episodes: SeedEpisode[] = JSON.parse(readFileSync(seedPath, "utf-8"));

  // Pillars
  for (const p of PILLARS) {
    await supabase.from("content_pillars").upsert(p, { onConflict: "code" });
  }
  const { data: pillars } = await supabase.from("content_pillars").select("*");
  const pillarMap = Object.fromEntries((pillars || []).map((p) => [p.code, p.id]));

  // CTAs
  for (const c of CTAS) {
    const { data: existing } = await supabase.from("ctas").select("id").eq("label", c.label).single();
    if (!existing) await supabase.from("ctas").insert(c);
  }

  // Settings singleton
  const { data: settings } = await supabase.from("settings").select("id").limit(1);
  if (!settings?.length) {
    await supabase.from("settings").insert({ llm_provider: "anthropic" });
  }

  // Episodes + papers
  for (const ep of episodes) {
    const { data: existingPaper } = await supabase
      .from("papers")
      .select("id")
      .eq("title", ep.paper.title)
      .maybeSingle();

    let paperId = existingPaper?.id;
    if (!paperId) {
      const { data: paper } = await supabase
        .from("papers")
        .insert({
          title: ep.paper.title,
          authors: ep.paper.authors,
          year: ep.paper.year,
          source_url: ep.paper.source_url || null,
          core_idea: ep.paper.core_idea,
          why_cool: ep.why_cool,
          difficulty_level: ep.paper.difficulty_level,
          rebuild_type: ep.paper.rebuild_type,
          citation_status: ep.paper.citation_status,
          is_rebuildable: true,
          audience_suitability: [ep.target_audience],
          content_status: "idea",
          suggested_project: ep.title,
        })
        .select("id")
        .single();
      paperId = paper?.id;
    }

    const { data: existingEp } = await supabase
      .from("episodes")
      .select("id")
      .eq("episode_number", ep.episode_number)
      .maybeSingle();

    let episodeId = existingEp?.id;
    if (!episodeId) {
      const { data: episode } = await supabase
        .from("episodes")
        .insert({
          episode_number: ep.episode_number,
          title: ep.title,
          content_pillar_id: pillarMap[ep.content_pillar],
          paper_id: paperId,
          target_audience: ep.target_audience,
          why_cool: ep.why_cool,
          viral_hook: ep.viral_hook,
          one_line_positioning: ep.viral_hook,
          demo_build_status: ep.demo_slug ? "ready" : "not_started",
          status: "draft",
        })
        .select("id")
        .single();
      episodeId = episode?.id;
    }

    if (ep.demo_slug && episodeId) {
      const demoData: Record<string, { title: string; description: string; component_key: string; educational_notes: string; paper_connection: string }> = {
        pagerank: {
          title: "PageRank Visualizer",
          description: "See how 5 websites rank based on link structure",
          component_key: "pagerank",
          educational_notes: "Links are votes; votes from popular pages matter more.",
          paper_connection: "This is the core insight behind Google's original PageRank algorithm.",
        },
        recommender: {
          title: "Mini Recommendation Engine",
          description: "Collaborative filtering with a tiny user-movie matrix",
          component_key: "recommender",
          educational_notes: "Recommendations come from people with similar taste, not magic.",
          paper_connection: "Netflix-style recommendations started with tables like this.",
        },
        "misinformation-spread": {
          title: "Misinformation Spread Simulator",
          description: "Watch how rumors spread through a social network",
          component_key: "misinformation-spread",
          educational_notes: "Virality is a network property, not just content quality.",
          paper_connection: "Researchers model misinformation spread like disease epidemics.",
        },
      };

      const d = demoData[ep.demo_slug];
      if (d) {
        const { data: existingDemo } = await supabase.from("demos").select("id").eq("slug", ep.demo_slug).maybeSingle();
        if (!existingDemo) {
          await supabase.from("demos").insert({
            episode_id: episodeId,
            slug: ep.demo_slug,
            title: d.title,
            description: d.description,
            component_key: d.component_key,
            status: "built",
            educational_notes: d.educational_notes,
            paper_connection: d.paper_connection,
          });
        }
      }
    }

    if (episodeId) {
      const scores = [
        ep.rebuildability_score,
        Math.min(10, ep.rebuildability_score - 1),
        8,
        ep.target_audience === "parent" ? 9 : 7,
        ep.rebuildability_score,
        8,
        9,
      ];
      const overall = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

      const { data: existingScore } = await supabase
        .from("quality_scores")
        .select("id")
        .eq("episode_id", episodeId)
        .maybeSingle();

      if (!existingScore) {
        await supabase.from("quality_scores").insert({
          episode_id: episodeId,
          hook_strength: scores[0],
          surprise_factor: scores[1],
          student_relevance: 8,
          parent_relevance: ep.target_audience === "parent" ? 9 : 7,
          demo_feasibility: ep.rebuildability_score,
          shareability: 8,
          brand_fit: 9,
          overall_viral_score: overall,
          clarity: 8,
          authenticity: 9,
          educational_value: 8,
          rebuildability: ep.rebuildability_score,
          explanation: `Strong ${ep.content_pillar} pillar episode with rebuildability score ${ep.rebuildability_score}/10.`,
          improvements: ["Generate full script via Episode Generator", "Record talking-head video"],
        });
      }
    }
  }

  console.log("Seed complete:", episodes.length, "episodes");
}

main().catch(console.error);
