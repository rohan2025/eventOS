# eventOS — Full Repository Context

> Use this file as CLAUDE.md to give an AI assistant the full context of the project. The public-facing intro is [README.md](README.md); this file documents internals an AI coder needs to be effective.

## What this is

AI-powered matchmaking platform for in-person startup networking events (~100 attendees per event). Attendees fill a verified profile form → admin triggers match computation → each attendee receives an email with their top 5 best matches including LinkedIn profiles and (optionally) podcast episodes.

Originally built for Neon Fund startup events. Now open-source under MIT.

## Tech stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database**: Supabase (Postgres + REST API + Auth + RLS)
- **Auth (attendees)**: Supabase email OTP (6-digit code)
- **Auth (admin)**: Supabase Google OAuth, optionally restricted to a workspace domain via env
- **Email SMTP (OTP)**: Brevo via Supabase custom SMTP config
- **Email delivery (match emails)**: Brevo SMTP via nodemailer (direct)
- **Match algorithm**: Mutual benefit scoring (looking_for vs can_offer overlap)
- **Guest list parsing**: SheetJS (`xlsx` npm package) for CSV + Excel
- **Font**: Inter (Google Fonts)
- **Deploy**: Vercel (auto-deploy on push to main)
- **Cron**: Vercel cron job — once daily at 8am IST for trending events refresh

## Default theme

Yellow accent on near-black. The four CSS variables in `src/app/globals.css`:

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-neon` | `#facc15` | Primary accent, active buttons, highlights |
| `--color-neon-dark` | `#0a0a0a` | Dark text + dark surfaces |
| `--color-neon-bg` | `#ffffff` | Page background |
| `--color-neon-hover` | `#eab308` | Hover state for the accent |

Variable names are still prefixed `neon-` because Tailwind generates utility classes from them (`bg-neon`, `text-neon-dark`). Rename only if you're willing to sweep every component.

**Rules**:
- Stick to these four colors plus black and white.
- The bright accent on white is too low-contrast for chart fills — use `#0a0a0a` with opacity instead.
- Body opacity hierarchy: `/65` body, `/60` secondary, `/55` labels, `/50` tertiary, `/45` timestamps, `/40` decorative.

Logo: `public/logo.svg`.

---

## Environment variables

### Required

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BREVO_SMTP_USER=your-brevo-smtp-login@smtp-brevo.com
BREVO_SMTP_PASS=your-brevo-smtp-password
```

### Optional but recommended

```
EMAIL_FROM_ADDRESS=hello@yourdomain.com       # From: line on match emails
EMAIL_FROM_NAME=eventOS                       # From: display name
ALLOWED_ADMIN_DOMAIN=acme.com                 # Restrict admin sign-in to a workspace domain
SUPER_ADMIN_EMAILS=you@acme.com,co@acme.com   # Comma-separated full-access list
NEXT_PUBLIC_ALLOWED_ADMIN_DOMAIN=acme.com     # Mirror for the client (sign-in UI hints)
NEXT_PUBLIC_SUPER_ADMIN_EMAILS=you@acme.com,co@acme.com
```

### Where to set them
- **Local dev**: `.env.local` (start by copying `.env.example`)
- **Vercel**: Settings → Environment Variables

---

## Supabase database

The full schema (8 tables + RLS + indexes) is in [`supabase/schema.sql`](supabase/schema.sql) — run it once in the Supabase SQL Editor. [`supabase/seed.sql`](supabase/seed.sql) populates dummy events, guests, profiles, and matches for local testing.

Tables:

| Table | Role |
|-------|------|
| `events` | One row per event (slug, name, date, location, podcast episodes) |
| `luma_list` | Invited guests per event (email + LinkedIn); gates registration |
| `profiles` | Registered attendees who completed onboarding |
| `matches` | Computed top-N matches per attendee per event |
| `admins` | Dynamic super-admin list (managed via `/admin/settings`) |
| `admin_otps` | Short-lived OTP codes for verifying admin invites |
| `trending_events_cache` | Cached Luma discover feed by region |
| `event_ideas` | Internal brainstorming board for admins |

### Supabase Auth setup
1. Enable **Google OAuth** provider; add `https://your-domain.com/admin` as a redirect URL.
2. Enable **Email OTP** for attendee verification.
3. (Optional) Set Brevo as the custom SMTP under Auth → SMTP settings.

---

