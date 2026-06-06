# Migrating an existing deployment to multi-tenant

If you already deployed eventOS in single-tenant mode (one `SUPER_ADMIN_EMAILS` user runs everything) and want to upgrade so any signed-in user can sign up and create their own events, follow these steps.

You do **NOT** need to redeploy first — Vercel will auto-redeploy when you push, and the new code is designed to work on the old schema once the migration runs.

---

## Step 1 — back up

In Supabase → **Database → Backups** → create a manual snapshot. Takes 30 seconds. Cheap insurance.

## Step 2 — run the migration

Open the **Supabase SQL Editor** and paste the contents of [`supabase/migration-multitenant.sql`](supabase/migration-multitenant.sql). Click **Run**.

What it does:

- Adds `owner_id uuid` to the `events` table (NULL for existing rows).
- Replaces the old "anyone can write" RLS policies with owner-scoped policies.
- Existing events become **invisible to the dashboard** until claimed (see step 4).

Safe to re-run. Doesn't touch existing data.

## Step 3 — push the code + redeploy

```bash
git pull   # in case you have remote changes
git push   # Vercel auto-redeploys
```

In the new code:

- The landing page (`/`) is now a marketing page, not an events list.
- `/admin` shows the signed-in user's events only (filtered by `owner_id`).
- New events created from `/admin` automatically get `owner_id = current user`.

## Step 4 — claim your existing events (optional)

If you had real events in the old single-tenant deployment, they now have `owner_id = NULL` and are invisible from the dashboard.

To claim them under your account:

1. Sign in once at `https://your-app.vercel.app/admin` so Supabase auth registers your user (you'll get an entry in `auth.users`).
2. In Supabase **Authentication → Users**, find your row and copy the `id` UUID.
3. In **SQL Editor**, run:

   ```sql
   UPDATE events
   SET owner_id = 'YOUR-UUID-FROM-STEP-2'
   WHERE owner_id IS NULL;
   ```

4. Refresh `/admin` — your events appear, scoped to you.

If you don't want the old events, just leave them. They're inaccessible from the dashboard but still in the DB. You can also delete them via SQL:

```sql
DELETE FROM events WHERE owner_id IS NULL;
```

(`profiles`, `matches`, `luma_list` will cascade if you set up the FKs; otherwise delete them first scoped by `event_id`.)

## Step 5 — env vars: what to change

- **`SUPER_ADMIN_EMAILS`** is now optional and means "see ALL events" (an admin-of-admins for self-host owners). For the hosted version, leave it set to your own email so you can see usage. For pure SaaS where no one sees other tenants' data, unset it.
- **`ALLOWED_ADMIN_DOMAIN`** still works — restricts sign-in to a specific email domain. Leave unset if you want anyone to be able to sign up.
- **`NEXT_PUBLIC_SUPER_ADMIN_EMAILS`** can be unset (it was only used to show the "Admin" badge in the header).

No new env vars to add.

---

## What you get after migrating

- Anyone signed in can create + manage their own events
- Each organizer only sees their own data
- Your existing events stay safe (with `owner_id = NULL` until claimed)
- The marketing landing page tells visitors what eventOS is and points them to sign up
- You can see total adoption by querying Supabase: `SELECT COUNT(DISTINCT owner_id) FROM events`

## Rolling back

If something breaks, the rollback path:

```sql
-- Restore the old "everyone can write" policies
DROP POLICY IF EXISTS events_owner_insert    ON events;
DROP POLICY IF EXISTS events_owner_update    ON events;
DROP POLICY IF EXISTS events_owner_delete    ON events;
DROP POLICY IF EXISTS luma_list_owner_all    ON luma_list;
DROP POLICY IF EXISTS profiles_owner_all     ON profiles;
DROP POLICY IF EXISTS matches_owner_all      ON matches;

CREATE POLICY "Allow service role all on events"  ON events    FOR ALL USING (true);
CREATE POLICY "Allow all reads on luma_list"      ON luma_list FOR SELECT USING (true);
CREATE POLICY "Allow all reads on profiles"       ON profiles  FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on profiles"     ON profiles  FOR INSERT WITH CHECK (true);
```

The `owner_id` column can stay — it doesn't break old code.

Then redeploy the previous commit and you're back to single-tenant.
