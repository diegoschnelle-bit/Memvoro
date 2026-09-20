"use client";

import { useEffect, useState } from "react";
import BidModal from "./BidModal";
import Crown from "./Crown";

function money(n) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Logo({ project, size = 56 }) {
  if (project.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={project.logoUrl}
        alt={`${project.name} logo`}
        width={size}
        height={size}
        className="shrink-0 rounded-full bg-char object-cover ring-1 ring-cream/10"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-char font-display font-bold text-cream/80 ring-1 ring-cream/10"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials(project.name)}
    </div>
  );
}

function ProfileLink({ project, children, className }) {
  const Tag = project.projectUrl ? "a" : "div";
  const linkProps = project.projectUrl
    ? { href: `/go/${project.id}`, target: "_blank", rel: "noopener noreferrer" }
    : {};
  return (
    <Tag {...linkProps} className={className}>
      {children}
    </Tag>
  );
}

// Whole-dollar minimum to move above whichever row currently sits right
// above this one. Cheaper than aiming straight for #1: it's just enough
// to leapfrog your nearest rival, one rung of the ladder at a time.
function costToOvertake(aboveTotal, project, valueKey) {
  return Math.max(1, Math.round(aboveTotal - project[valueKey]) + 1);
}

function claimLabel(aboveRank) {
  return aboveRank === 1 ? "TO #1" : `TO #${aboveRank}`;
}

