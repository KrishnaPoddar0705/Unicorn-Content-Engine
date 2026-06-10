"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoShellProps {
  title: string;
  description: string;
  educationalNotes: string;
  paperConnection: string;
  children: React.ReactNode;
  resultPanel?: React.ReactNode;
}

export function DemoShell({
  title,
  description,
  educationalNotes,
  paperConnection,
  children,
  resultPanel,
}: DemoShellProps) {
  const [showLearn, setShowLearn] = useState(true);
  const [showPaper, setShowPaper] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{children}</div>
        {resultPanel && (
          <div
            data-screenshot-target
            className="rounded-xl border border-border bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-sm"
          >
            {resultPanel}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <CollapsibleSection
          title="What students learn"
          open={showLearn}
          onToggle={() => setShowLearn(!showLearn)}
        >
          <p className="text-muted-foreground">{educationalNotes}</p>
        </CollapsibleSection>
        <CollapsibleSection
          title="How this connects to the paper"
          open={showPaper}
          onToggle={() => setShowPaper(!showPaper)}
        >
          <p className="text-muted-foreground">{paperConnection}</p>
        </CollapsibleSection>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left font-medium"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <div className={cn("px-4 pb-4", !open && "hidden")}>{children}</div>
    </div>
  );
}
