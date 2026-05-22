-- LinkedIn Post Generator tables
-- Run this in your Supabase SQL editor

-- Trending topics fetched daily
CREATE TABLE IF NOT EXISTS linkedin_trending_topics (
  id          UUID PRIMARY KEY,
  headline    TEXT NOT NULL,
  summary     TEXT NOT NULL,
  source_url  TEXT NOT NULL DEFAULT '',
  topic_tag   TEXT NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  picked      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_linkedin_topics_fetched ON linkedin_trending_topics (fetched_at DESC);

-- Saved drafts
CREATE TABLE IF NOT EXISTS linkedin_drafts (
  id               UUID PRIMARY KEY,
  post_content     TEXT NOT NULL,
  source_headline  TEXT NOT NULL DEFAULT '',
  source_url       TEXT NOT NULL DEFAULT '',
  reaction_text    TEXT NOT NULL DEFAULT '',
  tone             TEXT NOT NULL DEFAULT 'agreeing',
  style            TEXT NOT NULL DEFAULT 'educational',
  status           TEXT NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_linkedin_drafts_status ON linkedin_drafts (status, created_at DESC);

-- Voice configuration (single editable record)
CREATE TABLE IF NOT EXISTS linkedin_voice_config (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tone_guidelines   TEXT NOT NULL,
  do_words          TEXT[] NOT NULL DEFAULT '{}',
  dont_words        TEXT[] NOT NULL DEFAULT '{}',
  sample_posts      TEXT[] NOT NULL DEFAULT '{}',
  formatting_rules  TEXT NOT NULL DEFAULT '',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Image style suffix (single editable record)
CREATE TABLE IF NOT EXISTS linkedin_image_style (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  style_suffix TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Model configuration
CREATE TABLE IF NOT EXISTS linkedin_model_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trending    TEXT NOT NULL DEFAULT 'perplexity/sonar',
  post        TEXT NOT NULL DEFAULT 'anthropic/claude-sonnet-4-5',
  fast        TEXT NOT NULL DEFAULT 'anthropic/claude-haiku-4-5',
  image       TEXT NOT NULL DEFAULT 'google/gemini-3.1-flash-image-preview',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default voice config (Hormozi style)
INSERT INTO linkedin_voice_config (tone_guidelines, do_words, dont_words, formatting_rules)
VALUES (
  'Write like Alex Hormozi on LinkedIn. Core principles:

- Short, punchy sentences. Often single-sentence paragraphs.
- Aggressive line breaks — almost every sentence gets its own line.
- Direct, opinionated, no hedging. State things as fact even when they''re opinion.
- Hook formulas: contrarian claim, bold number, brutal truth, common mistake call-out.
- Frameworks and numbered lists for educational posts.
- Conversational, blue-collar diction. "You" and "I" everywhere. No corporate buzzwords.
- Posts often end with a one-line gut-punch summary or a CTA-style line.
- Liberal use of analogies, especially from sports, business, and everyday life.
- Zero emojis. Zero hashtag spam (1-3 max, contextual).
- Target length: 1300-1900 characters.',
  ARRAY['you', 'I', 'most people', 'here''s the thing', 'stop', 'start', 'the truth is', 'nobody talks about', 'unpopular opinion', 'let me break it down', 'real talk', 'game changer'],
  ARRAY['synergy', 'leverage', 'paradigm', 'holistic', 'ecosystem', 'disrupt', 'innovative', 'cutting-edge', 'best-in-class', 'thought leader', 'circle back', 'deep dive', 'unpack'],
  '- One sentence per line. Use line breaks aggressively.
- No bullet points with symbols. Use numbered lists or plain dashes.
- Bold claims up front. Evidence after.
- End with a gut-punch one-liner or a simple question.
- Never use emojis.
- Keep paragraphs to 1-2 sentences max.'
);

-- Seed default image style
INSERT INTO linkedin_image_style (style_suffix)
VALUES ('Clean minimalist style. Royal purple and white color palette with Poppins-style modern typography feel. Minimal composition. Conceptual, not literal. Professional, modern, suitable for LinkedIn business feed. No text in image. No people''s faces. Single focal subject.');

-- Seed default model config
INSERT INTO linkedin_model_config DEFAULT VALUES;

-- Enable RLS (matching your existing pattern)
ALTER TABLE linkedin_trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_voice_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_image_style ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_model_config ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (personal dashboard, single user)
CREATE POLICY "Allow all on linkedin_trending_topics" ON linkedin_trending_topics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on linkedin_drafts" ON linkedin_drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on linkedin_voice_config" ON linkedin_voice_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on linkedin_image_style" ON linkedin_image_style FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on linkedin_model_config" ON linkedin_model_config FOR ALL USING (true) WITH CHECK (true);
