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
      className="flex shrink-0 items-center justify-center rounded-full bg-char text-cream/80 font-mono font-medium ring-1 ring-cream/10"
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
// above this one — shown on hover so the price is clear before opening
// the modal. Cheaper than aiming straight for #1: it's just enough to
// leapfrog your nearest rival, one rung of the ladder at a time.
function costToOvertake(aboveTotal, project, valueKey) {
  return Math.max(1, Math.round(aboveTotal - project[valueKey]) + 1);
}

function Ticker({ projects, valueKey }) {
  const items = [...projects].sort((a, b) => b[valueKey] - a[valueKey]);
  const line = items.map((p, i) => (
    <span key={p.id} className="inline-flex items-center gap-2 px-6">
      <span className="text-bone">#{i + 1}</span>
      <span className="font-semibold text-cream">{p.name}</span>
      {p.ticker && <span className="text-bone">{p.ticker}</span>}
      <span className="text-volt">{money(p[valueKey])}</span>
    </span>
  ));

  return (
    <div className="marquee-group overflow-hidden border-y border-cream/10 bg-char py-2 font-mono text-sm">
      <div className="marquee-track flex w-max">
        <div className="flex">{line}</div>
        <div className="flex" aria-hidden="true">
          {line}
        </div>
      </div>
    </div>
  );
}

function useCountdownToMidnightUTC() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const next = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0
        )
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

