import {
  fitPromptForKling,
  KLING_MAX_PROMPT_CHARS,
  truncateText,
} from "@/lib/kling/prompt-limit";
import { DEFAULT_SLIDE_STYLE_PROMPT, DEFAULT_SLIDE_THEME } from "./default-style";

export interface SlideContent {
  title: string;
  subtitle: string;
  body_text: string;
  theme?: string;
  style_prompt?: string;
}

const COPY_BUDGET = 550;
const THEME_BUDGET = 200;
const SUFFIX = "9:16 vertical carousel slide.";

export function buildSlideImagePrompt(slide: SlideContent, episodeTitle?: string): string {
  const theme = slide.theme?.trim() || DEFAULT_SLIDE_THEME;
  const rawStyle = slide.style_prompt?.trim() || DEFAULT_SLIDE_STYLE_PROMPT;
  // Legacy slides may still store the old verbose default — prefer the compact style.
  const style =
    rawStyle.length > 1200 && rawStyle.includes("Aesthetic references:")
      ? DEFAULT_SLIDE_STYLE_PROMPT
      : rawStyle;

  const copyLines = [
    slide.title && `Title: "${slide.title}"`,
    slide.subtitle && `Subtitle: "${slide.subtitle}"`,
    slide.body_text && `Left text: "${slide.body_text}"`,
    episodeTitle && `Context: ${episodeTitle}`,
  ].filter(Boolean);

  const copySection =
    copyLines.length > 0
      ? truncateText(`Render as legible typography:\n${copyLines.join("\n")}`, COPY_BUDGET)
      : "";
  const themeSection = truncateText(`Theme: ${theme}`, THEME_BUDGET);

  const separators = copySection && themeSection ? 4 : 0;
  const styleBudget =
    KLING_MAX_PROMPT_CHARS -
    copySection.length -
    themeSection.length -
    SUFFIX.length -
    separators;

  const styleSection = truncateText(style, Math.max(400, styleBudget));

  const prompt = [copySection, themeSection, styleSection, SUFFIX].filter(Boolean).join("\n\n");

  return fitPromptForKling(prompt);
}
