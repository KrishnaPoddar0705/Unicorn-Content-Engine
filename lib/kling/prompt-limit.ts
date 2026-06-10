export const KLING_MAX_PROMPT_CHARS = 2500;

export function truncateText(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const ellipsis = "…";
  return `${trimmed.slice(0, Math.max(0, maxChars - ellipsis.length)).trimEnd()}${ellipsis}`;
}

export function fitPromptForKling(prompt: string, maxChars = KLING_MAX_PROMPT_CHARS): string {
  return truncateText(prompt, maxChars);
}
