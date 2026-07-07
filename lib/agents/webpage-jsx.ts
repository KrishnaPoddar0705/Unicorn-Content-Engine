/**
 * Server-side validation for the React/JSX inside a generated interactive webpage.
 *
 * Every generated page renders its entire app from a single
 * `<script type="text/babel">` block that the browser compiles with
 * Babel Standalone. If the model emits even one JSX/JS syntax error, Babel
 * rejects the WHOLE block, `render()` never runs, and the page shows nothing
 * but the serve-time lead form — looking like a "lead-form-only" page when it
 * is really a silent crash.
 *
 * We catch that here before saving by parsing each babel block with the same
 * grammar the browser uses (`@babel/parser` + the `jsx` plugin). A failure
 * surfaces the exact line/column so the model can repair it.
 */
import { parse } from "@babel/parser";

// type="text/babel" is what Babel Standalone auto-compiles. Capture the opening
// tag and inner code separately so we can splice repaired code back in place.
const BABEL_SCRIPT_RE =
  /(<script\b[^>]*\btype=["']text\/babel["'][^>]*>)([\s\S]*?)(<\/script>)/gi;

export interface BabelBlock {
  /** Full original `<script ...>...</script>` text, used as the splice key. */
  full: string;
  /** Just the opening `<script ...>` tag. */
  openTag: string;
  /** The JS/JSX source the browser would compile. */
  code: string;
}

export function extractBabelBlocks(html: string): BabelBlock[] {
  const blocks: BabelBlock[] = [];
  for (const m of html.matchAll(BABEL_SCRIPT_RE)) {
    blocks.push({ full: m[0], openTag: m[1], code: m[2] });
  }
  return blocks;
}

export type JsxCheck = { ok: true } | { ok: false; error: string };

/** Parse a single babel block's source the way the browser would. */
export function validateBabelCode(code: string): JsxCheck {
  // Skip empty/whitespace-only blocks — nothing to compile, nothing to break.
  if (!code.trim()) return { ok: true };
  try {
    parse(code, {
      // Pages are classic scripts (global React/ReactDOM, no import/export).
      sourceType: "unambiguous",
      plugins: ["jsx"],
      errorRecovery: false,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

export interface WebpageJsxIssue {
  block: BabelBlock;
  error: string;
}

/** All babel blocks in the page that fail to parse. Empty array = the page renders. */
export function findWebpageJsxIssues(html: string): WebpageJsxIssue[] {
  const issues: WebpageJsxIssue[] = [];
  for (const block of extractBabelBlocks(html)) {
    const check = validateBabelCode(block.code);
    if (!check.ok) issues.push({ block, error: check.error });
  }
  return issues;
}

/** Replace one babel block's inner source, preserving its opening tag. */
export function replaceBabelBlock(html: string, block: BabelBlock, newCode: string): string {
  return html.replace(block.full, `${block.openTag}${newCode}</script>`);
}

function looksLikeCodeSnippet(text: string): boolean {
  return (
    /\b(print|for |def |import |return |if |while |class )\b/.test(text) ||
    /f"[^"]*\{/.test(text) ||
    /:\.[0-9]+f/.test(text) ||
    /^#/.test(text.trim())
  );
}

/** True when `{...}` in text is not a standalone `${jsExpr}` interpolation. */
function hasProblematicBraces(text: string): boolean {
  const withoutJsxExprs = text.replace(/\$\{[^{}]+\}/g, "");
  return /\{[^{}]+\}/.test(withoutJsxExprs);
}

/**
 * LLMs often embed Python/shell snippets in JSX text nodes, e.g.
 * `<p>print(f"Flight {n}: ${x}/kg")</p>`. JSX treats `{n}` as an expression,
 * which breaks Babel and blanks the whole page. Wrap such text in a JS string.
 */
export function autoEscapeBraceLiteralsInJsx(code: string): string {
  return code.replace(
    /(<(?:p|span|li|td|th|label|h[1-6]|code|pre|strong|em|small|dt|dd)\b[^>]*>)([^<]+?)(<\/\w+>)/g,
    (match, open: string, text: string, close: string) => {
      if (text.trimStart().startsWith("{")) return match;
      if (!looksLikeCodeSnippet(text) || !hasProblematicBraces(text)) return match;
      const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `${open}{"${escaped}"}${close}`;
    }
  );
}

/** Apply deterministic JSX fixes until the code parses or no progress is made. */
export function autoRepairBabelCode(code: string): string {
  let current = code;
  for (let i = 0; i < 8; i++) {
    if (validateBabelCode(current).ok) return current;
    const next = autoEscapeBraceLiteralsInJsx(current);
    if (next === current) break;
    current = next;
  }
  return current;
}

/** Run deterministic repairs on every babel block in the page. */
export function autoRepairWebpageJsx(html: string): string {
  let current = html;
  for (const block of extractBabelBlocks(current)) {
    const fixed = autoRepairBabelCode(block.code);
    if (fixed !== block.code) {
      current = replaceBabelBlock(current, block, fixed);
    }
  }
  return current;
}

/**
 * Strip a wrapping markdown code fence if the model added one despite being
 * told to return raw code. Leaves un-fenced input untouched.
 */
export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:[a-zA-Z]*)?\n([\s\S]*?)\n```$/);
  return (fenced ? fenced[1] : trimmed).trim();
}
