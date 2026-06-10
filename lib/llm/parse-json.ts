import type { ZodSchema } from "zod";

export function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);

  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1) return text.slice(arrStart, arrEnd + 1);

  return text.trim();
}

export function parseJSON<T>(text: string, schema?: ZodSchema<T>): T {
  const raw = extractJSON(text);
  const parsed = JSON.parse(raw);
  if (schema) return schema.parse(parsed);
  return parsed as T;
}
