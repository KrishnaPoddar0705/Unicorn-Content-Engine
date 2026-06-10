"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WalkthroughShell } from "@/components/demos/walkthrough-shell";
import {
  computePageRank,
  DEFAULT_NODES,
  DEFAULT_EDGES,
} from "@/lib/demos/algorithms/pagerank";

const POSITIONS: Record<string, { x: number; y: number }> = {
  A: { x: 80, y: 60 },
  B: { x: 200, y: 40 },
  C: { x: 320, y: 60 },
  D: { x: 140, y: 180 },
  E: { x: 280, y: 180 },
};

function LinkGraph({ highlightNode }: { highlightNode?: string }) {
  return (
    <svg viewBox="0 0 400 280" className="w-full">
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#a5b4fc" />
        </marker>
      </defs>
      {DEFAULT_EDGES.map((e, i) => {
        const p1 = POSITIONS[e.from];
        const p2 = POSITIONS[e.to];
        return (
          <line
            key={i}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="#a5b4fc"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
        );
      })}
      {DEFAULT_NODES.map((node) => {
        const p = POSITIONS[node.id];
        const highlighted = highlightNode === node.id;
        return (
          <g key={node.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r="28"
              fill={highlighted ? "#7c3aed" : "#4f46e5"}
              className="transition-all"
            />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              {node.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function PageRankDemo() {
  const [damping, setDamping] = useState(0.85);
  const [ranks, setRanks] = useState<Record<string, number> | null>(null);
  const [running, setRunning] = useState(false);
  const [iteration, setIteration] = useState(0);

  const sorted = useMemo(() => {
    if (!ranks) return [];
    return DEFAULT_NODES.map((n) => ({ ...n, score: ranks[n.id] }))
      .sort((a, b) => b.score - a.score);
  }, [ranks]);

  const run = () => {
    setRunning(true);
    setIteration(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setIteration(step);
      if (step >= 5) {
        clearInterval(interval);
        setRanks(computePageRank(DEFAULT_NODES, DEFAULT_EDGES, damping));
        setRunning(false);
      }
    }, 500);
  };

  const steps = [
    {
      id: "problem",
      title: "The Problem",
      story:
        "In 1998, the web was exploding. Larry Page and Sergey Brin at Stanford faced a question: how do you find the best page about 'dinosaurs' when there are thousands of results? Counting keywords wasn't enough — spam pages could stuff words. They needed something smarter.",
      insight: "The web isn't a library catalog. It's a network of trust.",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>The paper asked: <strong className="text-foreground">Can we rank pages by how the web itself votes?</strong></p>
          <p>Every link from page A to page B is a vote: &quot;B is worth visiting.&quot;</p>
        </div>
      ),
    },
    {
      id: "setup",
      title: "The Setup",
      story:
        "Let's rebuild their idea with just 5 websites. News Site (C) links to School Blog (A) and Science Wiki (B). School Blog links back to News Site. Forum (D) links to Science Wiki. Personal Page (E) links to Forum. Watch the arrows — each one is a vote.",
      content: (
        <div>
          <LinkGraph />
          <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
            {DEFAULT_NODES.map((n) => (
              <li key={n.id}>
                <strong className="text-foreground">{n.id} — {n.label}</strong>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "method",
      title: "The Method",
      story:
        "PageRank doesn't just count links. It asks: who linked to you? A link from a popular page counts more than a link from a nobody. The algorithm spreads 'importance' through the network, over and over, until rankings stabilize. The damping factor (0.85) means there's a 15% chance a 'surfer' jumps to a random page instead of following links.",
      insight: "It's not a popularity contest. It's a popularity contest where the judges are also contestants.",
      content: (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4 font-mono text-sm">
            PR(A) = (1-d)/N + d × Σ(PR(linking pages) / their outbound links)
          </div>
          <div className="space-y-2">
            <Label>Damping factor (d): {damping.toFixed(2)}</Label>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={damping}
              onChange={(e) => setDamping(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Page & Brin used 0.85 — try lowering it and see rankings shift.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "recreate",
      title: "Recreate the Result",
      story:
        "Now run PageRank on our mini web. Watch the algorithm iterate — each round, importance flows along the links. After a few iterations, we get stable rankings. This is the same core math Google used before the web became... complicated.",
      content: (
        <div className="space-y-4">
          <LinkGraph highlightNode={sorted[0]?.id} />
          <Button onClick={run} disabled={running} className="w-full" size="lg">
            {running ? `Iterating... (${iteration}/5)` : "Run PageRank"}
          </Button>
          {ranks && (
            <div className="space-y-3">
              <h4 className="font-semibold">Final Rankings</h4>
              {sorted.map((node, i) => (
                <div key={node.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>
                      #{i + 1} {node.label} ({node.id})
                    </span>
                    <span className="font-mono">{(node.score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                      style={{ width: `${node.score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Science Wiki (B) ranks high not because it has the most links, but because
                important pages link to it. That&apos;s the PageRank insight — and it&apos;s why Google worked.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <WalkthroughShell
      title="I rebuilt Google's PageRank"
      tagline="Google was built on one clever popularity contest. Let's walk through the paper and recreate it."
      paper={{
        title: "The PageRank Citation Ranking: Bringing Order to the Web",
        authors: "Larry Page & Sergey Brin",
        year: "1998",
        citationStatus: "verified",
      }}
      steps={steps}
      whatStudentsLearn="Links are votes, but votes from popular pages matter more. PageRank is iterative — importance flows through a network until it stabilizes."
      rebuildChallenge="Build this with 5 nodes in Python or Google Sheets. Add a 6th node and predict how rankings change before you run it."
    />
  );
}
