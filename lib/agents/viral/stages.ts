import { z } from "zod";
import { runAgent, runAgentText, type AgentRunContext } from "@/lib/agents/runner";
import { getSupabase } from "@/lib/supabase/server";
import { parseHtmlFromResponse } from "@/lib/agents/save-interactive-webpage";
import type { ViralEpisode, ViralStage } from "@/lib/supabase/types";
import {
  WEBPAGE_SYSTEM,
  buildWebpageHtmlPrompt,
  buildWebpageMetaPrompt,
  type WebpageBuildContext,
} from "@/lib/prompts/viral/webpage-builder";
import { describeSourceMaterial } from "@/lib/prompts/viral/shared-brand-context";
import { buildCuriosityMinerPrompt } from "@/lib/prompts/viral/curiosity-miner";
import { buildExpertResearchPrompt } from "@/lib/prompts/viral/expert-research";
import { buildHookLabPrompt } from "@/lib/prompts/viral/hook-lab";
import { buildScriptArchitectPrompt } from "@/lib/prompts/viral/script-architect";
import { buildVisualDirectorPrompt } from "@/lib/prompts/viral/visual-director";
import { buildEngagementEngineerPrompt } from "@/lib/prompts/viral/engagement-engineer";
import { buildViralityCriticPrompt } from "@/lib/prompts/viral/virality-critic-v2";
import { buildProjectBridgePrompt } from "@/lib/prompts/viral/project-bridge";
import {
  CuriosityMinerSchema,
  ExpertResearchSchema,
  HookLabSchema,
  ScriptArchitectSchema,
  VisualDirectorSchema,
  EngagementEngineerSchema,
  ViralityCriticSchema,
  ProjectBridgeSchema,
  type CuriosityMinerOutput,
  type ExpertResearchOutput,
  type HookLabOutput,
  type ScriptArchitectOutput,
  type VisualDirectorOutput,
  type EngagementEngineerOutput,
  type ProjectBridgeOutput,
  type ViralStageOutputs,
  type WebpageStageOutput,
} from "@/lib/prompts/viral/output-schemas";

export interface StageRunCtx {
  episode: ViralEpisode;
  outputs: ViralStageOutputs;
  extraSystem: string;
  styleInstruction?: string;
  context: AgentRunContext;
}

export interface StageDef {
  stage: ViralStage;
  deps: ViralStage[];
  run(ctx: StageRunCtx): Promise<unknown>;
}

const VIRAL_CORRECTION_MESSAGE =
  "Your previous JSON was invalid or incomplete. Return ONE valid JSON object matching exactly the requested shape, with ALL required fields present. String fields must be plain text (not nested JSON), array fields must be real arrays. Do not wrap the JSON in markdown fences or commentary.";

function winnerHook(ctx: StageRunCtx): string {
  return (
    ctx.episode.winner_hook ||
    (ctx.outputs.hook_lab as HookLabOutput | undefined)?.winner ||
    ctx.episode.title
  );
}

