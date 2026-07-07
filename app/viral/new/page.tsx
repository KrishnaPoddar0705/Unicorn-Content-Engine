import { PageHeader } from "@/components/layout/page-header";
import { CreateViralForm } from "@/components/viral/create-form";
import { getReferenceImages, getSeriesTemplates, getStyleProfiles } from "@/lib/db/viral-queries";
import type { ViralInputMode } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const INPUT_MODE_VALUES: ViralInputMode[] = [
  "paper",
  "idea",
  "topic",
  "trend",
  "reference_visual",
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewViralEpisodePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [templates, styleProfiles, referenceImages, params] = await Promise.all([
    getSeriesTemplates(),
    getStyleProfiles(),
    getReferenceImages(),
    searchParams,
  ]);

  const modeParam = first(params.mode);
  const initialMode = INPUT_MODE_VALUES.includes(modeParam as ViralInputMode)
    ? (modeParam as ViralInputMode)
    : undefined;

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
        initialMode={initialMode}
        initialTitle={first(params.title)}
        initialDomain={first(params.domain)}
        initialRawInput={first(params.idea)}
      />
    </div>
  );
}
