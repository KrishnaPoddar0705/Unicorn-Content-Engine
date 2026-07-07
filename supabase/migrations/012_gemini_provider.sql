-- Add Google Gemini as an LLM provider option
ALTER TYPE llm_provider ADD VALUE IF NOT EXISTS 'gemini';

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS gemini_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash';
