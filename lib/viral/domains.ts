/** Domains offered across the viral create form and the ideas board. */
export const VIRAL_DOMAINS = [
  "economics",
  "philosophy",
  "ai",
  "logic",
  "mathematics",
  "science",
  "business",
  "space",
  "markets",
  "sociology",
  "psychology",
  "biology",
] as const;

export type ViralDomain = (typeof VIRAL_DOMAINS)[number];