export const VIRAL_STAGES: StageDef[] = [
  {
    stage: "curiosity_miner",
    deps: [],
    async run(ctx) {
      const { output } = await runAgent({
        agentName: "viral_curiosity_miner",
        userPrompt: buildCuriosityMinerPrompt({
          sourceMaterial: describeSourceMaterial(ctx.episode),
          title: ctx.episode.title,
        }),
        schema: CuriosityMinerSchema,
        context: ctx.context,
        extraSystem: ctx.extraSystem,
        correctionMessage: VIRAL_CORRECTION_MESSAGE,
      });
      return output;
    },
  },
  {
    stage: "expert_research",
    deps: [],
    async run(ctx) {
      const { output } = await runAgent({
        agentName: "viral_expert_research",
        userPrompt: buildExpertResearchPrompt({
          sourceMaterial: describeSourceMaterial(ctx.episode),
          title: ctx.episode.title,
        }),
        schema: ExpertResearchSchema,
        context: ctx.context,
        extraSystem: ctx.extraSystem,
        correctionMessage: VIRAL_CORRECTION_MESSAGE,
        temperature: 0.4,
      });
      return output;
    },
  },
  {
    stage: "hook_lab",
    deps: ["curiosity_miner", "expert_research"],
    async run(ctx) {
      const { output } = await runAgent({
        agentName: "viral_hook_lab",
        userPrompt: buildHookLabPrompt({
          title: ctx.episode.title,
          curiosity: ctx.outputs.curiosity_miner as CuriosityMinerOutput,
          research: ctx.outputs.expert_research as ExpertResearchOutput,
        }),
        schema: HookLabSchema,
        context: ctx.context,
        extraSystem: ctx.extraSystem,
        correctionMessage: VIRAL_CORRECTION_MESSAGE,
        maxTokens: 12000,
        temperature: 0.9,
      });
      return output;
    },
  },
  {
    stage: "script_architect",
    deps: ["hook_lab"],
    async run(ctx) {
      const { output } = await runAgent({
        agentName: "viral_script_architect",
        userPrompt: buildScriptArchitectPrompt({
          title: ctx.episode.title,
          winnerHook: winnerHook(ctx),
          curiosity: ctx.outputs.curiosity_miner as CuriosityMinerOutput,
          research: ctx.outputs.expert_research as ExpertResearchOutput,
        }),
        schema: ScriptArchitectSchema,
        context: ctx.context,
        extraSystem: ctx.extraSystem,
        correctionMessage: VIRAL_CORRECTION_MESSAGE,
        maxTokens: 20000,
      });
      return output;
    },
  },
  {
    stage: "project_bridge",
    deps: ["curiosity_miner", "expert_research"],
    async run(ctx) {
      const { output } = await runAgent({
        agentName: "viral_project_bridge",
        userPrompt: buildProjectBridgePrompt({
          title: ctx.episode.title,
          curiosity: ctx.outputs.curiosity_miner as CuriosityMinerOutput,
          research: ctx.outputs.expert_research as ExpertResearchOutput,
        }),
        schema: ProjectBridgeSchema,
        context: ctx.context,
        extraSystem: ctx.extraSystem,
        correctionMessage: VIRAL_CORRECTION_MESSAGE,
      });
      return output;
    },
  },
  {
    stage: "visual_director",
    deps: ["script_architect"],
    async run(ctx) {
      const { output } = await runAgent({
        agentName: "viral_visual_director",
        userPrompt: buildVisualDirectorPrompt({
          title: ctx.episode.title,
          winnerHook: winnerHook(ctx),
          script: ctx.outputs.script_architect as ScriptArchitectOutput,
          styleInstruction: ctx.styleInstruction,
        }),
        schema: VisualDirectorSchema,
        context: ctx.context,
        extraSystem: ctx.extraSystem,
        correctionMessage: VIRAL_CORRECTION_MESSAGE,
        maxTokens: 16000,
      });
      return output;
    },
  },
  {
    stage: "engagement_engineer",
    deps: ["script_architect"],
    async run(ctx) {
      const { output } = await runAgent({
        agentName: "viral_engagement_engineer",
        userPrompt: buildEngagementEngineerPrompt({
          title: ctx.episode.title,
          winnerHook: winnerHook(ctx),
          hookLab: ctx.outputs.hook_lab as HookLabOutput,
          script: ctx.outputs.script_architect as ScriptArchitectOutput,
        }),
        schema: EngagementEngineerSchema,
        context: ctx.context,
        extraSystem: ctx.extraSystem,
        correctionMessage: VIRAL_CORRECTION_MESSAGE,
        temperature: 0.8,
      });
      return output;
    },
  },
  {
    stage: "virality_critic",
    deps: ["script_architect", "engagement_engineer", "visual_director", "project_bridge"],
    async run(ctx) {
      const research = ctx.outputs.expert_research as ExpertResearchOutput;
      const { output } = await runAgent({
        agentName: "viral_virality_critic",
        userPrompt: buildViralityCriticPrompt({
          title: ctx.episode.title,
          winnerHook: winnerHook(ctx),
          curiosity: ctx.outputs.curiosity_miner as CuriosityMinerOutput,
          script: ctx.outputs.script_architect as ScriptArchitectOutput,
          engagement: ctx.outputs.engagement_engineer as EngagementEngineerOutput,
          projectBridge: ctx.outputs.project_bridge!,
          visual: ctx.outputs.visual_director as VisualDirectorOutput | undefined,
          verifiedFacts: research?.verified_facts ?? [],
        }),
        schema: ViralityCriticSchema,
        context: ctx.context,
        extraSystem: ctx.extraSystem,
        correctionMessage: VIRAL_CORRECTION_MESSAGE,
        temperature: 0.3,
      });
      return output;
    },
  },
  {
    stage: "interactive_webpage",
    deps: ["expert_research", "project_bridge", "visual_director"],
    async run(ctx) {
      const webCtx: WebpageBuildContext = {
        title: ctx.episode.title,
        winnerHook: winnerHook(ctx),
        domain: ctx.episode.domain,
        targetAudience: ctx.episode.target_audience,
        curiosity: ctx.outputs.curiosity_miner as CuriosityMinerOutput,
        research: ctx.outputs.expert_research as ExpertResearchOutput,
        projectBridge: ctx.outputs.project_bridge as ProjectBridgeOutput,
        visual: ctx.outputs.visual_director as VisualDirectorOutput | undefined,
        styleInstruction: ctx.styleInstruction,
      };
      const slugBase = ctx.episode.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);

      const { output: meta } = await runAgent({
        agentName: "viral_webpage_meta",
        userPrompt: buildWebpageMetaPrompt(webCtx, slugBase),
        schema: WebpageMetaSchema,
        context: ctx.context,
        extraSystem: WEBPAGE_SYSTEM,
        correctionMessage: VIRAL_CORRECTION_MESSAGE,
      });

      const { content: htmlRaw } = await runAgentText({
        agentName: "viral_interactive_webpage",
        userPrompt: buildWebpageHtmlPrompt(webCtx, meta),
        context: ctx.context,
        extraSystem: WEBPAGE_SYSTEM,
        maxTokens: 32000,
        temperature: 0.8,
      });

      const html = parseHtmlFromResponse(htmlRaw);
      const slug = `${meta.slug || slugBase}-v${ctx.episode.id.slice(0, 6)}`
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-");

      const supabase = getSupabase();
      await supabase
        .from("interactive_webpages")
        .delete()
        .eq("viral_episode_id", ctx.episode.id);

      // Clean public blog slug; suffix only on collision with another article
      let blogSlug = (meta.slug || slugBase).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      const { data: existing } = await supabase
        .from("interactive_webpages")
        .select("id")
        .eq("blog_slug", blogSlug)
        .maybeSingle();
      if (existing) blogSlug = `${blogSlug}-${ctx.episode.id.slice(0, 6)}`;

      const { data, error } = await supabase
        .from("interactive_webpages")
        .insert({
          viral_episode_id: ctx.episode.id,
          slug,
          blog_slug: blogSlug,
          title: meta.title,
          theme: meta.theme,
          html_content: html,
          status: "published",
        })
        .select("id, slug")
        .single();
      if (error || !data) throw new Error(`Failed to save webpage: ${error?.message}`);

      const output: WebpageStageOutput = {
        webpage_id: data.id,
        slug: data.slug,
        title: meta.title,
        theme: meta.theme,
        comment_keyword: meta.comment_keyword,
        share_path: `/webapps/${data.slug}`,
        blog_path: `/blog/project/${blogSlug}`,
        html_length: html.length,
      };
      return output;
    },
  },
];

