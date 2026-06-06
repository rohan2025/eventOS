-- =============================================================================
-- eventOS — Dummy seed data
-- Run AFTER supabase/schema.sql to populate the database for local testing.
-- All emails use the @example.com domain so nothing real is referenced.
-- Safe to re-run: deletes seed rows by stable IDs before re-inserting.
--
-- Note on ownership: these demo events have owner_id = NULL. Under the
-- multi-tenant RLS policies they're invisible from the organizer dashboard
-- until claimed. To make a demo event visible to your signed-in user:
--   UPDATE events SET owner_id = 'YOUR-USER-UUID' WHERE id = '...';
-- (Run with the service role.)
-- =============================================================================

-- --- clean previous seed (idempotent) ---------------------------------------
DELETE FROM matches   WHERE event_id IN ('11111111-1111-1111-1111-111111111111',
                                         '22222222-2222-2222-2222-222222222222');
DELETE FROM profiles  WHERE event_id IN ('11111111-1111-1111-1111-111111111111',
                                         '22222222-2222-2222-2222-222222222222');
DELETE FROM luma_list WHERE event_id IN ('11111111-1111-1111-1111-111111111111',
                                         '22222222-2222-2222-2222-222222222222');
DELETE FROM events    WHERE id       IN ('11111111-1111-1111-1111-111111111111',
                                         '22222222-2222-2222-2222-222222222222');

-- --- events -----------------------------------------------------------------
INSERT INTO events (id, slug, name, event_date, location, description, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ai-founder-mixer-2026',
   'AI Founder Mixer', '2026-07-15', 'San Francisco',
   'A networking event for 100 AI/ML founders, operators, and investors.', true),
  ('22222222-2222-2222-2222-222222222222', 'climate-tech-summit-2026',
   'Climate Tech Summit', '2026-09-20', 'New York',
   'Bringing together climate-tech founders and clean-energy investors.', false);

-- --- luma_list (invited guests) ---------------------------------------------
-- Event 1: AI Founder Mixer (10 invites)
INSERT INTO luma_list (email, linkedin_url, event_id) VALUES
  ('alice@example.com',   'https://linkedin.com/in/alice-example',   '11111111-1111-1111-1111-111111111111'),
  ('bob@example.com',     'https://linkedin.com/in/bob-example',     '11111111-1111-1111-1111-111111111111'),
  ('carol@example.com',   'https://linkedin.com/in/carol-example',   '11111111-1111-1111-1111-111111111111'),
  ('dan@example.com',     'https://linkedin.com/in/dan-example',     '11111111-1111-1111-1111-111111111111'),
  ('eve@example.com',     'https://linkedin.com/in/eve-example',     '11111111-1111-1111-1111-111111111111'),
  ('frank@example.com',   'https://linkedin.com/in/frank-example',   '11111111-1111-1111-1111-111111111111'),
  ('grace@example.com',   'https://linkedin.com/in/grace-example',   '11111111-1111-1111-1111-111111111111'),
  ('henry@example.com',   'https://linkedin.com/in/henry-example',   '11111111-1111-1111-1111-111111111111'),
  ('iris@example.com',    'https://linkedin.com/in/iris-example',    '11111111-1111-1111-1111-111111111111'),
  ('jack@example.com',    'https://linkedin.com/in/jack-example',    '11111111-1111-1111-1111-111111111111');

-- Event 2: Climate Tech Summit (3 invites — still in invite phase)
INSERT INTO luma_list (email, linkedin_url, event_id) VALUES
  ('lara@example.com',    'https://linkedin.com/in/lara-example',    '22222222-2222-2222-2222-222222222222'),
  ('mike@example.com',    'https://linkedin.com/in/mike-example',    '22222222-2222-2222-2222-222222222222'),
  ('nina@example.com',    'https://linkedin.com/in/nina-example',    '22222222-2222-2222-2222-222222222222');

