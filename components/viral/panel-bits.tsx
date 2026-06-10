"use client";

import { CopyButton } from "@/components/episodes/copy-button";

export function WaitingFor({ stage }: { stage: string }) {
  return (
    <div className="glass-panel p-10 text-center text-sm text-muted-foreground">
      Waiting on the {stage} stage…
    </div>
  );
}

export function FieldBlock({
  label,
  value,
  copyable = true,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="glass-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
        </div>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

export function ListBlock({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="glass-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <CopyButton text={items.join("\n")} />
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="text-primary">·</span>
            <span className="whitespace-pre-wrap">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
