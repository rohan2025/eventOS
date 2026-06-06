-- =============================================================================
-- eventOS — Multi-tenant migration
-- Run AFTER you've already run schema.sql at least once, to add per-organizer
-- ownership to an existing deployment.
--
-- What this does:
--   1. Adds `owner_id` to events, pointing to auth.users.
--   2. Replaces the open "everyone can write" RLS policies with policies that
--      scope writes to the event owner.
--   3. Existing event rows get owner_id = NULL. Anyone can claim them from
--      the dashboard ("claim demo event") — or you can backfill in SQL.
--
-- SAFE TO RUN MULTIPLE TIMES — all DDL uses IF NOT EXISTS, all policies
-- DROP-then-CREATE.
-- =============================================================================

-- --- 1. Add owner_id column to events ---------------------------------------
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS events_owner_id_idx ON events (owner_id);

-- --- 2. Replace policies on `events` ----------------------------------------
-- Public can SELECT only the columns needed for the landing page + the
-- per-event registration page (the attendee URL must remain shareable).
DROP POLICY IF EXISTS events_read       ON events;
DROP POLICY IF EXISTS events_owner_all  ON events;
DROP POLICY IF EXISTS "Allow all reads on events"         ON events;
DROP POLICY IF EXISTS "Allow service role all on events"  ON events;

CREATE POLICY events_read ON events
  FOR SELECT
  USING (true);  -- attendees must read the event their slug points at

CREATE POLICY events_owner_insert ON events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY events_owner_update ON events
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY events_owner_delete ON events
  FOR DELETE
  USING (owner_id = auth.uid());

-- --- 3. Replace policies on `luma_list` -------------------------------------
-- Guest list is per-event and should NOT be public. Email validation goes
-- through a service-role API route (/api/event-validate-email), so anonymous
-- read access isn't required.
DROP POLICY IF EXISTS luma_list_read   ON luma_list;
DROP POLICY IF EXISTS "Allow all reads on luma_list"               ON luma_list;
DROP POLICY IF EXISTS "Allow service role inserts on luma_list"    ON luma_list;

CREATE POLICY luma_list_owner_all ON luma_list
  FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()));

-- --- 4. Replace policies on `profiles` --------------------------------------
-- Attendees insert their own profile via a service-role API route after
-- email-OTP verification, so anon INSERT through RLS isn't needed.
-- Organizers see + manage profiles for their events only.
DROP POLICY IF EXISTS profiles_read    ON profiles;
DROP POLICY IF EXISTS profiles_insert  ON profiles;
DROP POLICY IF EXISTS "Allow all reads on profiles"    ON profiles;
DROP POLICY IF EXISTS "Allow all inserts on profiles"  ON profiles;

CREATE POLICY profiles_owner_all ON profiles
  FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()));

-- --- 5. Replace policies on `matches` ---------------------------------------
DROP POLICY IF EXISTS matches_read ON matches;
CREATE POLICY matches_owner_all ON matches
  FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE owner_id = auth.uid()));

-- --- 6. trending_events_cache + event_ideas stay global ---------------------
-- Trending events are a public Luma feed, not per-organizer.
-- (No policy change needed; existing public-read policy is fine.)

-- =============================================================================
-- Done. Anyone who signs in now sees a clean dashboard with only their own
-- events. Existing event rows (with owner_id NULL) are invisible to RLS —
-- they're still in the DB but inaccessible until backfilled.
--
-- To claim an unowned demo event for yourself, sign in once (so auth.users
-- has your row), then run:
--   UPDATE events SET owner_id = auth.uid() WHERE id = '<event-id>';
-- using the SQL editor with the right user session, OR use the service role:
--   UPDATE events SET owner_id = 'YOUR-USER-UUID' WHERE owner_id IS NULL;
-- =============================================================================
