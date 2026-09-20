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

// "to #1" only reads true when the row directly above really is the
// leader (i.e. this is the #2 row) — anything deeper says which rank
// it'd actually land on, so the claim is never misleading.
function claimLabel(aboveRank) {
  return aboveRank === 1 ? "TO #1" : `TO #${aboveRank}`;
}

function useDurationSince(sinceIso) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!sinceIso) {
      setLabel("");
      return;
    }
    function tick() {
      const ms = Date.now() - new Date(sinceIso).getTime();
      const totalMinutes = Math.max(0, Math.floor(ms / 60000));
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      setLabel(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [sinceIso]);

  return label;
}

function useCountdownToMidnightUTC() {
  const [parts, setParts] = useState({ h: "00", m: "00", s: "00" });

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
      setParts({
        h: String(Math.floor(ms / 3_600_000)).padStart(2, "0"),
        m: String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, "0"),
        s: String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0"),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return parts;
}

// A live, data-driven ticker — not a decoration. Every line is built from
// real bids and the real leadership timeline, never invented.
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
          <div className="flex" aria-hidden="true">
            {items}
          </div>
        </div>
      </div>
    </div>
  );
}

// Only fires on a real, current condition — never a canned message. If
// nothing qualifies right now, it renders nothing.
function BattleAlert({ leader, challenger, valueKey, recentActivity }) {
  if (!leader || !challenger) return null;

  const gap = leader[valueKey] - challenger[valueKey];
  const gapIsClose = gap > 0 && gap <= Math.max(20, leader[valueKey] * 0.15);

  const justTookLead = recentActivity?.[0]?.tookLead;
  const justTookLeadRecent =
    justTookLead &&
    Date.now() - new Date(recentActivity[0].createdAt).getTime() < 30 * 60_000;

  if (justTookLeadRecent) {
    return (
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 px-5 py-3 text-sm">
          <span className="text-lg">👑</span>
          <span>
            <span className="font-display font-bold">NEW KING —</span>{" "}
            <span className="font-display font-bold text-gold">
              {recentActivity[0].projectName}
            </span>{" "}
            just took #1.
          </span>
        </div>
      </div>
    );
  }

  if (gapIsClose) {
    return (
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-3 rounded-lg border border-riot/30 bg-riot/10 px-5 py-3 text-sm">
          <span className="text-lg">⚔️</span>
          <span>
            <span className="font-display font-bold">BATTLE ALERT —</span>{" "}
            <span className="font-display font-bold">{challenger.name}</span> is only{" "}
            <span className="font-mono text-riot">{money(gap)}</span> away from{" "}
            {leader.name}.
          </span>
        </div>
      </div>
    );
  }

  return null;
}

function StatBox({ label, value }) {
  return (
    <div className="text-center">
      <div className="font-mono text-xl font-bold text-volt sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-bone">{label}</div>
    </div>
  );
}