function useCountdownToMidnightUTC() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const next = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
      );
      const ms = next - now;
      const h = String(Math.floor(ms / 3_600_000)).padStart(2, "0");
      const m = String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, "0");
      const s = String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0");
      setLabel(`${h}:${m}:${s}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return label;
}

// A live, data-driven ticker — every line is built from real bids, never
// invented.
function LiveTicker({ activity, stats }) {
  const items = [];

  activity.slice(0, 8).forEach((a) => {
    items.push(
      a.tookLead ? (
        <span key={a.id} className="inline-flex items-center gap-2 whitespace-nowrap px-5">
          <span>👑</span>
          <span className="font-display font-bold text-cream">{a.projectName}</span>
          <span className="text-bone">took #1</span>
          <span className="text-bone/60">{timeAgo(a.createdAt)}</span>
        </span>
      ) : (
        <span key={a.id} className="inline-flex items-center gap-2 whitespace-nowrap px-5">
          <span>🔥</span>
          <span className="font-display font-bold text-cream">{a.projectName}</span>
          <span className="text-bone">added</span>
          <span className="font-mono text-volt">{money(a.amount)}</span>
          <span className="text-bone/60">{timeAgo(a.createdAt)}</span>
        </span>
      )
    );
  });

  if (stats?.biggestBidAmount > 0) {
    items.push(
      <span key="biggest" className="inline-flex items-center gap-2 whitespace-nowrap px-5">
        <span>💰</span>
        <span className="text-bone">Biggest bid ever:</span>
        <span className="font-mono text-volt">{money(stats.biggestBidAmount)}</span>
      </span>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="marquee-group flex items-center gap-3 overflow-hidden border-y border-cream/10 bg-char py-2 text-sm">
      <span className="ml-4 flex shrink-0 items-center gap-1.5 whitespace-nowrap font-display text-xs font-bold uppercase tracking-wide text-volt">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-volt" />
        Live
      </span>
      <div className="overflow-hidden">
        <div className="marquee-track flex w-max">
          <div className="flex">{items}</div>
          <div className="flex" aria-hidden="true">{items}</div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="px-4 text-center">
      <div className="font-mono text-2xl font-bold text-volt sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-bone">{label}</div>
    </div>
  );
}

// Compact top-10 preview of a board, used in the sidebar for whichever
// tab ISN'T currently the main list.
function MiniRanking({ title, accent, projects, valueKey }) {
  return (
    <div className="rounded-xl border border-cream/10 bg-char p-4 shadow-sm">
      <div className={`mb-3 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wide ${"text-volt"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${"bg-volt"}`} />
        {title}
      </div>
      {projects.length === 0 ? (
        <p className="text-xs text-bone">Nothing yet.</p>
      ) : (
        <div className="space-y-2">
          {projects.slice(0, 10).map((p, i) => (
            <ProfileLink
              key={p.id}
              project={p}
              className="flex items-center justify-between gap-2 rounded px-1 py-1 text-sm hover:bg-cream/[0.04]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 font-mono text-xs text-bone">{i + 1}</span>
                <Logo project={p} size={22} />
                <span className="truncate">{p.name}</span>
              </span>
              <span className="shrink-0 font-mono text-xs text-volt">{money(p[valueKey])}</span>
            </ProfileLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home({
  allTimeProjects,
  todayProjects,
  hallOfFame,
  recentActivity,
  stats,
}) {
  const [tab, setTab] = useState("all"); // which board is the MAIN list: "all" | "today"
  const [modalTarget, setModalTarget] = useState(null); // null | "new" | project
  const [modalAboveTotal, setModalAboveTotal] = useState(null);
  const [claimAmount, setClaimAmount] = useState(1);
  const [claimQuery, setClaimQuery] = useState("");
  const countdown = useCountdownToMidnightUTC();

  const valueKey = tab === "today" ? "todayBid" : "totalBid";
  const active = tab === "today" ? todayProjects : allTimeProjects;
  const other = tab === "today" ? allTimeProjects : todayProjects;
  // single accent color used throughout (Claude orange)
  const [leader] = active;

  const minToClaim = leader ? leader[valueKey] + 1 : 1;

  useEffect(() => {
    setClaimAmount(minToClaim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, leader?.id, leader?.[valueKey]]);

  function openBid(target, aboveTotal) {
    setModalTarget(target);
    setModalAboveTotal(aboveTotal ?? null);
  }

  function submitClaim(e) {
    e.preventDefault();
    if (!claimQuery.trim()) return;
    setModalTarget("new");
    setModalAboveTotal(leader ? leader[valueKey] : null);
  }

  const looksLikeUrl = /^https?:\/\//i.test(claimQuery.trim());

  return (
    <main className="min-h-screen bg-ink">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-volt" />
          <span className="font-display text-lg font-bold tracking-tight">Memvoro</span>
        </div>
        <nav className="flex items-center gap-6">
          <span className="font-display text-xs font-bold uppercase tracking-wide text-volt">Battle</span>
          <a href="#hall-of-fame" className="font-display text-xs font-bold uppercase tracking-wide text-bone hover:text-cream">
            Hall of Fame
          </a>
          <a href="/rules" className="font-display text-xs font-bold uppercase tracking-wide text-bone hover:text-cream">
            How it works
          </a>
        </nav>
        <button
          onClick={() => openBid("new")}
          className="rounded bg-volt px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-ink transition-transform hover:scale-[1.02]"
        >
          List your coin →
        </button>
      </header>

      <LiveTicker activity={recentActivity} stats={stats} />

      {/* Tabs */}
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center gap-3 px-6">
        <div className="flex rounded border border-cream/15 p-1 text-sm">
          <button
            onClick={() => setTab("all")}
            className={`rounded px-4 py-1.5 font-display font-bold transition-colors ${tab === "all" ? "bg-volt text-ink" : "text-bone hover:text-cream"}`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTab("today")}
            className={`rounded px-4 py-1.5 font-display font-bold transition-colors ${tab === "today" ? "bg-volt text-ink" : "text-bone hover:text-cream"}`}
          >
            Today
          </button>
        </div>
        {tab === "today" && (
          <span className="font-mono text-xs text-bone">
            Resets every day at midnight UTC · {countdown} left
          </span>
        )}
      </div>

      {/* Claim hero */}
      <section className="mx-auto max-w-3xl px-6 py-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            {leader ? `Claim #1 for` : `Claim #1 to start for`}
          </span>
          <span className="flex items-center gap-2">
            <button
              onClick={() => setClaimAmount((a) => Math.max(minToClaim, a - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-cream/20 text-bone hover:border-volt hover:text-volt"
            >
              −
            </button>
            <span className={`font-mono text-3xl font-bold sm:text-4xl ${"text-volt"}`}>
              {money(claimAmount)}
            </span>
            <button
              onClick={() => setClaimAmount((a) => a + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-cream/20 text-bone hover:border-volt hover:text-volt"
            >
              +
            </button>
          </span>
        </div>
        <p className="mt-2 text-xs uppercase tracking-wide text-bone">
          One leaderboard · no votes · highest bid takes the throne
        </p>

        <form onSubmit={submitClaim} className="mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
          <input
            value={claimQuery}
            onChange={(e) => setClaimQuery(e.target.value)}
            placeholder="Your project name or link"
            className="w-full rounded border border-cream/20 bg-char px-4 py-3 text-sm text-cream outline-none focus:border-volt"
          />
          <button
            type="submit"
            className="shrink-0 rounded bg-volt px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink transition-transform hover:scale-[1.02]"
          >
            Claim rank
          </button>
        </form>
      </section>

      {/* Main list + sidebar */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 lg:grid-cols-[1fr_300px]">
        <div>
          {active.length === 0 ? (
            <p className="rounded-xl border border-cream/10 bg-char px-6 py-14 text-center text-sm text-bone shadow-sm">
              {tab === "today"
                ? "Nobody's bid today yet — the first one in takes #1."
                : "The leaderboard starts here — be the first name on the board."}
            </p>
          ) : (
            <div className="space-y-2">
              {active.map((p, i) => {
                const isLeader = i === 0;
                const aboveTotal = isLeader ? null : active[i - 1][valueKey];
                const aboveRank = i;
                return (
                  <div
                    key={p.id}
                    className={`group relative flex items-center justify-between gap-4 overflow-visible rounded-xl px-4 py-4 ${
                      isLeader ? "bg-volt/10 shadow-sm" : "bg-char shadow-sm"
                    }`}
                  >
                    {!isLeader && (
                      <button
                        onClick={() => openBid(p, aboveTotal)}
                        className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-volt px-3 py-1 font-display text-xs font-bold text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
                      >
                        ${costToOvertake(aboveTotal, p, valueKey)} {claimLabel(aboveRank)} ↑
                      </button>
                    )}

                    <span className="w-6 shrink-0 font-mono text-sm text-bone">{i + 1}</span>

                    <ProfileLink project={p} className="flex min-w-0 flex-1 items-center gap-3">
                      <Logo project={p} size={44} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-display text-sm font-bold">{p.name}</span>
                          {p.ticker && <span className="shrink-0 font-mono text-xs text-bone">{p.ticker}</span>}
                          {isLeader && (
                            <Crown className={`h-3.5 w-3.5 shrink-0 ${"text-volt"}`} filled />
                          )}
                        </div>
                        <p className="truncate text-xs text-bone">{p.description}</p>
                      </div>
                    </ProfileLink>

                    <div className="flex shrink-0 items-center gap-4">
                      {p.clicks > 0 && (
                        <span className="hidden font-mono text-xs text-bone sm:inline">{p.clicks} clicks</span>
                      )}
                      <span className={`font-mono text-sm font-bold ${isLeader ? "text-volt" : "text-cream"}`}>
                        {money(p[valueKey])}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <MiniRanking
            title={tab === "today" ? "All-time ranking" : "Today's ranking"}
            accent="volt"
            projects={other}
            valueKey={tab === "today" ? "totalBid" : "todayBid"}
          />
        </div>
      </section>

      {/* Live activity */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-bone">
          <span className="h-2 w-2 rounded-full bg-volt" />
          Live Activity
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-bone">Nothing yet — be the first.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentActivity.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded border border-cream/10 bg-char px-4 py-2.5 text-sm shadow-sm">
                <div className="min-w-0">
                  <span className="font-display font-semibold">{a.projectName}</span>
                  {a.tookLead ? (
                    <span className="ml-1.5 text-volt">took #1 👑</span>
                  ) : (
                    <>
                      <span className="ml-1.5 text-bone">added</span>
                      <span className="ml-1.5 font-mono text-volt">{money(a.amount)}</span>
                    </>
                  )}
                </div>
                <span className="shrink-0 font-mono text-xs text-bone">{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hall of Fame */}
      {hallOfFame && hallOfFame.length > 0 && (
        <section id="hall-of-fame" className="mx-auto max-w-6xl px-6 pb-10">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-bone">Hall of Fame</h2>
          <div className="space-y-3">
            {hallOfFame.map(({ date, top3 }) => (
              <div key={date} className="flex flex-wrap items-center gap-4 border-b border-cream/10 pb-3 text-sm">
                <span className="w-24 shrink-0 font-mono text-bone">{date}</span>
                <div className="flex flex-wrap gap-4">
                  {top3.map((p, i) => (
                    <span key={p.id} className="inline-flex items-center gap-1.5">
                      <span className="text-bone">{["🥇", "🥈", "🥉"][i]}</span>
                      <span className="font-display font-medium">{p.name}</span>
                      <span className="font-mono text-xs text-volt">{money(p.total)}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats since launch */}
      {stats && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <p className="mb-4 text-center text-sm text-bone">Some stats about Memvoro</p>
          <div className="grid grid-cols-3 gap-4 divide-x divide-cream/10 rounded-xl border border-cream/10 bg-char py-6 shadow-sm">
            <StatBox label="Projects" value={stats.projectCount.toLocaleString("en-US")} />
            <StatBox label="Total Bids" value={money(stats.totalPot)} />
            <StatBox label="Biggest Bid" value={money(stats.biggestBidAmount)} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-cream/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-volt" />
            <div>
              <div className="font-display text-sm font-bold">Memvoro</div>
              <div className="text-xs text-bone">Outbid. Take #1.</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-bone">
            <a href="/about" className="hover:text-volt">About</a>
            <a href="/rules" className="hover:text-volt">Rules</a>
          </div>
        </div>
      </footer>

      {modalTarget && (
        <BidModal
          target={modalTarget}
          aboveTotal={modalAboveTotal}
          valueField={valueKey}
          initialAmount={modalTarget === "new" ? claimAmount : undefined}
          initialName={modalTarget === "new" && !looksLikeUrl ? claimQuery.trim() : ""}
          initialProjectUrl={modalTarget === "new" && looksLikeUrl ? claimQuery.trim() : ""}
          onClose={() => openBid(null, null)}
        />
      )}
    </main>
  );
}
