import { createClient } from "@supabase/supabase-js";

/**
 * Auth helpers for API routes.
 *
 * Model: every signed-in user is an organizer. They can create events,
 * which set owner_id = their auth.users id. All per-event API routes use
 * `verifyEventOwner` to ensure the requester actually owns the event.
 *
 * `SUPER_ADMIN_EMAILS` env var is an optional escape hatch: emails in that
 * list pass `verifyEventOwner` for ANY event — useful for self-host owners
 * who want one account that sees everything. In hosted SaaS mode, leave
 * the env var unset.
 */

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type VerifyResult =
  | { authorized: true; userId: string; email: string }
  | { authorized: false; error: string; status: number };

/**
 * Verify that the request carries a valid Supabase JWT.
 * Returns the signed-in user's id + email on success.
 */
export async function verifyUser(request: Request): Promise<VerifyResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authorized: false, error: "Missing authorization header", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user || !user.email) {
    return { authorized: false, error: "Invalid or expired token", status: 401 };
  }

  return { authorized: true, userId: user.id, email: user.email };
}

/**
 * Verify the requester signed in AND owns the given event.
 * Super-admin emails (env-configured) pass for any event.
 */
export async function verifyEventOwner(
  request: Request,
  eventId: string
): Promise<VerifyResult> {
  const auth = await verifyUser(request);
  if (!auth.authorized) return auth;

  if (SUPER_ADMIN_EMAILS.includes(auth.email.toLowerCase())) {
    return auth;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("owner_id")
    .eq("id", eventId)
    .single();

  if (error || !data) {
    return { authorized: false, error: "Event not found", status: 404 };
  }
  if (data.owner_id !== auth.userId) {
    return { authorized: false, error: "You don't own this event", status: 403 };
  }
  return auth;
}

/**
 * Legacy: kept for the single-tenant /api/admins routes. Returns authorized
 * only if the signed-in user is in SUPER_ADMIN_EMAILS or the `admins` DB
 * table. New code should prefer verifyUser / verifyEventOwner instead.
 */
export async function verifySuperAdmin(
  request: Request
): Promise<
  | { authorized: true; email: string }
  | { authorized: false; error: string; status: number }
> {
  const auth = await verifyUser(request);
  if (!auth.authorized) return auth;

  if (SUPER_ADMIN_EMAILS.includes(auth.email.toLowerCase())) {
    return { authorized: true, email: auth.email };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data } = await supabaseAdmin
      .from("admins")
      .select("email")
      .eq("email", auth.email.toLowerCase())
      .single();
    if (data) return { authorized: true, email: auth.email };
  } catch {
    /* table might not exist */
  }

  return { authorized: false, error: "Super admin access required", status: 403 };
}

/**
 * Check if the signed-in user is a super admin (env-configured). Used by the
 * dashboard to show the "see all events" toggle for self-host owners.
 */
export function isSuperAdminEmail(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}
