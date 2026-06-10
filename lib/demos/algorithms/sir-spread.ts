export interface NetworkNode {
  id: number;
  x: number;
  y: number;
  neighbors: number[];
}

export type NodeState = "susceptible" | "infected" | "recovered" | "skeptic";

export function generateSmallWorldNetwork(count = 20): NetworkNode[] {
  const nodes: NetworkNode[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    nodes.push({
      id: i,
      x: 200 + Math.cos(angle) * 140,
      y: 200 + Math.sin(angle) * 140,
      neighbors: [],
    });
  }
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    const skip = (i + 4) % count;
    nodes[i].neighbors.push(next, skip);
    if (!nodes[next].neighbors.includes(i)) nodes[next].neighbors.push(i);
    if (!nodes[skip].neighbors.includes(i)) nodes[skip].neighbors.push(i);
  }
  return nodes;
}

export function simulateSpread(
  nodes: NetworkNode[],
  initialStates: NodeState[],
  sharingRate: number,
  skepticismRate: number,
  steps: number
): NodeState[][] {
  const history: NodeState[][] = [initialStates.slice()];
  let current = initialStates.slice();

  for (let step = 0; step < steps; step++) {
    const next = current.slice();
    for (let i = 0; i < nodes.length; i++) {
      if (current[i] === "infected") {
        nodes[i].neighbors.forEach((n) => {
          if (current[n] === "susceptible" && Math.random() < sharingRate) {
            next[n] = "infected";
          }
          if (current[n] === "susceptible" && Math.random() < skepticismRate) {
            next[n] = "skeptic";
          }
        });
        if (Math.random() < 0.15) next[i] = "recovered";
      }
    }
    current = next;
    history.push(current.slice());
  }
  return history;
}

export function createInitialStates(
  nodeCount: number,
  seedCount: number,
  skepticismRate: number
): NodeState[] {
  const states: NodeState[] = Array(nodeCount).fill("susceptible");
  const seeds = new Set<number>();
  while (seeds.size < seedCount) {
    seeds.add(Math.floor(Math.random() * nodeCount));
  }
  seeds.forEach((i) => {
    states[i] = "infected";
  });
  for (let i = 0; i < nodeCount; i++) {
    if (states[i] === "susceptible" && Math.random() < skepticismRate * 0.3) {
      states[i] = "skeptic";
    }
  }
  return states;
}
