import Link from "next/link";

export const metadata = {
  title: "eventOS — AI matchmaking for your event",
  description:
    "Every attendee gets a personal email with their top 5 matches before your networking session starts. Free. Set up in under 5 minutes.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0a0a0a]">
      {/* Header */}
      <header className="absolute top-0 inset-x-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="eventOS" className="w-7 h-7 rounded-md" />
            <span className="font-bold text-[15px] tracking-tight">eventOS</span>
          </div>
          <Link
            href="/admin"
            className="text-sm font-medium text-[#0a0a0a]/70 hover:text-[#0a0a0a] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#facc15]/20 text-[#0a0a0a]/80 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-[#0a0a0a] rounded-full" />
            Free for any event organizer
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
            Your attendees know
            <br />
            <span className="text-[#0a0a0a]/40">who to meet — before</span>
            <br />
            the networking starts.
          </h1>
          <p className="text-lg text-[#0a0a0a]/65 max-w-xl mx-auto mb-10 leading-relaxed">
            eventOS reads everyone&apos;s profile, scores the matches that matter, and emails each
            attendee their top 5 picks. No more random small talk. No more missed connections.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/admin"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#0a0a0a] text-[#facc15] rounded-xl text-sm font-semibold hover:bg-[#262626] transition-colors"
            >
              Set up your event — it&apos;s free
            </Link>
            <Link
              href="https://github.com/rohan2025/eventOS"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 border border-[#0a0a0a]/15 rounded-xl text-sm font-medium text-[#0a0a0a]/80 hover:bg-[#fafafa] transition-colors"
            >
              View on GitHub
            </Link>
          </div>
          <p className="mt-5 text-[11px] text-[#0a0a0a]/45">
            No credit card. Sign in with magic link. Built for events of 50–500 people.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-[#fafafa] border-y border-[#0a0a0a]/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0a0a0a]/50 text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Step
              n="1"
              title="Upload your guest list"
              body="Drop a CSV with names, emails, and LinkedIn URLs. Or import directly from a Luma event."
            />
            <Step
              n="2"
              title="Attendees fill a 60-second form"
              body="Share one link. They tell you what they're looking for and what they can offer. Email-verified, gated by your guest list."
            />
            <Step
              n="3"
              title="Click Send. Everyone gets matched."
              body="Mutual-benefit algorithm scores every pair. Each attendee receives a branded email with their top 5 matches + LinkedIn links."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
            Everything you need to run a great event
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            <Feature
              title="Smart matchmaking"
              body="Scores looking_for ↔ can_offer overlap with bonuses for mutual benefit and category diversity. Same company filter built in."
            />
            <Feature
              title="Branded emails"
              body="Match emails go out from your sender, with your event name. Optional podcast episode promo for guests to listen to while they wait."
            />
            <Feature
              title="Live attendee dashboard"
              body="See who's registered, sector breakdowns, check-in counts, demand vs. supply across categories. Updates in real time."
            />
            <Feature
              title="One link, no app downloads"
              body="Attendees register on mobile in a minute. No accounts, no apps — just a verified email and a short form."
            />
            <Feature
              title="Trending event radar"
              body="Browse upcoming AI / startup / VC events in Bangalore, Bay Area, Singapore, refreshed daily — so you know what your community's already going to."
            />
            <Feature
              title="Free, forever"
              body="MIT-licensed. Self-host or use the hosted version. No tiers, no usage caps that matter for events under 500 people."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#0a0a0a] text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Your next event deserves better intros.
          </h2>
          <p className="text-white/65 mb-8 leading-relaxed">
            Get set up in under 5 minutes. Magic-link sign in, then create your first event.
          </p>
          <Link
            href="/admin"
            className="inline-block px-8 py-3.5 bg-[#facc15] text-[#0a0a0a] rounded-xl text-sm font-semibold hover:bg-[#eab308] transition-colors"
          >
            Get started — free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#0a0a0a]/8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#0a0a0a]/50">
            © {new Date().getFullYear()} eventOS · MIT-licensed
          </p>
          <div className="flex items-center gap-5 text-xs text-[#0a0a0a]/55">
            <Link href="/admin" className="hover:text-[#0a0a0a] transition-colors">
              Sign in
            </Link>
            <a
              href="https://github.com/rohan2025/eventOS"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0a0a0a] transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-[#ffffff] rounded-2xl border border-[#0a0a0a]/10 p-6">
      <div className="w-7 h-7 rounded-full bg-[#0a0a0a] text-[#facc15] flex items-center justify-center text-xs font-bold mb-4">
        {n}
      </div>
      <h3 className="font-semibold text-[15px] text-[#0a0a0a] mb-2">{title}</h3>
      <p className="text-sm text-[#0a0a0a]/65 leading-relaxed">{body}</p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold text-[15px] text-[#0a0a0a] mb-2">{title}</h3>
      <p className="text-sm text-[#0a0a0a]/65 leading-relaxed">{body}</p>
    </div>
  );
}
