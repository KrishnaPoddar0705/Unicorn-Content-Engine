"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WalkthroughShell } from "@/components/demos/walkthrough-shell";
import {
  generateSmallWorldNetwork,
  createInitialStates,
  simulateSpread,
  type NodeState,
} from "@/lib/demos/algorithms/sir-spread";

const STATE_COLORS: Record<NodeState, string> = {
  susceptible: "#e5e7eb",
  infected: "#ef4444",
  recovered: "#22c55e",
  skeptic: "#6366f1",
};

const STATE_LABELS: Record<NodeState, string> = {
  susceptible: "Haven't heard it",
  infected: "Believes rumor",
  recovered: "Stopped sharing",
  skeptic: "Fact-checker",
};

function NetworkViz({
  nodes,
  states,
}: {
  nodes: ReturnType<typeof generateSmallWorldNetwork>;
  states: NodeState[];
}) {
  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-sm mx-auto">
      {nodes.map((node) =>
        node.neighbors.map((n) =>
          node.id < n ? (
            <line
              key={`${node.id}-${n}`}
              x1={node.x}
              y1={node.y}
              x2={nodes[n].x}
              y2={nodes[n].y}
              stroke="#d1d5db"
              strokeWidth="1"
            />
          ) : null
        )
      )}
      {nodes.map((node, i) => (
        <circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r="12"
          fill={STATE_COLORS[states[i]]}
          stroke="#fff"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

export function SpreadDemo() {
  const nodes = useMemo(() => generateSmallWorldNetwork(20), []);
  const [sharingRate, setSharingRate] = useState(0.35);
  const [skepticismRate, setSkepticismRate] = useState(0.1);
  const [seedCount, setSeedCount] = useState(2);
  const [history, setHistory] = useState<NodeState[][] | null>(null);
  const [step, setStep] = useState(0);

  const currentStates = history ? history[step] : null;

  const counts = currentStates
    ? {
        infected: currentStates.filter((s) => s === "infected").length,
        skeptic: currentStates.filter((s) => s === "skeptic").length,
        recovered: currentStates.filter((s) => s === "recovered").length,
      }
    : null;

  const run = () => {
    const initial = createInitialStates(nodes.length, seedCount, skepticismRate);
    const sim = simulateSpread(nodes, initial, sharingRate, skepticismRate, 15);
    setHistory(sim);
    setStep(0);
  };

  const steps = [
    {
      id: "problem",
      title: "The Problem",
      story:
        "Why does fake news spread faster than truth? Researchers studying online diffusion found that false stories reach 1,500 people six times faster than true ones. It's not because people are stupid — it's because lies are surprising, and surprise makes us share.",
      insight: "Misinformation doesn't spread because it's true. It spreads because it's novel.",
      content: (
        <p className="text-sm text-muted-foreground">
          Scientists model rumor spread like <strong className="text-foreground">disease epidemics</strong> — using SIR models (Susceptible, Infected, Recovered) on social networks.
        </p>
      ),
    },
    {
      id: "network",
      title: "The Network",
      story:
        "You're looking at 20 people connected like a real social network — some close friends, some distant connections. Information (or misinformation) travels along these edges. A rumor doesn't go viral because one person shares it. It goes viral because the network structure amplifies it.",
      content: (
        <div>
          <NetworkViz
            nodes={nodes}
            states={Array(nodes.length).fill("susceptible" as NodeState)}
          />
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
            {Object.entries(STATE_LABELS).map(([key, label]) => (
              <span key={key} className="flex items-center gap-1">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: STATE_COLORS[key as NodeState] }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "method",
      title: "The Method",
      story:
        "The model works like this: a few people start with the rumor (infected). Each step, infected people share with their neighbors. Some neighbors become skeptics who resist. Some infected people eventually stop sharing (recovered). Adjust sharing rate and skepticism to see how the network responds.",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sharing rate: {(sharingRate * 100).toFixed(0)}%</Label>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={sharingRate}
              onChange={(e) => setSharingRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Skepticism rate: {(skepticismRate * 100).toFixed(0)}%</Label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={skepticismRate}
              onChange={(e) => setSkepticismRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Initial rumor sources: {seedCount}</Label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={seedCount}
              onChange={(e) => setSeedCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      ),
    },
    {
      id: "recreate",
      title: "Recreate the Result",
      story:
        "Drop a rumor into the network and watch it spread step by step. Drag the timeline slider to see each round. Notice how a well-connected 'super-spreader' can infect the whole network in just a few steps — that's the same dynamic behind viral misinformation.",
      content: (
        <div className="space-y-4">
          <Button onClick={run} className="w-full" size="lg">
            Spread Rumor
          </Button>
          {currentStates && history && (
            <>
              <NetworkViz nodes={nodes} states={currentStates} />
              {counts && (
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-red-50 p-3">
                    <span className="block text-2xl font-bold text-red-500">{counts.infected}</span>
                    Believed
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-3">
                    <span className="block text-2xl font-bold text-indigo-500">{counts.skeptic}</span>
                    Skeptics
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <span className="block text-2xl font-bold text-green-500">{counts.recovered}</span>
                    Stopped
                  </div>
                </div>
              )}
              <div>
                <Label>Timeline: Step {step} of {history.length - 1}</Label>
                <input
                  type="range"
                  min={0}
                  max={history.length - 1}
                  value={step}
                  onChange={(e) => setStep(parseInt(e.target.value))}
                  className="mt-2 w-full"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                At step {step}, {counts?.infected} people believe the rumor.
                {counts && counts.skeptic > 0 && ` ${counts.skeptic} skeptics are slowing the spread.`}
                {step === history.length - 1 && " The rumor has mostly burned out."}
              </p>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <WalkthroughShell
      title="I rebuilt how misinformation spreads"
      tagline="Lies travel faster because our brains love surprises. Let's simulate it."
      paper={{
        title: "The Spread of True and False News Online",
        authors: "Vosoughi, Roy & Aral (MIT)",
        year: "2018",
        citationStatus: "research_inspired",
      }}
      steps={steps}
      whatStudentsLearn="Virality is a network property. Sharing rate, network structure, and skepticism together determine how far misinformation travels — not just content quality."
      rebuildChallenge="Build this in Python with NetworkX. Try removing one 'hub' node — does the rumor still go viral?"
    />
  );
}
