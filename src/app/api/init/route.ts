import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";
import { getSupabaseAdmin } from "@/lib/admin-auth";

/**
 * /api/init — One-tap database setup.
 *
 * GET   → reports whether the schema is already installed (used by the
 *         setup banner on /admin to decide whether to show the button).
 * POST  → runs supabase/schema.sql against the Postgres database.
 *         Guarded by an "is anything installed yet?" check: this endpoint
 *         is open while the DB is empty, then locked once tables exist.
 *         The schema itself is idempotent (CREATE TABLE IF NOT EXISTS).
 */

function getConnectionString(): string | null {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    null
  );
}

async function tablesExist(): Promise<boolean> {
  // Conservative: only report "initialized" on a clean read. Any error
  // (table missing, auth failure, network) is treated as "needs setup" so
  // the setup banner shows and the user can act on it.
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("events").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function GET() {
  const installed = await tablesExist();
  return NextResponse.json({ initialized: installed });
}

export async function POST() {
  if (await tablesExist()) {
    return NextResponse.json(
      { error: "Database already initialized." },
      { status: 409 }
    );
  }

  const connectionString = getConnectionString();
  if (!connectionString) {
    return NextResponse.json(
      {
        error:
          "Postgres connection string not found. Set POSTGRES_URL_NON_POOLING (auto-set by the Vercel + Supabase integration).",
      },
      { status: 500 }
    );
  }

  let sql: string;
  try {
    sql = readFileSync(
      join(process.cwd(), "supabase", "schema.sql"),
      "utf8"
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to load schema.sql: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  const client = new Client({
    connectionString,
    // Supabase pooler/direct both require SSL but use a self-signed cert
    // chain — disable strict verification for the connection.
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Schema install failed: ${(err as Error).message}` },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
