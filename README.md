# eventOS

AI-powered matchmaking platform for in-person networking events (~100 attendees per event).

Attendees fill a verified profile form. Admin clicks a button. Every attendee gets an email with their top 5 best-fit matches, LinkedIn profiles, and (optionally) podcast episodes — all before the networking session starts.

Originally built for [Neon Fund](https://neon.fund) startup events. Open-sourced under MIT.

---

## Features

- **Per-event registration pages** with email-OTP verification gated by an invite list
- **Mutual-benefit match algorithm** scoring `looking_for` ↔ `can_offer` overlap with bonuses for diversity and reciprocal value
- **Admin dashboard** with metrics, sector breakdowns, calendar, and a trending-events feed from Luma
- **Branded match emails** sent via Brevo SMTP — supports dry runs, single-recipient tests, and confirmed batch sends
- **Role-based access**: Google OAuth with optional domain restriction; super-admins vs read-only viewers
- **Multi-event support** — run one or many events from a single instance

---

## Tech stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database / Auth**: Supabase (Postgres, REST, RLS, Google OAuth, email OTP)
- **Email**: Brevo SMTP via nodemailer
- **Spreadsheet parsing**: SheetJS (`xlsx`) for CSV + Excel guest-list uploads
- **Deploy**: Vercel (auto-deploys from `main`)

---

## Quickstart

### 1. Clone & install

```bash
git clone https://github.com/YOUR_GITHUB/eventos.git
cd eventos
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql) — creates all 8 tables, RLS policies, indexes.
3. (Optional) Run [`supabase/seed.sql`](supabase/seed.sql) to populate dummy events, guests, profiles, and matches for local testing.
4. From **Settings → API**, copy the project URL, anon key, and service role key.

### 3. Set up Google OAuth (for admin sign-in)

1. In Supabase **Authentication → Providers**, enable **Google**.
2. In **Google Cloud Console → APIs & Services → Credentials**, create an OAuth client. Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as an authorized redirect URI.
3. Paste the Google client ID + secret back into Supabase.

### 4. Set up Brevo (for sending match emails)

1. Sign up at [brevo.com](https://www.brevo.com) — free tier covers 300 emails/day.
2. Go to **SMTP & API → SMTP** and copy the login + master password.
3. Verify a sender domain or email in **Senders & IP**.
4. (Optional) In Supabase **Authentication → SMTP Settings**, plug the same Brevo credentials in so attendee OTP emails go through Brevo too.

### 5. Configure environment

```bash
cp .env.example .env.local
# then fill in the values
```

The minimum required vars are the three Supabase keys + the two Brevo SMTP creds. See [`.env.example`](.env.example) for the full list including optional admin-access controls.

### 6. Run

```bash
npm run dev -- --webpack
```

Open <http://localhost:3000>. The root page lists active events; `/admin` is the dashboard; `/event/[slug]` is the public registration form.

> **Note**: pass `--webpack` — Turbopack has compatibility issues with this project.

---

## How admin access works

Two env vars (both optional) control who can sign in:

| Var | If set | If unset |
|-----|--------|----------|
| `ALLOWED_ADMIN_DOMAIN` | only `@that-domain.com` Google accounts can sign in | any Google account can sign in |
| `SUPER_ADMIN_EMAILS` | comma-separated list of emails granted full write access | only admins added through the dashboard (in the `admins` table) get write access |

Anyone signed in but not on either list is a **viewer** — read-only access to the dashboard. Super-admins can promote others to admin from `/admin/settings` via an OTP flow.

> **Mirror these on the client.** The dashboard layout reads `NEXT_PUBLIC_ALLOWED_ADMIN_DOMAIN` and `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` for the sign-in screen and role display. Keep them in sync with the server-side vars. `.env.example` includes both pairs.

---

## Customization

### Colors

The default theme is a neutral yellow accent on near-black. To re-skin, change the four CSS variables in [`src/app/globals.css`](src/app/globals.css):

```css
--color-neon: #facc15;        /* bright accent */
--color-neon-dark: #0a0a0a;   /* dark surface + dark text */
--color-neon-bg: #ffffff;     /* page background */
--color-neon-hover: #eab308;  /* accent hover */
```

The variable names are still prefixed `neon-` for legacy reasons — the Tailwind utility classes (`bg-neon`, `text-neon-dark`, etc.) read from these tokens. Some components also use inline hex codes (`bg-[#0a0a0a]`) that you'd need to find-and-replace separately for a full re-skin.

### Logo

Replace [`public/logo.svg`](public/logo.svg). Used in the admin sidebar, sign-in screen, registration form, and waiting screen.

### Email branding

Set `EMAIL_FROM_NAME` and `EMAIL_FROM_ADDRESS` env vars — they control the From line and header text of the match email and admin-invitation OTP email.

---

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add the env vars from `.env.example` in **Settings → Environment Variables** for Production + Preview.
4. Push to `main` to deploy.

The included [`vercel.json`](vercel.json) configures a once-daily cron at 8am IST that refreshes the trending-events cache. Vercel Hobby allows one cron/day — adjust the schedule there.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                          # Landing — lists active events
│   ├── event/[slug]/page.tsx             # Public registration form
│   ├── admin/                            # Admin dashboard (Google OAuth)
│   │   ├── layout.tsx                    # Auth + header nav + role context
│   │   ├── page.tsx                      # Overview
│   │   ├── dashboard/                    # Metrics + sectors + ideas
│   │   ├── events/                       # Full events table
│   │   ├── calendar/                     # Interactive calendar
│   │   ├── trending/                     # Luma discover feed
│   │   ├── settings/                     # Manage admins (OTP)
│   │   └── event/[slug]/                 # Per-event dashboard (5 tabs)
│   └── api/                              # All server endpoints
├── components/
│   ├── EventOnboardingForm.tsx           # Registration form
│   ├── WaitingScreen.tsx                 # Post-submission screen
│   └── ChatInterface.tsx                 # Future LLM chat
├── lib/
│   ├── supabase.ts                       # Anon client
│   ├── admin-auth.ts                     # Service-role client + auth helpers
│   └── types.ts                          # Shared types
supabase/
├── schema.sql                            # Full DB schema (run once)
└── seed.sql                              # Optional dummy data
public/
└── logo.svg                              # Logo (swap for your own)
```

### Per-event admin dashboard (5 tabs)

1. **Registered** — searchable attendee table with expandable detail rows
2. **Guest List** — drag-and-drop CSV/Excel upload + inline edits
3. **Check-ins** — grouped by check-in + registration status
4. **MatchUp** — computed match results, expandable per person
5. **Email Controls** — podcast episode management + 4-step send flow (Compute → Preview → Test → Batch)

### Match algorithm

Per attendee A, B:

- A's `looking_for` ∩ B's `can_offer`: +3 per overlap
- B's `looking_for` ∩ A's `can_offer`: +3 per overlap
- Mutual benefit: +5 if both sides got something
- Category diversity: +1 per distinct category in the union
- Same company: excluded
- Returns top 5 by score per attendee

See [`src/app/api/event-compute-matches/route.ts`](src/app/api/event-compute-matches/route.ts) for the implementation.

---

## License

MIT — see [LICENSE](LICENSE).
