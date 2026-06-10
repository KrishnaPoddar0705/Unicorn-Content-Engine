import { PageHeader } from "@/components/layout/page-header";
import { NewEpisodeForm } from "@/components/episodes/new-episode-form";
import { GenerateFromIdeaForm } from "@/components/episodes/generate-from-idea-form";
import { getEpisodes, getPapers } from "@/lib/db/queries";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function NewEpisodePage() {
  const [episodes, papers] = await Promise.all([getEpisodes(), getPapers()]);

  let pillars: { id: string; code: string; name: string }[] = [];
  if (isSupabaseConfigured()) {
    const { data } = await getSupabase().from("content_pillars").select("id, code, name");
    pillars = data || [];
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Generate Episode"
        description="Start from a content idea, or select a paper and run the full agent pipeline."
      />
      <div className="space-y-8">
        <GenerateFromIdeaForm pillars={pillars} />
        <NewEpisodeForm episodes={episodes} papers={papers} pillars={pillars} />
      </div>
    </div>
  );
}
