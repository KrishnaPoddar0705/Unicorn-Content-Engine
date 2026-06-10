export interface PageNode {
  id: string;
  label: string;
}

export interface PageEdge {
  from: string;
  to: string;
}

export const DEFAULT_NODES: PageNode[] = [
  { id: "A", label: "School Blog" },
  { id: "B", label: "Science Wiki" },
  { id: "C", label: "News Site" },
  { id: "D", label: "Forum" },
  { id: "E", label: "Personal Page" },
];

export const DEFAULT_EDGES: PageEdge[] = [
  { from: "B", to: "A" },
  { from: "C", to: "A" },
  { from: "C", to: "B" },
  { from: "D", to: "B" },
  { from: "E", to: "D" },
  { from: "A", to: "C" },
];

export function computePageRank(
  nodes: PageNode[],
  edges: PageEdge[],
  damping = 0.85,
  iterations = 20
): Record<string, number> {
  const n = nodes.length;
  const ids = nodes.map((node) => node.id);
  const ranks: Record<string, number> = {};
  ids.forEach((id) => {
    ranks[id] = 1 / n;
  });

  const outLinks: Record<string, string[]> = {};
  ids.forEach((id) => {
    outLinks[id] = [];
  });
  edges.forEach((e) => {
    if (outLinks[e.from]) outLinks[e.from].push(e.to);
  });

  for (let iter = 0; iter < iterations; iter++) {
    const newRanks: Record<string, number> = {};
    const base = (1 - damping) / n;

    ids.forEach((id) => {
      let sum = 0;
      ids.forEach((source) => {
        const outs = outLinks[source];
        if (outs.includes(id)) {
          sum += ranks[source] / (outs.length || 1);
        }
      });
      newRanks[id] = base + damping * sum;
    });

    Object.assign(ranks, newRanks);
  }

  const total = ids.reduce((s, id) => s + ranks[id], 0);
  ids.forEach((id) => {
    ranks[id] = ranks[id] / total;
  });

  return ranks;
}
