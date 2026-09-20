"use client";

import { useEffect, useState } from "react";
import BidModal from "./BidModal";
import Crown from "./Crown";

function money(n) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
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
        className="shrink-0 rounded-full bg-char object-cover"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-char text-cream/80 font-mono font-medium"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials(project.name)}
    </div>
  );
}

function ClickableName({ project, children, className }) {
  if (!project.projectUrl) return <span className={className}>{children}</span>;
  return (
    <a
      href={`/go/${project.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
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
    <section className="mx-auto max-w-6xl px-6 pb-32">
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

export default function Home({ allTimeProjects, todayProjects, hallOfFame }) {
  const [tab, setTab] = useState("all"); // "all" | "today"
  const [modalTarget, setModalTarget] = useState(null); // null | "new" | project
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
        <button
          onClick={() => setModalTarget("new")}
          className="rounded border border-cream/20 px-4 py-2 text-sm font-medium text-cream/90 transition-colors hover:border-volt hover:text-volt"
        >
          List your project
        </button>
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
              onClick={() => setModalTarget("new")}
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
          <div className="relative w-full max-w-sm rounded-lg border border-gold/30 bg-char p-6 lg:w-80">
            <div className="absolute -top-3 left-6 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-medium text-gold">
              <Crown className="h-3.5 w-3.5" filled />
              Currently #1{tab === "today" ? " today" : ""}
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Logo project={leader} size={56} />
              <div>
                <ClickableName project={leader} className="text-xl font-bold hover:text-volt">
                  {leader.name}
                </ClickableName>
                {leader.ticker && (
                  <div className="font-mono text-xs text-bone">
                    {leader.ticker}
                  </div>
                )}
              </div>
            </div>
            <p className="mt-4 text-sm text-bone">{leader.description}</p>
            <div className="mt-5 flex items-end justify-between">
              <div className="font-mono text-2xl font-bold text-gold">
                {money(leader[valueKey])}
              </div>
              <button
                onClick={() => setModalTarget(leader)}
                className="text-xs font-medium text-bone underline decoration-cream/30 underline-offset-4 hover:text-volt"
              >
                Take this spot
              </button>
            </div>
            <div className="mt-2 text-xs text-bone">
              {leader.clicks.toLocaleString("en-US")} clicks sent
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
                return (
                  <li key={p.id} className="relative overflow-hidden py-5">
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
                        <Logo project={p} size={44} />
                        <div>
                          <div className="flex items-baseline gap-2">
                            <ClickableName project={p} className="font-semibold hover:text-volt">
                              {p.name}
                            </ClickableName>
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
                      </div>
                      <div className="flex shrink-0 items-center gap-5">
                        <span className="hidden font-mono text-xs text-bone sm:inline">
                          {p.clicks.toLocaleString("en-US")} clicks
                        </span>
                        <span className="font-mono text-sm text-cream/90">
                          {money(p[valueKey])}
                        </span>
                        <button
                          onClick={() => setModalTarget(p)}
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

      {modalTarget && (
        <BidModal
          target={modalTarget}
          leaderTotal={leader?.[valueKey]}
          valueField={valueKey}
          onClose={() => setModalTarget(null)}
        />
      )}
    </main>
  );
}
