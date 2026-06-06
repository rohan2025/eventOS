import { createClient } from "@supabase/supabase-js";

// Config from env. Both vars are optional:
//  - If ALLOWED_ADMIN_DOMAIN is empty, any signed-in Google account can pass.
//  - If SUPER_ADMIN_EMAILS is empty, only the `admins` DB table grants
//    super-admin; all other signed-in users are read-only viewers.
const ALLOWED_DOMAIN = (process.env.ALLOWED_ADMIN_DOMAIN || "").toLowerCase().trim();
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

/**
 * Check if an email is a super admin.
 * Checks env-configured list first, then falls back to `admins` table.
 */
export async function isAdminEmail(email: string): Promise<boolean> {
  const lower = email.toLowerCase();

  if (SUPER_ADMIN_EMAILS.includes(lower)) return true;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data } = await supabaseAdmin
      .from("admins")
      .select("email")
      .eq("email", lower)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Verify the request is from an authenticated super admin.
 * Expects Authorization: Bearer <supabase_access_token> header.
 */
export async function verifySuperAdmin(request: Request): Promise<
  | { authorized: true; email: string }
  | { authorized: false; error: string; status: number }
> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authorized: false, error: "Missing authorization header", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseAdmin = getSupabaseAdmin();

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user || !user.email) {
    return { authorized: false, error: "Invalid or expired token", status: 401 };
  }

  if (ALLOWED_DOMAIN) {
    const domain = user.email.split("@")[1]?.toLowerCase();
    if (domain !== ALLOWED_DOMAIN) {
      return {
        authorized: false,
        error: `Access restricted to @${ALLOWED_DOMAIN} accounts`,
        status: 403,
      };
    }
  }

  const admin = await isAdminEmail(user.email);
  if (!admin) {
    return { authorized: false, error: "Super admin access required", status: 403 };
  }

  return { authorized: true, email: user.email };
}