-- --- profiles (registered attendees for event 1) ----------------------------
INSERT INTO profiles (email, name, company, role, what_building, looking_for, can_offer, event_id) VALUES
  ('alice@example.com', 'Alice Chen', 'NeuralForge', 'CEO',
   'Open-source LLM evals platform for production AI teams.',
   ARRAY['enterprise customers', 'seed investors', 'devrel hires'],
   ARRAY['ML infra advice', 'open-source distribution playbook'],
   '11111111-1111-1111-1111-111111111111'),

  ('bob@example.com', 'Bob Patel', 'Quanta Capital', 'Partner',
   'Pre-seed and seed-stage AI infrastructure investing.',
   ARRAY['hot AI infra deals', 'technical co-founders to back'],
   ARRAY['seed checks ($250k-$2M)', 'intros to enterprise AI buyers'],
   '11111111-1111-1111-1111-111111111111'),

  ('carol@example.com', 'Carol Rivera', 'Stitchpoint', 'CTO',
   'Vector database optimized for multimodal RAG.',
   ARRAY['design partners', 'seed investors', 'rust engineers'],
   ARRAY['database internals expertise', 'open-source community building'],
   '11111111-1111-1111-1111-111111111111'),

  ('dan@example.com', 'Dan Kim', 'Loopline', 'Founder',
   'Voice agent platform for SMB customer support.',
   ARRAY['enterprise customers', 'sales hires', 'series A investors'],
   ARRAY['voice AI playbook', 'SMB GTM intros'],
   '11111111-1111-1111-1111-111111111111'),

  ('eve@example.com', 'Eve Martinez', 'Outpost VC', 'Principal',
   'Series A AI applications fund.',
   ARRAY['hot AI app deals', 'founders raising series A'],
   ARRAY['series A checks ($3M-$8M)', 'enterprise customer intros'],
   '11111111-1111-1111-1111-111111111111'),

  ('frank@example.com', 'Frank Osei', 'PromptLab', 'CEO',
   'Prompt versioning and A/B testing for AI products.',
   ARRAY['enterprise design partners', 'platform engineering hires'],
   ARRAY['prompt engineering best practices', 'developer tools GTM'],
   '11111111-1111-1111-1111-111111111111'),

  ('grace@example.com', 'Grace Liu', 'TensorRobot', 'CEO',
   'Vision-language model fine-tuning for robotics.',
   ARRAY['robotics design partners', 'ML researchers', 'seed investors'],
   ARRAY['robotics ML expertise', 'simulation infrastructure'],
   '11111111-1111-1111-1111-111111111111'),

  ('henry@example.com', 'Henry Adetola', 'Greenfield Ventures', 'GP',
   'Seed-stage applied AI and developer tools fund.',
   ARRAY['developer tools deals', 'open-source founders'],
   ARRAY['seed checks ($500k-$3M)', 'OSS community intros'],
   '11111111-1111-1111-1111-111111111111');

-- --- matches (sample computed results for Alice) ----------------------------
-- Real matches are computed at runtime by /api/event-compute-matches; this is
-- just enough sample data to render the match-view UI without running the algo.
INSERT INTO matches (profile_email, match_email, match_rank, score, linkedin_url, event_id) VALUES
  ('alice@example.com', 'bob@example.com',   1, 14, 'https://linkedin.com/in/bob-example',     '11111111-1111-1111-1111-111111111111'),
  ('alice@example.com', 'henry@example.com', 2, 12, 'https://linkedin.com/in/henry-example',   '11111111-1111-1111-1111-111111111111'),
  ('alice@example.com', 'eve@example.com',   3, 11, 'https://linkedin.com/in/eve-example',     '11111111-1111-1111-1111-111111111111'),
  ('alice@example.com', 'carol@example.com', 4,  8, 'https://linkedin.com/in/carol-example',   '11111111-1111-1111-1111-111111111111'),
  ('alice@example.com', 'frank@example.com', 5,  6, 'https://linkedin.com/in/frank-example',   '11111111-1111-1111-1111-111111111111');

-- --- event_ideas (admin brainstorming board) --------------------------------
INSERT INTO event_ideas (text, added_by) VALUES
  ('Robotics + foundation models dinner',  'admin'),
  ('Open-source maintainers happy hour',   'admin'),
  ('AI in healthcare regulatory mixer',    'admin');

-- =============================================================================
-- Done. Visit /admin and /event/ai-founder-mixer-2026 to see the seed data.
-- =============================================================================