export default function Home({
  allTimeProjects,
  todayProjects,
  hallOfFame,
  recentActivity,
  stats,
  throneSince,
}) {
  const [tab, setTab] = useState("today"); // "today" | "all"
  const [modalTarget, setModalTarget] = useState(null); // null | "new" | project
  const [modalAboveTotal, setModalAboveTotal] = useState(null);
  const countdown = useCountdownToMidnightUTC();

  const valueKey = tab === "today" ? "todayBid" : "totalBid";
  const active = tab === "today" ? todayProjects : allTimeProjects;
  const [leader, ...rest] = active;
  const accent = tab === "today" ? "riot" : "gold";
  const kingSince = tab === "today" ? throneSince?.today : throneSince?.all;
  const kingFor = useDurationSince(kingSince);
  const [yesterday, ...olderFame] = hallOfFame || [];

  function openBid(target, aboveTotal) {
    setModalTarget(target);
    setModalAboveTotal(aboveTotal ?? null);
  }

  return (
    <main className="min-h-screen bg-grid">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-volt" />
          <span className="font-display text-lg font-bold tracking-tight">Memvoro</span>
        </div>
        <nav className="flex items-center gap-6">
          <span className="font-display text-xs font-bold uppercase tracking-wide text-volt">
            Battle
          </span>
          <a
            href="#hall-of-fame"
            className="font-display text-xs font-bold uppercase tracking-wide text-bone hover:text-cream"
          >
            Hall of Fame
          </a>
          <a
            href="/rules"
            className="font-display text-xs font-bold uppercase tracking-wide text-bone hover:text-cream"
          >
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

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="max-w-xl">
          <div className="font-display text-xs font-bold uppercase tracking-widest text-bone">
            The memecoin bidding war.
          </div>
          <h1 className="mt-2 font-display text-6xl font-bold uppercase leading-[0.95] tracking-tighter sm:text-7xl">
            <span className="text-cream">Outbid.</span>
            <br />
            <span className="text-volt">Take #1.</span>
          </h1>
          <p className="mt-6 text-lg text-bone">
            Memecoins compete for attention. Highest bid takes the throne.
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-wide text-bone/60">
            Paid promotional ranking · not investment advice
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => openBid("new")}
              className="rounded bg-volt px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink transition-transform hover:scale-[1.02]"
            >
              Take the throne →
            </button>
            <a
              href="/rules"
              className="rounded border border-cream/20 px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream hover:border-volt hover:text-volt"
            >
              How it works
            </a>
          </div>
        </div>

        {/* Sidebar: countdown + current king */}
        <div className="space-y-4">
          {tab === "today" && (
            <div className="rounded-xl border border-cream/10 bg-char p-5 text-center">
              <div className="font-display text-xs font-bold uppercase tracking-wide text-bone">
                Today's battle ends in
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 font-mono text-3xl font-bold text-volt">
                <span>{countdown.h}</span>:<span>{countdown.m}</span>:<span>{countdown.s}</span>
              </div>
              <div className="mt-1 flex justify-center gap-8 text-[10px] uppercase tracking-wide text-bone">
                <span>Hours</span>
                <span>Minutes</span>
                <span>Seconds</span>
              </div>
            </div>
          )}

          {leader ? (
            <div
              className={`rounded-xl border p-5 ${
                accent === "riot" ? "border-riot/40 bg-riot/5" : "border-gold/40 bg-gold/5"
              }`}
            >
              <div
                className={`flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wide ${
                  accent === "riot" ? "text-riot" : "text-gold"
                }`}
              >
                <Crown className="h-3.5 w-3.5" filled />
                Current King
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className={`font-display text-2xl font-bold ${accent === "riot" ? "text-riot" : "text-gold"}`}>
                  #1
                </span>
                <Logo project={leader} size={48} />
                <div>
                  <ProfileLink project={leader} className="font-display font-bold hover:text-volt">
                    {leader.name}
                  </ProfileLink>
                  {leader.ticker && (
                    <div className="font-mono text-xs text-bone">{leader.ticker}</div>
                  )}
                </div>
              </div>
              <div className={`mt-4 font-mono text-3xl font-bold ${accent === "riot" ? "text-riot" : "text-gold"}`}>
                {money(leader[valueKey])}
              </div>
              {kingFor && (
                <div className="mt-1 text-xs text-bone">King for {kingFor}</div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-cream/10 pt-3 text-center">
                <div>
                  <div className="font-mono text-sm font-bold">{active.length}</div>
                  <div className="text-[10px] uppercase tracking-wide text-bone">
                    {tab === "today" ? "in the battle" : "projects"}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-sm font-bold">{money(leader[valueKey])}</div>
                  <div className="text-[10px] uppercase tracking-wide text-bone">highest bid</div>
                </div>
                <div>
                  <button
                    onClick={() => openBid(leader, leader[valueKey])}
                    className="font-mono text-xs text-bone underline decoration-cream/30 underline-offset-4 hover:text-volt"
                  >
                    +${costToOvertake(leader[valueKey], leader, valueKey)}
                  </button>
                  <div className="text-[10px] uppercase tracking-wide text-bone">add funds</div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`flex flex-col items-center rounded-xl border border-dashed p-6 text-center ${
                accent === "riot" ? "border-riot/30" : "border-gold/30"
              }`}
            >
              <Crown className={`h-10 w-10 ${accent === "riot" ? "text-riot/40" : "text-gold/40"}`} />
              <div className="mt-3 font-display text-lg font-bold">The throne is empty</div>
              <p className="mt-1 text-sm text-bone">First bid takes #1.</p>
              <button
                onClick={() => openBid("new")}
                className={`mt-4 rounded px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide transition-transform hover:scale-[1.02] ${
                  accent === "riot" ? "bg-riot text-cream" : "bg-gold text-ink"
                }`}
              >
                Take #1 for $1
              </button>
            </div>
          )}
        </div>
      </section>

      <BattleAlert leader={leader} challenger={rest[0]} valueKey={valueKey} recentActivity={recentActivity} />

      {/* Tabs */}
      <div className="mx-auto mt-8 flex max-w-6xl gap-2 px-6">
        <button
          onClick={() => setTab("today")}
          className={`rounded px-4 py-2 font-display text-xs font-bold uppercase tracking-wide transition-colors ${
            tab === "today" ? "bg-riot text-cream" : "border border-cream/15 text-bone hover:text-cream"
          }`}
        >
          Live Battle
        </button>
        <button
          onClick={() => setTab("all")}
          className={`rounded px-4 py-2 font-display text-xs font-bold uppercase tracking-wide transition-colors ${
            tab === "all" ? "bg-gold text-ink" : "border border-cream/15 text-bone hover:text-cream"
          }`}
        >
          All-Time
        </button>
      </div>

      {/* Leaderboard table */}
      <section className="mx-auto max-w-6xl px-6 py-6">
        {active.length === 0 ? (
          <p className="border-y border-cream/10 py-10 text-center text-sm text-bone">
            {tab === "today"
              ? "Today's board resets at midnight UTC — the first bid of the day takes #1."
              : "The leaderboard starts here."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[40px_2fr_2fr_1fr_110px] gap-4 border-b border-cream/10 px-2 pb-3 text-xs uppercase tracking-wide text-bone">
                <span>#</span>
                <span>Project</span>
                <span>Promotional spend</span>
                <span>To next</span>
                <span className="text-right">Action</span>
              </div>

              {active.map((p, i) => {
                const isLeader = i === 0;
                const aboveTotal = isLeader ? null : i === 1 ? leader[valueKey] : rest[i - 2][valueKey];
                const aboveRank = i; // rank of the row directly above this one
                const share = leader ? Math.max(4, (p[valueKey] / leader[valueKey]) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className={`grid grid-cols-[40px_2fr_2fr_1fr_110px] items-center gap-4 rounded px-2 py-4 ${
                      isLeader
                        ? accent === "riot"
                          ? "bg-riot/10"
                          : "bg-gold/10"
                        : "border-b border-cream/5"
                    }`}
                  >
                    <span className="font-mono text-sm text-bone">{i + 1}</span>

                    <ProfileLink
                      project={p}
                      className="flex items-center gap-3 rounded -m-1 p-1 transition-colors hover:bg-cream/[0.04]"
                    >
                      <Logo project={p} size={40} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-display text-sm font-bold">{p.name}</span>
                          {isLeader && <Crown className={`h-3.5 w-3.5 shrink-0 ${accent === "riot" ? "text-riot" : "text-gold"}`} filled />}
                        </div>
                        {p.ticker && <div className="font-mono text-xs text-bone">{p.ticker}</div>}
                      </div>
                    </ProfileLink>

                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-cream/10">
                        <div
                          className={`h-full rounded-full ${isLeader ? (accent === "riot" ? "bg-riot" : "bg-gold") : "bg-cream/40"}`}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-sm">{money(p[valueKey])}</span>
                    </div>

                    <div className="font-mono text-xs">
                      {isLeader ? (
                        <span className="text-bone">—</span>
                      ) : (
                        <span className={accent === "riot" ? "text-riot" : "text-gold"}>
                          ${costToOvertake(aboveTotal, p, valueKey)} {claimLabel(aboveRank)} ↑
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {isLeader ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-wide ${
                            accent === "riot" ? "border-riot/40 text-riot" : "border-gold/40 text-gold"
                          }`}
                        >
                          <Crown className="h-3 w-3" filled />
                          King
                        </span>
                      ) : (
                        <button
                          onClick={() => openBid(p, aboveTotal)}
                          className="rounded border border-cream/20 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wide hover:border-volt hover:text-volt"
                        >
                          Outbid
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Bottom: activity, promo, hall of fame + stats */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1.3fr_1fr_1fr]">
        {/* Live activity */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-bone">
            <span className="h-2 w-2 rounded-full bg-volt" />
            Live Activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-bone">Nothing yet — be the first.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded border border-cream/10 bg-char px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="font-display font-semibold">{a.projectName}</span>
                    {a.tookLead ? (
                      <span className="ml-1.5 text-gold">took #1 👑</span>
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
        </div>

        {/* Promo banner */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-cream/10 bg-gradient-to-b from-char to-ink p-8 text-center">
          <Crown className="h-10 w-10 text-volt" filled />
          <div className="mt-4 font-display text-2xl font-bold uppercase leading-tight">
            Memes compete.
            <br />
            <span className="text-volt">Legends remain.</span>
          </div>
          <p className="mt-3 text-sm text-bone">Get your coin on the leaderboard.</p>
          <button
            onClick={() => openBid("new")}
            className="mt-5 rounded bg-volt px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink transition-transform hover:scale-[1.02]"
          >
            List your coin →
          </button>
        </div>

        {/* Yesterday's king + stats */}
        <div className="space-y-6">
          {yesterday?.top3?.[0] && (
            <div className="rounded-xl border border-gold/30 bg-char p-5">
              <div className="font-display text-xs font-bold uppercase tracking-wide text-gold">
                Yesterday's King
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Logo project={yesterday.top3[0]} size={44} />
                <div>
                  <div className="font-display font-bold">{yesterday.top3[0].name}</div>
                  <div className="font-mono text-sm font-bold text-gold">
                    {money(yesterday.top3[0].total)}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-bone">
                {yesterday.projectsCount} project{yesterday.projectsCount === 1 ? "" : "s"} ·{" "}
                {yesterday.bidsCount} bid{yesterday.bidsCount === 1 ? "" : "s"}
                {yesterday.wonBy != null && <> · won by {money(yesterday.wonBy)}</>}
              </div>
              <a href="#hall-of-fame" className="mt-3 inline-block text-xs text-bone hover:text-volt">
                View battle →
              </a>
            </div>
          )}

          {stats && (
            <div className="rounded-xl border border-cream/10 bg-char p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-xs font-bold uppercase tracking-wide text-bone">
                  Stats (all-time)
                </span>
                <a href="/about" className="text-xs text-bone hover:text-volt">
                  View all →
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="projects" value={stats.projectCount.toLocaleString("en-US")} />
                <StatBox label="total bids" value={money(stats.totalPot)} />
                <StatBox label="bids placed" value={stats.bidCount.toLocaleString("en-US")} />
                <StatBox label="biggest bid" value={money(stats.biggestBidAmount)} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Hall of Fame (fuller history) */}
      {olderFame.length > 0 && (
        <section id="hall-of-fame" className="mx-auto max-w-6xl px-6 pb-16 pt-4">
          <h2 className="mb-6 font-display text-lg font-bold text-bone">Hall of Fame</h2>
          <div className="space-y-3">
            {olderFame.map(({ date, top3 }) => (
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
          onClose={() => openBid(null, null)}
        />
      )}
    </main>
  );
}
