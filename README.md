# eventOS

AI-powered matchmaking platform for in-person networking events. Attendees register, the admin clicks a button, and everyone gets an email with their top 5 best-fit matches — name, role, LinkedIn, and (optionally) a podcast episode.

Originally built for [Neon Fund](https://neon.fund). Open-source under MIT.

---

## Want to use eventOS for your event?

You have two paths:

- **Self-host it (free, full control).** Clone the repo, follow the setup below, and you're running on Vercel + Supabase + an SMTP provider for $0.
- **Want help getting it set up?** [Open an issue](https://github.com/rohan2025/eventOS/issues/new) describing your event (size, date, what you'd like the matchmaking to do) and I'll help you get it running.

There's no paid hosted version. There's no signup form. The code is the whole product — if you can deploy a Next.js app, you can run an event.

---

## Self-host quickstart

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frohan2025%2FeventOS&env=SUPER_ADMIN_EMAILS,NEXT_PUBLIC_SUPER_ADMIN_EMAILS&envDescription=Set%20both%20to%20your%20email%20address%20%E2%80%94%20that%E2%80%99s%20the%20first%20admin&envLink=https%3A%2F%2Fgithub.com%2Frohan2025%2FeventOS%2Fblob%2Fmain%2F.env.example&project-name=eventos&repository-name=eventos)

In your new Vercel project:

1. **Add the Supabase integration** — Project → Storage → "Add Marketplace Database" → Supabase. This auto-creates a Supabase project and sets `NEXT_PUBLIC_SUPABASE_URL`, the anon + service role keys, and `POSTGRES_URL_NON_POOLING`.
2. **Set up an SMTP provider for sign-in emails.** Use [Brevo](https://www.brevo.com) (free, 300 emails/day) or any provider where you can verify a sender. **Don't use a Gmail/Yahoo address as the sender** — modern DMARC policies will block delivery. Use a custom domain you own.
3. **Set `SUPER_ADMIN_EMAILS`** (and `NEXT_PUBLIC_SUPER_ADMIN_EMAILS`) to your own email address. Redeploy.
4. **Visit `https://your-project.vercel.app/admin`**. You'll see a yellow banner: **Initialize Database**. Click it — the schema runs in your Supabase project automatically.
5. **Sign in** — magic link arrives in your inbox.

You're now ready to create events and invite attendees.

---

## What you get

- **Per-event registration pages** with email-OTP verification gated by an invite list
- **Mutual-benefit match algorithm** scoring `looking_for` ↔ `can_offer` overlap with bonuses for diversity and reciprocal value
- **Admin dashboard** with metrics, sector breakdowns, calendar, and a trending-events feed from Luma
- **Branded match emails** sent via Resend — supports dry runs, single-recipient tests, and confirmed batch sends
- **Role-based access** — Magic-link sign-in (default) + optional Google OAuth; super-admins vs read-only viewers
- **Multi-event support** — run one or many events from a single instance

---

## Local development

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/eventos.git
cd eventos
npm install
cp .env.example .env.local        # fill in the values
npm run dev -- --webpack          # Turbopack has issues — use --webpack
```

Open <http://localhost:3000>. The root page lists active events; `/admin` is the dashboard; `/event/[slug]` is the public registration form.

For local dev you'll need to fill in `.env.local` by hand (no Vercel integrations). The minimum:
- 3 Supabase keys + `POSTGRES_URL_NON_POOLING` (from Supabase → Settings)
- `RESEND_API_KEY` (from resend.com/api-keys)
- `SUPER_ADMIN_EMAILS=you@yourdomain.com`

Then hit `/admin` → click **Initialize Database** → sign in.

---

## Tech stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database / Auth**: Supabase (Postgres, REST, RLS, magic-link auth)
- **Email**: Resend
- **Spreadsheet parsing**: SheetJS (`xlsx`) for CSV + Excel guest-list uploads
- **Deploy**: Vercel

---

## How admin access works

Two env vars control who's an admin (both optional but recommended):

| Var | If set | If unset |
|-----|--------|----------|
| `ALLOWED_ADMIN_DOMAIN` | only `@that-domain.com` accounts can sign in | any email can sign in (still needs magic-link verification) |
| `SUPER_ADMIN_EMAILS` | comma-separated emails granted full write access | only admins added through the dashboard get write access |

Anyone signed in but not on either list is a **viewer** — read-only access. Super-admins can invite more admins from `/admin/settings` via an OTP flow.

> **Mirror these on the client.** The dashboard UI also reads `NEXT_PUBLIC_ALLOWED_ADMIN_DOMAIN` and `NEXT_PUBLIC_SUPER_ADMIN_EMAILS`. Keep them in sync.

### Optional: Google OAuth

Magic-link sign-in is always on and requires no setup. To also offer "Sign in with Google":

1. In Supabase → Authentication → Providers → enable Google. Follow Supabase's guide to create the OAuth credentials in Google Cloud Console.
2. In your Vercel project, set `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true`.
3. Redeploy. The button appears below the magic-link form.

---

## Customization

### Colors

The default theme is yellow accent on near-black. To re-skin, edit the four CSS variables in [`src/app/globals.css`](src/app/globals.css):

```css
--color-neon: #facc15;        /* bright accent */
--color-neon-dark: #0a0a0a;   /* dark surface + dark text */
--color-neon-bg: #ffffff;     /* page background */
--color-neon-hover: #eab308;  /* accent hover */
```

The variable names are still prefixed `neon-` for legacy reasons — Tailwind utility classes (`bg-neon`, `text-neon-dark`) read from these tokens. Some components also use inline hex codes (`bg-[#0a0a0a]`) that you'd need to find-and-replace for a full re-skin.

### Logo

Replace [`public/logo.svg`](public/logo.svg). Used on the landing page, admin sidebar, and sign-in screen.

### Email branding

Set `EMAIL_FROM_NAME` and `EMAIL_FROM_ADDRESS` env vars — they control the From line on match emails and admin-invitation emails. For a custom from-domain, verify the domain in Resend first.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                          # Landing — lists active events
│   ├── event/[slug]/page.tsx             # Public registration form
│   ├── admin/                            # Admin dashboard (magic-link auth)
│   │   ├── layout.tsx                    # Auth + setup banner + header
│   │   ├── page.tsx                      # Overview
│   │   ├── dashboard/                    # Metrics + sectors + ideas
│   │   ├── events/                       # Full events table
│   │   ├── calendar/                     # Interactive calendar
│   │   ├── trending/                     # Luma discover feed
│   │   ├── settings/                     # Manage admins (OTP)
│   │   └── event/[slug]/                 # Per-event dashboard (5 tabs)
│   └── api/
│       ├── init/                         # One-tap DB setup
│       ├── events/                       # Event CRUD
│       ├── event-validate-email/         # Check email against luma_list
│       ├── event-compute-matches/        # Run match algorithm
│       ├── event-send-match-emails/      # Send match emails via Resend
│       ├── trending-events/              # Luma trending feed
│       ├── fetch-luma-event/             # Import event from Luma URL
│       └── admins/                       # Admin user management + OTP
├── components/                           # Form, waiting screen, chat
└── lib/
    ├── supabase.ts                       # Anon client
    ├── admin-auth.ts                     # Service-role client + auth helpers
    ├── email.ts                          # Resend helper
    └── types.ts                          # Shared types
supabase/
├── schema.sql                            # Full DB schema (auto-runs via /api/init)
└── seed.sql                              # Optional dummy data
public/
└── logo.svg                              # Logo (swap for your own)
```

### Per-event admin dashboard

Five tabs per event:

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

See [`src/app/api/event-compute-matches/route.ts`](src/app/api/event-compute-matches/route.ts).

---

## License

MIT — see [LICENSE](LICENSE).
