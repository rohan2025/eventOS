# Neon Fund — Startup Matchmaker — Full Repository Context

> Use this file as CLAUDE.md in a cloned repository to give full context to an AI assistant.

## What this is
AI-powered matchmaking platform for startup networking events (~100 attendees per event). Attendees fill a verified profile form → admin triggers match computation → each attendee receives an email with their top 5 best matches including LinkedIn profiles and podcast episodes.

## Tech stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database**: Supabase (Postgres + REST API + Auth + RLS)
- **Auth (attendees)**: Supabase email OTP (6-digit code)
- **Auth (admin)**: Supabase Google OAuth, restricted to @neon.fund domain
- **Email SMTP (OTP)**: Brevo via Supabase custom SMTP config
- **Email delivery (match emails)**: Brevo SMTP via nodemailer (direct)
- **Match algorithm**: Mutual benefit scoring (looking_for vs can_offer overlap)
- **Guest list parsing**: SheetJS (`xlsx` npm package) for CSV + Excel
- **Font**: Inter (Google Fonts)
- **Deploy**: Vercel (auto-deploy on push to main)
- **Cron**: Vercel cron job — once daily at 8am IST for trending events refresh

## Branding — Neon Fund color palette (LIGHT theme only)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-neon` | #e8ff79 | Primary accent, active buttons, highlights |
| `--color-neon-dark` | #1d3d0f | Text, dark buttons, borders |
| `--color-neon-bg` | #fdfff0 | Page background, card surfaces |
| `--color-neon-hover` | #d4eb65 | Hover states |
| White | #ffffff | Card backgrounds |

**Brand rules**:
- Only use these 5 colors + black + white. No red/green/blue/amber.
- `#e8ff79` is too light for chart bars/fills — use `#1d3d0f` with opacity instead.
- Text on white backgrounds: minimum opacity /40, readable text /50+.
- Opacity hierarchy: /65 body, /60 secondary, /55 labels, /50 tertiary, /45 timestamps, /40 decorative.

Logo: `public/neon-logo.png` (also `.svg`). Lime-green "N" mark.

---

## Environment variables

### Required (all environments)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
BREVO_SMTP_USER=your-brevo-smtp-login@smtp-brevo.com
BREVO_SMTP_PASS=your-brevo-smtp-password
```

### Optional
```
GROQ_API_KEY=gsk_...  (for future chat feature)
```

### Where to set them
- **Local dev**: `.env.local` file in project root
- **Vercel**: Settings → Environment Variables (all 5 required vars)

---

## Supabase database schema

### Complete SQL to create all tables from scratch
```sql
-- Events table
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

-- Guest list (invitees per event)
CREATE TABLE IF NOT EXISTS luma_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  linkedin_url text,
  checked_in boolean DEFAULT false,
  event_id uuid REFERENCES events(id),
  UNIQUE(email, event_id)
);

-- Registered attendee profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  company text NOT NULL,
  role text NOT NULL,
  what_building text,
  looking_for text[] DEFAULT '{}',
  can_offer text[] DEFAULT '{}',
  event_id uuid REFERENCES events(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(email, event_id)
);

-- Match results
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_email text NOT NULL,
  match_email text NOT NULL,
  match_rank integer NOT NULL,
  score integer NOT NULL,
  linkedin_url text,
  event_id uuid REFERENCES events(id),
  created_at timestamptz DEFAULT now()
);

-- Admin users (dynamic, beyond hardcoded list)
CREATE TABLE IF NOT EXISTS admins (
  email text PRIMARY KEY,
  added_by text,
  created_at timestamptz DEFAULT now()
);

-- Admin OTP verification
CREATE TABLE IF NOT EXISTS admin_otps (
  email text PRIMARY KEY,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  requested_by text,
  created_at timestamptz DEFAULT now()
);