const WebpageMetaSchema = z.object({
  title: z.string(),
  slug: z.string(),
  theme: z.string(),
  comment_keyword: z
    .string()
    .transform((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) || "RESEARCH"),
});

export const STAGE_ORDER: ViralStage[] = VIRAL_STAGES.map((s) => s.stage);

export function getStageDef(stage: ViralStage): StageDef {
  const def = VIRAL_STAGES.find((s) => s.stage === stage);
  if (!def) throw new Error(`Unknown viral stage: ${stage}`);
  return def;
}

export const STAGE_LABELS: Record<ViralStage, string> = {
  curiosity_miner: "Curiosity Miner",
  expert_research: "Expert Research",
  hook_lab: "Hook Lab",
  script_architect: "Script Architect",
  project_bridge: "Project Bridge",
  visual_director: "Visual Director",
  engagement_engineer: "Engagement Engineer",
  virality_critic: "Virality Critic",
  interactive_webpage: "Interactive Webpage",
};

/** Schema-validated stages eligible for in-place revision (the webpage stage regenerates via retry instead). */
export const VIRAL_SCHEMAS = {
  curiosity_miner: CuriosityMinerSchema,
  expert_research: ExpertResearchSchema,
  hook_lab: HookLabSchema,
  script_architect: ScriptArchitectSchema,
  visual_director: VisualDirectorSchema,
  engagement_engineer: EngagementEngineerSchema,
  virality_critic: ViralityCriticSchema,
  project_bridge: ProjectBridgeSchema,
} as const;
