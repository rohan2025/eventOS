-- =============================================================================
-- eventOS — Full Database Schema (multi-tenant)
-- Run this once in your Supabase SQL Editor to set up the database.
-- Safe to re-run: all statements use IF NOT EXISTS / DROP-and-CREATE.
--
-- Multi-tenant model: every event has an `owner_id` pointing at the
-- organizer's auth.users row. RLS scopes events / luma_list / profiles /
-- matches to the signed-in owner. Attendees never sign in to the dashboard —
-- they hit `/e/[slug]` which uses service-role API routes that explicitly
-- scope by event_id (not auth.uid()).
-- =============================================================================

-- --- events -----------------------------------------------------------------
-- One row per event. owner_id = the organizer who created it.
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
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_owner_id_idx ON events (owner_id);

-- --- luma_list --------------------------------------------------------------
-- Invited guests per event. Gates registration: only emails on this list
-- can complete the form.
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
-- Legacy: kept for backward compat with the single-tenant self-host pattern.
-- In multi-tenant mode this is unused — auth.users is the source of truth.
CREATE TABLE IF NOT EXISTS admins (
  email text PRIMARY KEY,
  added_by text,
  created_at timestamptz DEFAULT now()
);

-- --- admin_otps -------------------------------------------------------------
-- Short-lived OTP codes for the "invite an admin" flow (legacy single-tenant).
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
-- Internal brainstorming board. Global (not per-organizer) for now.
CREATE TABLE IF NOT EXISTS event_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  added_by text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Row-level security
-- =============================================================================

ALTER TABLE events                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE luma_list               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_otps              ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_events_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ideas             ENABLE ROW LEVEL SECURITY;

-- --- events: public can read; owner can write ------------------------------
DROP POLICY IF EXISTS events_read         ON events;
DROP POLICY IF EXISTS events_owner_insert ON events;
DROP POLICY IF EXISTS events_owner_update ON events;
DROP POLICY IF EXISTS events_owner_delete ON events;

CREATE POLICY events_read         ON events FOR SELECT USING (true);
CREATE POLICY events_owner_insert ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());
CREATE POLICY events_owner_update ON events FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY events_owner_delete ON events FOR DELETE USING (owner_id = auth.uid());

-- --- luma_list / profiles / matches: owner of the parent event only --------
DROP POLICY IF EXISTS luma_list_owner_all ON luma_list;
DROP POLICY IF EXISTS profiles_owner_all  ON profiles;
DROP POLICY IF EXISTS matches_owner_all   ON matches;

CREATE POLICY luma_list_owner_all ON luma_list
  FOR ALL
  USING      (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()));

CREATE POLICY profiles_owner_all ON profiles
  FOR ALL
  USING      (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()));

CREATE POLICY matches_owner_all ON matches
  FOR ALL
  USING      (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()));

-- --- trending_events_cache + event_ideas: public read -----------------------
DROP POLICY IF EXISTS trending_events_cache_read ON trending_events_cache;
DROP POLICY IF EXISTS event_ideas_read           ON event_ideas;
CREATE POLICY trending_events_cache_read ON trending_events_cache FOR SELECT USING (true);
CREATE POLICY event_ideas_read           ON event_ideas           FOR SELECT USING (true);

-- --- indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS luma_list_event_id_idx ON luma_list (event_id);
CREATE INDEX IF NOT EXISTS profiles_event_id_idx  ON profiles  (event_id);
CREATE INDEX IF NOT EXISTS matches_event_id_idx   ON matches   (event_id);
CREATE INDEX IF NOT EXISTS matches_profile_email_idx ON matches (profile_email);

-- =============================================================================
-- Done. Next step: optionally run supabase/seed.sql for dummy data.
-- =============================================================================
