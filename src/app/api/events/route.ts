import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  verifyUser,
  verifyEventOwner,
  isSuperAdminEmail,
} from "@/lib/admin-auth";

/**
 * GET /api/events
 *   - Requires sign-in. Returns events owned by the signed-in user.
 *   - If the user is in SUPER_ADMIN_EMAILS, returns all events (self-host
 *     "see everything" mode).
 */
export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from("events")
    .select(
      "id, slug, name, event_date, location, is_active, image_url, luma_url, owner_id, created_at"
    )
    .order("event_date", { ascending: false });

  if (!isSuperAdminEmail(auth.email)) {
    query = query.eq("owner_id", auth.userId);
  }

  const { data: events, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ events });
}

/**
 * POST /api/events — any signed-in user can create an event they own.
 */
export async function POST(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { slug, name, event_date, location, description, image_url, luma_url } = body;

  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const insertData: Record<string, unknown> = {
    slug,
    name,
    event_date,
    location,
    owner_id: auth.userId,
  };
  if (description) insertData.description = description;
  if (image_url) insertData.image_url = image_url;
  if (luma_url) insertData.luma_url = luma_url;

  const { data, error } = await supabaseAdmin
    .from("events")
    .insert([insertData])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ event: data });
}

/**
 * DELETE /api/events — only the event owner can delete.
 */
export async function DELETE(request: Request) {
  const body = await request.json();
  const { eventId } = body;
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const auth = await verifyEventOwner(request, eventId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabaseAdmin = getSupabaseAdmin();
  // Cascading deletes are configured at the FK level (ON DELETE CASCADE on
  // profiles / matches / luma_list) — but legacy data may not have those, so
  // delete dependent rows explicitly to keep this idempotent.
  await supabaseAdmin.from("matches").delete().eq("event_id", eventId);
  await supabaseAdmin.from("profiles").delete().eq("event_id", eventId);
  await supabaseAdmin.from("luma_list").delete().eq("event_id", eventId);

  const { error } = await supabaseAdmin.from("events").delete().eq("id", eventId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
