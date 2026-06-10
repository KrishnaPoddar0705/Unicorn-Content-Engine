import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSettings } from "@/lib/db/queries";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="p-8">
      <PageHeader
        title="Settings"
        description="Configure LLM provider, models, and review brand voice."
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