-- Trending events cache (Luma discovery feed)
CREATE TABLE IF NOT EXISTS trending_events_cache (
  id text PRIMARY KEY,
  events jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Event ideas (admin brainstorming board)
CREATE TABLE IF NOT EXISTS event_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  added_by text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Supabase Auth setup
1. Enable **Google OAuth** provider in Supabase Auth settings
2. Set authorized redirect URL to `https://your-domain.com/admin`
3. Enable **Email OTP** (for attendee verification)
4. Configure Brevo as custom SMTP in Supabase Auth → SMTP settings

---

## File structure
```
src/
├── app/
│   ├── page.tsx                              # Root — routes to form or waiting screen
│   ├── layout.tsx                            # Root layout, Inter font, metadata
│   ├── globals.css                           # Tailwind theme tokens + loader animation
│   ├── event/[slug]/page.tsx                 # Public event registration form
│   ├── admin/
│   │   ├── layout.tsx                        # Admin auth (Google OAuth), header nav, role system
│   │   ├── page.tsx                          # Home — overview with all 4 sections
│   │   ├── dashboard/page.tsx                # Detailed metrics, sectors, event ideas
│   │   ├── events/page.tsx                   # Full events table with search + filter
│   │   ├── calendar/page.tsx                 # Large interactive calendar
│   │   ├── trending/page.tsx                 # Trending events (3 regions, horizontal scroll)
│   │   ├── settings/page.tsx                 # Manage admin users via OTP
│   │   └── event/[slug]/page.tsx             # Per-event dashboard (5 tabs)
│   └── api/
│       ├── events/route.ts                   # GET/POST/DELETE events (CRUD)
│       ├── event-validate-email/route.ts     # POST — check email against luma_list
│       ├── event-compute-matches/route.ts    # POST — run match algorithm for event
│       ├── event-send-match-emails/route.ts  # POST — send match emails (dry run/test/batch)
│       ├── trending-events/route.ts          # GET/POST — Luma trending feed (3 regions)
│       ├── fetch-luma-event/route.ts         # POST — import event details from Luma URL
│       ├── admins/route.ts                   # GET/DELETE — admin user management
│       ├── admins/send-otp/route.ts          # POST — send OTP for admin verification
│       ├── admins/verify-otp/route.ts        # POST — verify OTP and add admin
│       ├── validate-email/route.ts           # POST — legacy email validation
│       ├── compute-matches/route.ts          # POST — legacy match computation
│       ├── send-match-emails/route.ts        # POST — legacy email send
│       ├── send-matches/route.ts             # POST — legacy
│       ├── trigger-my-matches/route.ts       # POST — legacy
│       └── chat/route.ts                     # POST — Groq LLM chat (future use)
├── components/
│   ├── EventOnboardingForm.tsx               # Event-scoped registration form
│   ├── OnboardingForm.tsx                    # Legacy registration form
│   ├── WaitingScreen.tsx                     # Post-submission waiting screen
│   └── ChatInterface.tsx                     # Chat UI (kept for future)
├── lib/
│   ├── supabase.ts                           # Supabase client (anon key)
│   ├── admin-auth.ts                         # Supabase admin client + auth helpers
│   └── types.ts                              # TypeScript interfaces
public/
├── neon-logo.png                             # Neon Fund logo (lime "N" mark)
├── neon-logo.svg                             # SVG version
├── neon-logo-email.png                       # Logo for email templates
└── luma-logo.png                             # Luma sparkle icon (512x512)
vercel.json                                   # Cron config (daily trending refresh)
```

---

## Core architecture

### Admin auth system
- Google OAuth restricted to `@neon.fund` domain via `hd` param
- **Super admins**: hardcoded list in `admin-auth.ts` + dynamic `admins` table
- **Viewers**: any @neon.fund user who isn't a super admin (read-only)
- Bearer token pattern: client sends Supabase access token, server verifies via `getUser()`

### Admin navigation
Header: `Neon Fund / Home | Dashboard | Events | Calendar | Trending` + Settings gear + Luma link + profile

### Admin pages
- **Home** (`/admin`): Overview with all sections — metrics, events list, calendar sidebar, trending sidebar
- **Dashboard** (`/admin/dashboard`): Detailed metrics (7 stat cards with tooltips), event breakdown table, demand/supply chart, roles chart, sectors chart (auto-extracted from what_building), event ideas board
- **Events** (`/admin/events`): Full-width table with search, filter (All/Active/Closed), thumbnails
- **Calendar** (`/admin/calendar`): Large interactive calendar with event details, upcoming/past sidebars
- **Trending** (`/admin/trending`): Horizontal scroll cards per region (Bangalore, Bay Area, Singapore), refresh button
- **Event Detail** (`/admin/event/[slug]`): 5-tab layout (Registered, Guest List, Check-ins, MatchUp, Email Controls)
- **Settings** (`/admin/settings`): Manage admin users via OTP verification

### Per-event dashboard (5 tabs)
1. **Registered**: Searchable participant table, expandable rows with what_building/tags
2. **Guest List**: Drag-and-drop CSV/Excel upload, inline add/delete, registration status
3. **Check-ins**: Summary bar, grouped by check-in + registration status
4. **MatchUp**: Grouped match results, expandable per person
5. **Email Controls**: Podcast episodes management + 4-step send flow (Run MatchUp → Preview → Test → Batch Send)

### Match algorithm
- A's `looking_for` matches B's `can_offer` = 3 points per overlap
- B's `looking_for` matches A's `can_offer` = 3 points per overlap
- Mutual benefit bonus: +5 if both sides get something
- Category diversity bonus: +1 per unique category
- Same company: excluded
- Top 5 matches per person, sorted by score descending

### Match email template
- Branded HTML with Neon logo
- Top 5 matches: Name, Role at Company, can_offer tags, LinkedIn link
- Podcast section: up to 3 YouTube thumbnails (stored per event in `podcast_episodes` jsonb)
- Responsive: horizontal on desktop, stacked on mobile

### Trending events (Luma integration)
- Fetches from Luma discover API for 3 regions (Bangalore, Bay Area, Singapore)
- Filters by 35+ keywords (AI, startup, founder, VC, etc.) with word-boundary regex
- Cached in `trending_events_cache` table (20hr TTL)
- Vercel cron refreshes daily at 8am IST
- Events older than 7 days auto-filtered out

### Loading animation
- Custom CSS: `.neon-loader` — 48px gradient bar (dark green → lime) slides through a track
- Used across all admin pages for loading states

---

## Config files

### `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/trending-events",
      "schedule": "30 2 * * *"
    }
  ]
}
```
Note: Vercel Hobby plan allows only 1 cron/day. `30 2 * * *` = 8:00am IST.

### `next.config.ts`
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  serverExternalPackages: ["nodemailer"],
};
export default nextConfig;
```

