"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface EventRow {
  id: string;
  slug: string;
  name: string;
  event_date: string | null;
  location: string | null;
  description: string | null;
  is_active: boolean;
}

export default function Home() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from("events")
        .select("id, slug, name, event_date, location, description, is_active")
        .eq("is_active", true)
        .order("event_date", { ascending: true });
      setEvents((data as EventRow[]) || []);
      setLoading(false);
    }
    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neon-loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0a0a0a] tracking-tight">
            eventOS
          </h1>
          <p className="text-sm text-[#0a0a0a]/60 mt-2">
            AI-powered matchmaking for in-person networking events.
          </p>
        </header>

        {events.length === 0 ? (
          <div className="bg-[#ffffff] border border-[#0a0a0a]/10 rounded-2xl p-8 text-center">
            <p className="text-sm text-[#0a0a0a]/70">
              No active events yet.
            </p>
            <p className="text-xs text-[#0a0a0a]/50 mt-2">
              Admins can create one at{" "}
              <Link href="/admin" className="underline">
                /admin
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/event/${ev.slug}`}
                  className="block bg-[#ffffff] border border-[#0a0a0a]/10 rounded-2xl p-5 hover:border-[#0a0a0a]/30 transition-colors"
                >
                  <h2 className="text-base font-semibold text-[#0a0a0a]">
                    {ev.name}
                  </h2>
                  <p className="text-xs text-[#0a0a0a]/55 mt-1">
                    {[ev.event_date, ev.location].filter(Boolean).join(" · ")}
                  </p>
                  {ev.description && (
                    <p className="text-sm text-[#0a0a0a]/70 mt-2 line-clamp-2">
                      {ev.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-16 text-center">
          <Link
            href="/admin"
            className="text-xs text-[#0a0a0a]/40 hover:text-[#0a0a0a]/80 transition-colors"
          >
            Admin →
          </Link>
        </footer>
      </div>
    </div>
  );
}
