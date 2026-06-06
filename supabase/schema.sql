-- =============================================================================
-- eventOS — Full Database Schema
-- Run this once in your Supabase SQL Editor to set up the database.
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS where possible.
-- =============================================================================

-- --- events -----------------------------------------------------------------
-- One row per event (e.g. "AI Founder Mixer — March 2026").
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  event_date date,
  location text,
  description text,
  image_url text,
  luma_url text,
  podcast_episodes jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- --- luma_list --------------------------------------------------------------
-- Invited guests per event (email + optional LinkedIn). Used to gate
-- the registration form: only emails on this list can register.
CREATE TABLE IF NOT EXISTS luma_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  linkedin_url text,
  checked_in boolean DEFAULT false,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE(email, event_id)
);

-- --- profiles ---------------------------------------------------------------
-- Registered attendees who completed the onboarding form.
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  company text NOT NULL,
  role text NOT NULL,
  what_building text,
  looking_for text[] DEFAULT '{}',
  can_offer text[] DEFAULT '{}',
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email, event_id)
);

-- --- matches ----------------------------------------------------------------
-- Computed match results. One row per (profile, match) pair, ranked 1..N.
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_email text NOT NULL,
  match_email text NOT NULL,
  match_rank integer NOT NULL,
  score integer NOT NULL,
  linkedin_url text,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- --- admins -----------------------------------------------------------------
-- Dynamic super-admin list (beyond SUPER_ADMIN_EMAILS env var).
-- Managed via the /admin/settings page.
CREATE TABLE IF NOT EXISTS admins (
  email text PRIMARY KEY,
  added_by text,
  created_at timestamptz DEFAULT now()
);

-- --- admin_otps -------------------------------------------------------------
-- Short-lived OTP codes for verifying new admin invitations.
CREATE TABLE IF NOT EXISTS admin_otps (
  email text PRIMARY KEY,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  requested_by text,
  created_at timestamptz DEFAULT now()
);

-- --- trending_events_cache --------------------------------------------------
-- Cached Luma "discover" feed by region, refreshed by Vercel cron.
CREATE TABLE IF NOT EXISTS trending_events_cache (
  id text PRIMARY KEY,
  events jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- --- event_ideas ------------------------------------------------------------
-- Internal brainstorming board for admins.
CREATE TABLE IF NOT EXISTS event_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  added_by text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Row-level security
-- Public reads are open; writes go through the service role from API routes.
-- =============================================================================

ALTER TABLE events                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE luma_list               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_otps              ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_events_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ideas             ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- events
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='events_read') THEN
    CREATE POLICY events_read ON events FOR SELECT USING (true);
  END IF;

  -- luma_list
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='luma_list' AND policyname='luma_list_read') THEN
    CREATE POLICY luma_list_read ON luma_list FOR SELECT USING (true);
  END IF;

  -- profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_read') THEN
    CREATE POLICY profiles_read ON profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_insert') THEN
    CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (true);
  END IF;

  -- matches
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='matches' AND policyname='matches_read') THEN
    CREATE POLICY matches_read ON matches FOR SELECT USING (true);
  END IF;

  -- trending_events_cache
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trending_events_cache' AND policyname='trending_events_cache_read') THEN
    CREATE POLICY trending_events_cache_read ON trending_events_cache FOR SELECT USING (true);
  END IF;

  -- event_ideas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_ideas' AND policyname='event_ideas_read') THEN
    CREATE POLICY event_ideas_read ON event_ideas FOR SELECT USING (true);
  END IF;
END $$;

-- --- indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS luma_list_event_id_idx ON luma_list (event_id);
CREATE INDEX IF NOT EXISTS profiles_event_id_idx  ON profiles  (event_id);
CREATE INDEX IF NOT EXISTS matches_event_id_idx   ON matches   (event_id);
CREATE INDEX IF NOT EXISTS matches_profile_email_idx ON matches (profile_email);

-- =============================================================================
-- Done. Next step: optionally run supabase/seed.sql for dummy data.
-- =============================================================================
