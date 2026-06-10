import { PageHeader } from "@/components/layout/page-header";
import { PaperForm } from "@/components/papers/paper-form";

export default function NewPaperPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Add Paper"
        description="Ingest a paper from text, PDF link, or upload — then auto-build the episode package and interactive webpage."
      />
      <PaperForm />
    </div>
  );
}
