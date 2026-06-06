import Link from "next/link";

export const metadata = {
  title: "eventOS — AI matchmaking for in person events",
  description:
    "Drop a guest list. eventOS emails every attendee their top 5 matches before the networking starts.",
};

const REPO_URL = "https://github.com/rohan2025/eventOS";
const ISSUES_URL = "https://github.com/rohan2025/eventOS/issues/new";

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
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#0a0a0a]/70 hover:text-[#0a0a0a] transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 sm:pt-44 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0a0a0a]/45 mb-5">
            AI matchmaking for in person events
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.02] mb-6">
            Every attendee gets
            <br />
            <span className="text-[#facc15]">their top 5 matches.</span>
          </h1>
          <p className="text-lg text-[#0a0a0a]/60 max-w-lg mx-auto mb-10">
            Drop a guest list. eventOS scores every pair, then emails each person their best intros
            before the networking starts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#0a0a0a] text-[#facc15] rounded-xl text-sm font-semibold hover:bg-[#262626] transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </a>
            <a
              href={ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 border border-[#0a0a0a]/15 rounded-xl text-sm font-medium text-[#0a0a0a]/80 hover:bg-[#fafafa] transition-colors"
            >
              Want to use it? →
            </a>
          </div>
        </div>
      </section>

      {/* Product preview — styled match email */}
      <section className="px-6 pb-24">
        <div className="max-w-md mx-auto">
          <EmailPreview />
        </div>
      </section>

      {/* Three pillars */}
      <section className="border-t border-[#0a0a0a]/8 py-20 px-6 bg-[#fafafa]">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 text-center">
          <Pillar
            n="01"
            title="Upload"
            body="Drop your guest list as a CSV."
          />
          <Pillar
            n="02"
            title="Match"
            body="Score every pair. Top 5 picks per person."
          />
          <Pillar
            n="03"
            title="Send"
            body="One click. Everyone gets their intros."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[#0a0a0a]/8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#0a0a0a]/50">
            © {new Date().getFullYear()} eventOS · MIT licensed
          </p>
          <div className="flex items-center gap-5 text-xs text-[#0a0a0a]/55">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0a0a0a] transition-colors"
            >
              GitHub
            </a>
            <a
              href={ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0a0a0a] transition-colors"
            >
              Open an issue
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Pillar({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-xs font-mono text-[#0a0a0a]/40 mb-3">{n}</div>
      <h3 className="text-xl font-bold text-[#0a0a0a] mb-2">{title}</h3>
      <p className="text-sm text-[#0a0a0a]/60 leading-relaxed">{body}</p>
    </div>
  );
}

function EmailPreview() {
  return (
    <div className="bg-white rounded-2xl border border-[#0a0a0a]/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] overflow-hidden">
      {/* Email header bar */}
      <div className="bg-[#fafafa] border-b border-[#0a0a0a]/8 px-5 py-3 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[10px] text-[#0a0a0a]/45 font-mono">Inbox · today</span>
      </div>

      <div className="p-6 sm:p-7">
        <div className="text-[11px] text-[#0a0a0a]/45 mb-1">
          From <span className="text-[#0a0a0a]/70 font-medium">eventOS</span>
        </div>
        <div className="text-[15px] font-semibold text-[#0a0a0a] mb-5">
          Your top 5 matches for AI Founder Mixer
        </div>

        <div className="text-sm text-[#0a0a0a]/70 mb-5">
          Hi Sarah 👋 here&apos;s who you should find tonight:
        </div>

        <ul className="space-y-3">
          <MatchRow
            rank="1"
            name="Alex Chen"
            role="CTO at Modal"
            tag="Can offer: ML infra advice"
          />
          <MatchRow
            rank="2"
            name="Priya Rao"
            role="Partner at Quanta"
            tag="Can offer: Seed checks"
          />
          <MatchRow
            rank="3"
            name="Jordan Liu"
            role="Founder at Stitchpoint"
            tag="Can offer: GTM playbook"
          />
        </ul>

        <div className="mt-5 pt-4 border-t border-[#0a0a0a]/8 text-[11px] text-[#0a0a0a]/40 text-center">
          + 2 more matches in the full email
        </div>
      </div>
    </div>
  );
}

function MatchRow({
  rank,
  name,
  role,
  tag,
}: {
  rank: string;
  name: string;
  role: string;
  tag: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0a0a0a] text-[#facc15] flex items-center justify-center text-[11px] font-bold">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#0a0a0a]">{name}</div>
        <div className="text-xs text-[#0a0a0a]/55">{role}</div>
        <div className="mt-1.5 inline-block text-[10px] font-medium bg-[#facc15]/30 text-[#0a0a0a] px-2 py-0.5 rounded">
          {tag}
        </div>
      </div>
    </li>
  );
}