### `globals.css` (theme + animations)
```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-inter);
  --color-neon: #e8ff79;
  --color-neon-dark: #1d3d0f;
  --color-neon-bg: #fdfff0;
  --color-neon-hover: #d4eb65;
}

@keyframes neon-bar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.neon-loader {
  width: 48px; height: 3px;
  background: #1d3d0f0d; border-radius: 999px;
  overflow: hidden; position: relative;
}
.neon-loader::after {
  content: ""; position: absolute; inset: 0;
  width: 60%; border-radius: 999px;
  background: linear-gradient(90deg, #1d3d0f, #e8ff79);
  animation: neon-bar 1.2s ease-in-out infinite;
}
```

---

## Key files to customize when cloning

1. **`src/lib/admin-auth.ts`** — Change `SUPER_ADMIN_EMAILS` and `ALLOWED_DOMAIN`
2. **`src/app/admin/layout.tsx`** — Change `SUPER_ADMIN_EMAILS`, `ALLOWED_DOMAIN`, and header branding
3. **`src/app/api/event-send-match-emails/route.ts`** — Email template (sender address, logo URL, branding)
4. **`public/neon-logo.png`** — Replace with your logo
5. **`src/app/globals.css`** — Theme colors
6. **`vercel.json`** — Cron schedule
7. **`.env.local`** — All environment variables

---

## Events completed
1. **Agentic Infra Event** (March 21, 2026, Bangalore) — 107 invites, 29 registrations, 27 match emails
2. **Cybersecurity AI** (May 28, 2026, Bangalore) — 99 guests, 17 registrations

---

## Development

### Run locally
```bash
npm install
# Create .env.local with all 5 env vars
npm run dev -- --webpack
# Turbopack has issues — use --webpack flag
```

### Build
```bash
npm run build
```

### Deploy
Push to main → Vercel auto-deploys.
