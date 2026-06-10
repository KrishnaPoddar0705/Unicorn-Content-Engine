import { PageHeader } from "@/components/layout/page-header";
import { CreateViralForm } from "@/components/viral/create-form";
import { getReferenceImages, getSeriesTemplates, getStyleProfiles } from "@/lib/db/viral-queries";

export const dynamic = "force-dynamic";

export default async function NewViralEpisodePage() {
  const [templates, styleProfiles, referenceImages] = await Promise.all([
    getSeriesTemplates(),
    getStyleProfiles(),
    getReferenceImages(),
  ]);

  return (
    <div className="p-8">
      <PageHeader
        title="Create Viral Episode"
        description="Five input modes, eight agents, one deeply researched piece of content."
      />
      <CreateViralForm
        templates={templates}
        styleProfiles={styleProfiles}
        referenceImages={referenceImages}
      />
    </div>
  );
}
