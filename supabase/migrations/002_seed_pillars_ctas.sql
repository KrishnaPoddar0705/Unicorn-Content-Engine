-- Seed content pillars and CTAs (episodes seeded via scripts/seed-database.ts)

INSERT INTO content_pillars (code, name, description) VALUES
  ('A', 'Rebuilding Research Papers', 'Core Paper to Project episodes'),
  ('B', 'School vs Real Learning', 'Contrast traditional vs project-based learning'),
  ('C', 'Cool Student Research Questions', 'Student-driven curiosity'),
  ('D', 'AI Tools for Curious Students', 'Practical AI literacy'),
  ('E', 'Founder Education Takes', 'Founder-led education philosophy'),
  ('F', 'Parent Education', 'Parent-trust-building content'),
  ('G', 'Student Project Ideas', 'Actionable project starters'),
  ('H', 'Behind the Scenes of Learning', 'Process and meta content')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ctas (label, text, target_audience) VALUES
  ('Worksheet', 'Comment WORKSHEET if you want the step-by-step rebuild guide.', 'student'),
  ('Link', 'Comment LINK if you want the project template.', 'student'),
  ('Demo', 'Comment DEMO and I''ll send you the interactive version.', 'student'),
  ('Parent Guide', 'Parents: comment GUIDE for the conversation starter PDF.', 'parent'),
  ('School', 'Teachers: comment CLASSROOM for the 45-min workshop outline.', 'school');

INSERT INTO settings (llm_provider, openai_model, anthropic_model)
SELECT 'anthropic', 'gpt-4o', 'claude-opus-4-8'
WHERE NOT EXISTS (SELECT 1 FROM settings);