function HallOfFame({ entries }) {
  if (!entries || entries.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <h2 className="mb-6 text-lg font-bold text-bone">Hall of Fame</h2>
      <div className="space-y-3">
        {entries.map(({ date, top3 }) => (
          <div
            key={date}
            className="flex flex-wrap items-center gap-4 border-b border-cream/10 pb-3 text-sm"
          >
            <span className="w-24 shrink-0 font-mono text-bone">{date}</span>
            <div className="flex flex-wrap gap-4">
              {top3.map((p, i) => (
                <span key={p.id} className="inline-flex items-center gap-1.5">
                  <span className="text-bone">
                    {["🥇", "🥈", "🥉"][i]}
                  </span>
                  <span className="font-medium">{p.name}</span>
                  <span className="font-mono text-xs text-volt">
                    {money(p.total)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LatestActivity({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-bone">
        <span className="h-2 w-2 rounded-full bg-volt" />
        Latest activity
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded border border-cream/10 bg-char px-4 py-3 text-sm"
          >
            <div>
              <span className="font-medium">{a.projectName}</span>
              {a.ticker && (
                <span className="ml-1.5 font-mono text-xs text-bone">
                  {a.ticker}
                </span>
              )}
              <span className="ml-1.5 text-bone">bid</span>
              <span className="ml-1.5 font-mono text-volt">
                {money(a.amount)}
              </span>
            </div>
            <span className="shrink-0 text-xs text-bone">
              {timeAgo(a.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsStrip({ stats }) {
  if (!stats) return null;

  const items = [
    { label: "memecoins competing", value: stats.projectCount.toLocaleString("en-US") },
    { label: "total ever bid", value: money(stats.totalPot) },
    { label: "bids placed", value: stats.bidCount.toLocaleString("en-US") },
    { label: "biggest single bid", value: money(stats.biggestBidAmount) },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 pb-32">
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-cream/10 bg-char p-6 sm:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-mono text-xl font-bold text-volt sm:text-2xl">
              {s.value}
            </div>
            <div className="mt-1 text-xs text-bone">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-bone">
        Every one of them started at #{stats.projectCount > 0 ? "the bottom" : "1"}.{" "}
        <a href="/about" className="text-volt hover:underline">
          See why projects bid
        </a>
        .
      </p>
    </section>
  );
}

export default function Home({
  allTimeProjects,
  todayProjects,
  hallOfFame,
  recentActivity,
  stats,
}) {
  const [tab, setTab] = useState("all"); // "all" | "today"
  const [modalTarget, setModalTarget] = useState(null); // null | "new" | project
  const [modalAboveTotal, setModalAboveTotal] = useState(null);
  const countdown = useCountdownToMidnightUTC();

  const valueKey = tab === "today" ? "todayBid" : "totalBid";
  const active = tab === "today" ? todayProjects : allTimeProjects;
  const [leader, ...rest] = active;
  const totalPot = allTimeProjects.reduce((sum, p) => sum + p.totalBid, 0);

  return (
    <main className="min-h-screen bg-grid">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-volt" />
          <span className="text-lg font-bold tracking-tight">Memvoro</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="/about" className="text-sm font-medium text-bone hover:text-volt">
            About
          </a>
          <a href="/rules" className="text-sm font-medium text-bone hover:text-volt">
            Rules
          </a>
          <button
            onClick={() => { setModalTarget("new"); setModalAboveTotal(null); }}
            className="rounded border border-cream/20 px-4 py-2 text-sm font-medium text-cream/90 transition-colors hover:border-volt hover:text-volt"
          >
            List your project
          </button>
        </div>
      </header>

      {active.length > 0 && <Ticker projects={active} valueKey={valueKey} />}

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-xl">
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Outbid.
            <br />
            Take #1.
          </h1>
          <p className="mt-6 text-lg text-bone">
            One leaderboard. No votes, no vibes — the project willing to pay
            the most holds the top spot. The internet decides.
          </p>
          <div className="mt-9 flex items-center gap-6">
            <button
              onClick={() => { setModalTarget("new"); setModalAboveTotal(null); }}
              className="rounded bg-volt px-6 py-3 font-mono text-sm font-bold text-ink transition-transform hover:scale-[1.02]"
            >
              Enter the arena
            </button>
            <div>
              <div className="font-mono text-xl font-bold text-cream">
                {money(totalPot)}
              </div>
              <div className="text-xs text-bone">total pot, all-time</div>
            </div>
          </div>
        </div>

        {leader && (
          <div className="relative w-full max-w-md lg:w-96">
            <div
              className="absolute -inset-4 rounded-full bg-gold/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative rounded-xl border border-gold/40 bg-gradient-to-b from-char to-ink p-8 shadow-[0_0_60px_-15px_rgba(255,201,74,0.35)]">
              <div className="absolute -top-3 left-8 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-medium text-gold">
                <Crown className="h-3.5 w-3.5" filled />
                Currently #1{tab === "today" ? " today" : ""}
              </div>
              <ProfileLink
                project={leader}
                className="group mt-4 flex items-center gap-5 rounded -m-1 p-1 transition-colors hover:bg-cream/[0.04]"
              >
                <Logo project={leader} size={84} />
                <div>
                  <div className="text-3xl font-bold leading-tight group-hover:text-volt">
                    {leader.name}
                  </div>
                  {leader.ticker && (
                    <div className="font-mono text-sm text-bone">
                      {leader.ticker}
                    </div>
                  )}
                </div>
              </ProfileLink>
              <p className="mt-4 text-sm text-bone">{leader.description}</p>
              <div className="mt-6 flex items-end justify-between">
                <div className="font-mono text-4xl font-bold text-gold">
                  {money(leader[valueKey])}
                </div>
                <button
                  onClick={() => { setModalTarget(leader); setModalAboveTotal(leader[valueKey]); }}
                  className="text-xs font-medium text-bone underline decoration-cream/30 underline-offset-4 hover:text-volt"
                >
                  Add funds — ${costToOvertake(leader[valueKey], leader, valueKey).toLocaleString("en-US")}
                </button>
              </div>
              <div className="mt-2 text-xs text-bone">
                {leader.clicks.toLocaleString("en-US")} clicks sent
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6">
        <div className="flex rounded border border-cream/15 p-1 text-sm">
          <button
            onClick={() => setTab("all")}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              tab === "all" ? "bg-volt text-ink" : "text-bone hover:text-cream"
            }`}
          >
            All-time
          </button>
          <button
            onClick={() => setTab("today")}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              tab === "today" ? "bg-volt text-ink" : "text-bone hover:text-cream"
            }`}
          >
            Today
          </button>
        </div>
        {tab === "today" && (
          <span className="font-mono text-xs text-bone">
            resets in {countdown} UTC
          </span>
        )}
      </div>

      {/* Leaderboard */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-6">
        {active.length === 0 ? (
          <p className="border-y border-cream/10 py-10 text-center text-sm text-bone">
            No bids yet today — be the first and take #1 for as little as $1.
          </p>
        ) : (
          rest.length > 0 && (
            <ol className="divide-y divide-cream/10 border-y border-cream/10">
              {rest.map((p, i) => {
                const share = leader ? Math.max(4, (p[valueKey] / leader[valueKey]) * 100) : 0;
                const aboveTotal = i === 0 ? leader[valueKey] : rest[i - 1][valueKey];
                return (
                  <li key={p.id} className="group relative overflow-visible py-5">
                    {/* Floating "claim this rank" pill — shows on hover over the
                        whole row, positioned over the divider above it, like
                        outbid.lol's rank-claim prompt. */}
                    <button
                      onClick={() => { setModalTarget(p); setModalAboveTotal(aboveTotal); }}
                      className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-volt px-3 py-1 text-xs font-bold text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
                    >
                      claim this rank for ${costToOvertake(aboveTotal, p, valueKey).toLocaleString("en-US")}
                    </button>
                    <div
                      className="absolute inset-y-0 left-0 bg-cream/[0.03]"
                      style={{ width: `${share}%` }}
                      aria-hidden="true"
                    />
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="w-6 shrink-0 font-mono text-sm text-bone">
                          {i + 2}
                        </span>
                        <ProfileLink
                          project={p}
                          className="flex items-center gap-4 rounded -m-1 p-1 transition-colors group-hover:bg-cream/[0.04]"
                        >
                          <Logo project={p} size={56} />
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-semibold group-hover:text-volt">
                                {p.name}
                              </span>
                              {p.ticker && (
                                <span className="font-mono text-xs text-bone">
                                  {p.ticker}
                                </span>
                              )}
                            </div>
                            <p className="max-w-md text-sm text-bone">
                              {p.description}
                            </p>
                          </div>
                        </ProfileLink>
                      </div>
                      <div className="flex shrink-0 items-center gap-5">
                        <span className="hidden font-mono text-xs text-bone sm:inline">
                          {p.clicks.toLocaleString("en-US")} clicks
                        </span>
                        <span className="font-mono text-sm text-cream/90">
                          {money(p[valueKey])}
                        </span>
                        <button
                          onClick={() => { setModalTarget(p); setModalAboveTotal(aboveTotal); }}
                          className="rounded border border-cream/20 px-3 py-1.5 text-xs font-medium hover:border-volt hover:text-volt"
                        >
                          Outbid
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )
        )}
      </section>

      <HallOfFame entries={hallOfFame} />
      <LatestActivity items={recentActivity} />
      <StatsStrip stats={stats} />

      {modalTarget && (
        <BidModal
          target={modalTarget}
          aboveTotal={modalAboveTotal}
          valueField={valueKey}
          onClose={() => { setModalTarget(null); setModalAboveTotal(null); }}
        />
      )}
    </main>
  );
}