## File structure
```
src/
├── app/
│   ├── page.tsx                              # Landing — lists active events
│   ├── layout.tsx                            # Root layout, Inter font, metadata
│   ├── globals.css                           # Tailwind theme tokens + loader animation
│   ├── event/[slug]/page.tsx                 # Public event registration form
│   ├── admin/
│   │   ├── layout.tsx                        # Admin auth (Google OAuth), header nav, role system
│   │   ├── page.tsx                          # Home — overview with all 4 sections
│   │   ├── dashboard/page.tsx                # Detailed metrics, sectors, event ideas
│   │   ├── events/page.tsx                   # Full events table (search + filter)
│   │   ├── calendar/page.tsx                 # Large interactive calendar
│   │   ├── trending/page.tsx                 # Trending events (3 regions, horizontal scroll)
│   │   ├── settings/page.tsx                 # Manage admin users via OTP
│   │   └── event/[slug]/page.tsx             # Per-event dashboard (5 tabs)
│   └── api/
│       ├── events/route.ts                   # GET/POST/DELETE events
│       ├── event-validate-email/route.ts     # POST — check email against luma_list
│       ├── event-compute-matches/route.ts    # POST — run match algorithm for event
│       ├── event-send-match-emails/route.ts  # POST — send match emails (dry run/test/batch)
│       ├── trending-events/route.ts          # GET/POST — Luma trending feed
│       ├── fetch-luma-event/route.ts         # POST — import event details from Luma URL
│       ├── admins/route.ts                   # GET/POST/DELETE — admin user management
│       ├── admins/send-otp/route.ts          # POST — send OTP for admin verification
│       ├── admins/verify-otp/route.ts        # POST — verify OTP and add admin
│       └── chat/route.ts                     # POST — Groq LLM chat (future use)
├── components/
│   ├── EventOnboardingForm.tsx               # Event-scoped registration form
│   ├── WaitingScreen.tsx                     # Post-submission waiting screen
│   └── ChatInterface.tsx                     # Chat UI (kept for future)
├── lib/
│   ├── supabase.ts                           # Supabase client (anon key)
│   ├── admin-auth.ts                         # Supabase admin client + auth helpers
│   └── types.ts                              # TypeScript interfaces
public/
└── logo.svg                                  # Logo
supabase/
├── schema.sql                                # Full schema
└── seed.sql                                  # Optional dummy data
vercel.json                                   # Cron config
```

---

## Core architecture

### Admin auth
Google OAuth (optionally restricted via `hd` query param to `ALLOWED_ADMIN_DOMAIN`). Both client (`src/app/admin/layout.tsx`) and server (`src/lib/admin-auth.ts`) read the same env vars to decide role:
- **Super admin**: in `SUPER_ADMIN_EMAILS` env OR in the `admins` DB table → full write access
- **Viewer**: any signed-in user not on either list → read-only

Bearer-token pattern: client sends Supabase access token, server verifies via `auth.getUser()` then re-checks the role.

### Admin navigation
Header: `eventOS / Home | Dashboard | Events | Calendar | Trending` + Settings gear + Luma link + profile

### Admin pages
- **Home** (`/admin`): Overview with metrics, events, calendar sidebar, trending sidebar
- **Dashboard** (`/admin/dashboard`): 7 stat cards, event breakdown, demand/supply chart, roles chart, sectors chart, event ideas
- **Events** (`/admin/events`): Full-width table, search + filter, thumbnails
- **Calendar** (`/admin/calendar`): Interactive calendar with event details
- **Trending** (`/admin/trending`): Horizontal scroll cards per region
- **Event Detail** (`/admin/event/[slug]`): 5-tab layout
- **Settings** (`/admin/settings`): Manage admin users via OTP

### Per-event dashboard (5 tabs)
1. **Registered**: Searchable participant table, expandable rows with what_building/tags
2. **Guest List**: Drag-and-drop CSV/Excel upload, inline add/delete, registration status
3. **Check-ins**: Summary bar, grouped by check-in + registration status
4. **MatchUp**: Grouped match results, expandable per person
5. **Email Controls**: Podcast episodes management + 4-step send flow

### Match algorithm
- A's `looking_for` matches B's `can_offer` = 3 points per overlap
- B's `looking_for` matches A's `can_offer` = 3 points per overlap
- Mutual benefit bonus: +5 if both sides get something
- Category diversity bonus: +1 per unique category
- Same company: excluded
- Top 5 matches per person, sorted by score descending

### Match email template
- HTML with text-only branded header (sender name from `EMAIL_FROM_NAME`)
- Top 5 matches: Name, Role at Company, can_offer tags, LinkedIn link
- Podcast section: up to 3 YouTube thumbnails (stored per event in `podcast_episodes` jsonb)
- Responsive: horizontal on desktop, stacked on mobile

### Trending events (Luma)
- Fetches from Luma discover API for 3 regions (default: Bangalore, Bay Area, Singapore)
- Filters by 35+ keywords (AI, startup, founder, VC, etc.) with word-boundary regex
- Cached in `trending_events_cache` table (20hr TTL)
- Vercel cron refreshes daily at 8am IST
- Events older than 7 days auto-filtered out

### Loading animation
- `.neon-loader` class in globals.css — 48px gradient bar slides through a track
- Used across all admin pages for loading states

---

## Config files

### `vercel.json`
```json
{
  "crons": [
    { "path": "/api/trending-events", "schedule": "30 2 * * *" }
  ]
}
```
Note: Vercel Hobby allows one cron/day. `30 2 * * *` = 8:00am IST.

### `next.config.ts`
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  serverExternalPackages: ["nodemailer"],
};
export default nextConfig;
```

---

## Development

### Run locally
```bash
npm install
cp .env.example .env.local        # fill in values
# In Supabase SQL Editor, run supabase/schema.sql (and optionally seed.sql)
npm run dev -- --webpack          # Turbopack has issues — use --webpack
```

### Build
```bash
npm run build
```

### Deploy
Push to main → Vercel auto-deploys.
