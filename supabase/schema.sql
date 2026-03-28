-- ============================================================
-- SocialFlow — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  password_hash TEXT NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Posts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  platforms    TEXT[]  NOT NULL DEFAULT '{}',   -- e.g. ['twitter','instagram']
  hashtags     TEXT[]  NOT NULL DEFAULT '{}',
  media        JSONB   NOT NULL DEFAULT '[]',   -- [{url, type}]
  status       TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_ids JSONB,   -- {twitter: {tweet_id: "..."}, instagram: {...}}
  errors       TEXT[],
  engagement   JSONB,   -- {twitter: {likes:0, comments:0, shares:0}}
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for the scheduler polling query
CREATE INDEX IF NOT EXISTS idx_posts_scheduled
  ON posts (status, scheduled_at)
  WHERE status = 'scheduled';

-- Index for per-user listing
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);

-- ── Auto-update updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row-Level Security ─────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "users_self" ON users
  FOR ALL USING (auth.uid()::text = id::text);

-- Posts: only owner can access
CREATE POLICY "posts_owner" ON posts
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Service role bypasses RLS (backend uses service role key)
