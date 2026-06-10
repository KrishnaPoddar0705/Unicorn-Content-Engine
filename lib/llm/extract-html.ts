export function extractHtml(text: string): string {
  if (!text?.trim()) {
    throw new Error("Empty model response");
  }

  const fenced = text.match(/```html\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const generic = text.match(/```\s*([\s\S]*?)```/);
  if (generic) {
    const inner = generic[1].trim();
    if (inner.includes("<")) return inner;
  }

  const docMatch =
    text.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i) || text.match(/(<html[\s\S]*?<\/html>)/i);
  if (docMatch) return docMatch[1].trim();

  const trimmed = text.trim();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) return trimmed;

  throw new Error("No HTML document found in model response");
}
