"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Lightbulb, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface WalkthroughStep {
  id: string;
  title: string;
  story: string;
  insight?: string;
  content: React.ReactNode;
}

export interface PaperContext {
  title: string;
  authors: string;
  year: string;
  citationStatus?: "verified" | "research_inspired";
}

interface WalkthroughShellProps {
  title: string;
  tagline: string;
  paper: PaperContext;
  steps: WalkthroughStep[];
  whatStudentsLearn: string;
  rebuildChallenge: string;
}

export function WalkthroughShell({
  title,
  tagline,
  paper,
  steps,
  whatStudentsLearn,
  rebuildChallenge,
}: WalkthroughShellProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 pb-16">
      {/* Header */}
      <div className="space-y-3">
        <Badge variant="secondary" className="text-xs">
          Paper to Project Walkthrough
        </Badge>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <p className="text-lg text-muted-foreground">{tagline}</p>
      </div>

      {/* Paper card */}
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Research Paper</p>
            <p className="font-medium">{paper.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {paper.authors} · {paper.year}
              </span>
              {paper.citationStatus === "research_inspired" && (
                <Badge variant="warning" className="text-xs">
                  research-inspired
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStepIndex(i)}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              i <= stepIndex ? "bg-primary" : "bg-muted"
            )}
            title={s.title}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Step {stepIndex + 1} of {steps.length}: {step.title}
      </p>

      {/* Story narrative */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="mb-4 text-base leading-relaxed">{step.story}</p>
        {step.insight && (
          <div className="mb-6 flex gap-3 rounded-lg bg-amber-50 p-4 text-sm">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">Wait, what?</p>
              <p className="text-amber-800">{step.insight}</p>
            </div>
          </div>
        )}
        <div data-screenshot-target>{step.content}</div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        {!isLast ? (
          <Button onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}>
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setStepIndex(0)}>
            Restart Walkthrough
          </Button>
        )}
      </div>

      {/* Footer learning cards */}
      {isLast && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <FlaskConical className="h-4 w-4 text-primary" />
              What students learn
            </div>
            <p className="text-sm text-muted-foreground">{whatStudentsLearn}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-2 font-medium">Your rebuild challenge</div>
            <p className="text-sm text-muted-foreground">{rebuildChallenge}</p>
          </div>
        </div>
      )}
    </div>
  );
}
