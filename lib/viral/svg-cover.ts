/**
 * Deterministic particle-constellation cover art (16:9 SVG), seeded by slug.
 * Matches the blog's Dala-style identity: black void, bone particles,
 * plum-voltage emphasis, amber/lichen sparks. Zero external dependencies.
 */

const W = 1200;
const H = 675;

const COLORS = [
  { c: "#ffffff", w: 10 },
  { c: "#8052ff", w: 7 },
  { c: "#ffb829", w: 2 },
  { c: "#15846e", w: 2 },
];
const COLOR_POOL = COLORS.flatMap(({ c, w }) => Array(w).fill(c) as string[]);

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: number; // 0 circle, 1 triangle, 2 diamond, 3 square
  alpha: number;
}

type Archetype = (rnd: () => number, cx: number, cy: number, R: number) => Particle[];

function particle(rnd: () => number, x: number, y: number, depth: number): Particle {
  return {
    x,
    y,
    size: 2.5 + rnd() * 7 * (0.4 + depth * 0.6),
    color: COLOR_POOL[(rnd() * COLOR_POOL.length) | 0],
    shape: (rnd() * 4) | 0,
    alpha: 0.2 + depth * 0.75,
  };
}

/** Rotating orb — fibonacci sphere projection. */
const orb: Archetype = (rnd, cx, cy, R) => {
  const out: Particle[] = [];
  const N = 950;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const rot = rnd() * Math.PI * 2;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const phi = Math.acos(1 - 2 * t);
    const theta = golden * i + rot;
    const r = R * (0.8 + (rnd() - 0.5) * 0.35);
    const x3 = r * Math.sin(phi) * Math.cos(theta);
    const z3 = r * Math.sin(phi) * Math.sin(theta);
    const y3 = r * Math.cos(phi);
    const depth = (z3 / R + 1) * 0.5;
    out.push(particle(rnd, cx + x3, cy + y3 * 0.92, depth));
  }
  return out;
};

/** Logarithmic spiral galaxy. */
const spiral: Archetype = (rnd, cx, cy, R) => {
  const out: Particle[] = [];
  const arms = 2 + ((rnd() * 2) | 0);
  const N = 900;
  for (let i = 0; i < N; i++) {
    const arm = i % arms;
    const t = rnd();
    const angle = t * 4.2 * Math.PI + (arm * 2 * Math.PI) / arms;
    const radius = R * 0.12 + R * 0.95 * Math.pow(t, 0.75);
    const jitter = (rnd() - 0.5) * R * 0.16 * (1 + t);
    const x = cx + Math.cos(angle) * (radius + jitter);
    const y = cy + Math.sin(angle) * (radius + jitter) * 0.62;
    out.push(particle(rnd, x, y, 1 - t * 0.7));
  }
  return out;
};

/** Concentric pulse rings. */
const rings: Archetype = (rnd, cx, cy, R) => {
  const out: Particle[] = [];
  const ringCount = 5 + ((rnd() * 3) | 0);
  for (let ring = 0; ring < ringCount; ring++) {
    const rr = R * (0.25 + (ring / ringCount) * 1.0);
    const n = 60 + ring * 42;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.12;
      const wobble = (rnd() - 0.5) * R * 0.07;
      const x = cx + Math.cos(a) * (rr + wobble);
      const y = cy + Math.sin(a) * (rr + wobble) * 0.58;
      out.push(particle(rnd, x, y, 1 - ring / ringCount));
    }
  }
  return out;
};

/** Flowing sine wave field. */
const waves: Archetype = (rnd, cx, cy, R) => {
  const out: Particle[] = [];
  const rows = 10;
  const freq = 1.6 + rnd() * 1.6;
  const phase = rnd() * Math.PI * 2;
  for (let row = 0; row < rows; row++) {
    const n = 85;
    const baseY = cy - R * 0.7 + (row / (rows - 1)) * R * 1.4;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const x = cx - R * 1.25 + t * R * 2.5;
      const y =
        baseY +
        Math.sin(t * Math.PI * freq + phase + row * 0.7) * R * 0.22 +
        (rnd() - 0.5) * R * 0.06;
      const depth = 0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * freq + phase + row * 0.7));
      out.push(particle(rnd, x, y, depth));
    }
  }
  return out;
};

const ARCHETYPES: Archetype[] = [orb, spiral, rings, waves];

function shapeSvg(p: Particle): string {
  const x = p.x.toFixed(1);
  const y = p.y.toFixed(1);
  const s = p.size.toFixed(1);
  const a = p.alpha.toFixed(2);
  const fill = `fill="${p.color}" fill-opacity="${a}"`;
  switch (p.shape) {
    case 1: {
      const s2 = p.size;
      return `<path d="M${x} ${(p.y - s2).toFixed(1)} L${(p.x + s2 * 0.87).toFixed(1)} ${(p.y + s2 * 0.5).toFixed(1)} L${(p.x - s2 * 0.87).toFixed(1)} ${(p.y + s2 * 0.5).toFixed(1)} Z" ${fill}/>`;
    }
    case 2: {
      const s2 = p.size;
      return `<path d="M${x} ${(p.y - s2).toFixed(1)} L${(p.x + s2 * 0.7).toFixed(1)} ${y} L${x} ${(p.y + s2).toFixed(1)} L${(p.x - s2 * 0.7).toFixed(1)} ${y} Z" ${fill}/>`;
    }
    case 3:
      return `<rect x="${(p.x - p.size / 2).toFixed(1)}" y="${(p.y - p.size / 2).toFixed(1)}" width="${s}" height="${s}" ${fill}/>`;
    default:
      return `<circle cx="${x}" cy="${y}" r="${(p.size / 2).toFixed(1)}" ${fill}/>`;
  }
}

export function generateSvgCover(seedString: string): string {
  const seed = hashString(seedString);
  const rnd = mulberry32(seed);

  const archetype = ARCHETYPES[seed % ARCHETYPES.length];
  const cx = W * (0.38 + rnd() * 0.24);
  const cy = H * (0.44 + rnd() * 0.14);
  const R = H * (0.36 + rnd() * 0.12);

  const cluster = archetype(rnd, cx, cy, R);

  // Sparse drift across the whole frame
  const drift: Particle[] = [];
  for (let i = 0; i < 70; i++) {
    drift.push(particle(rnd, rnd() * W, rnd() * H, rnd() * 0.4));
  }

  // Subtle violet glow behind the cluster (radial gradient, not an "effect")
  const glowId = `g${seed % 9973}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Abstract particle artwork">
<defs><radialGradient id="${glowId}" cx="50%" cy="50%" r="50%">
<stop offset="0%" stop-color="#8052ff" stop-opacity="0.22"/>
<stop offset="100%" stop-color="#8052ff" stop-opacity="0"/>
</radialGradient></defs>
<rect width="${W}" height="${H}" fill="#000000"/>
<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${(R * 1.6).toFixed(0)}" ry="${(R * 1.1).toFixed(0)}" fill="url(#${glowId})"/>
${drift.map(shapeSvg).join("")}
${cluster.map(shapeSvg).join("")}
</svg>`;
}
