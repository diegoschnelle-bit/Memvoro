// lib/store.js
//
// Data layer backed by Supabase (managed Postgres). Every other file in
// the app only calls these functions — if you ever need to swap the
// backing store again, this is the one file to touch.

import { nanoid } from "nanoid";
import { supabase } from "./supabase";

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    // Ties go to whoever has been sitting at that total the longest —
    // rewards showing up early instead of only rewarding raw spend.
    .order("total_bid", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getLeaderboard error:", error.message);
    return [];
  }

  return data.map(toClientShape);
}

export async function getProject(id) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getProject error:", error.message);
    return null;
  }

  return data ? toClientShape(data) : null;
}

function startOfTodayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Today's board is a totally separate ranking from all-time: it only
// counts bids placed since midnight UTC. A fresh contest every day means
// a small project has a real shot at #1 without out-earning the
// all-time whale — that daily reset is what keeps people coming back.
export async function getTodayLeaderboard() {
  const { data: bids, error } = await supabase
    .from("bids")
    .select("project_id, amount, created_at")
    .gte("created_at", startOfTodayUTC().toISOString());

  if (error) {
    console.error("getTodayLeaderboard error:", error.message);
    return [];
  }
  if (bids.length === 0) return [];

  const totals = aggregateByProject(bids);
  const ids = [...totals.keys()];

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("*")
    .in("id", ids);

  if (pErr) {
    console.error("getTodayLeaderboard projects error:", pErr.message);
    return [];
  }

  return projects
    .map((row) => ({
      ...toClientShape(row),
      todayBid: totals.get(row.id).total,
    }))
    .sort(
      (a, b) =>
        b.todayBid - a.todayBid ||
        new Date(totals.get(a.id).earliest) - new Date(totals.get(b.id).earliest)
    );
}

// Rebuilds the top 3 for each past UTC day from the raw bid history —
// no separate "winners" table to keep in sync, it's always derived fresh.
export async function getHallOfFame(days = 14) {
  const cutoff = new Date(startOfTodayUTC());
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  const { data: bids, error } = await supabase
    .from("bids")
    .select("project_id, amount, created_at")
    .gte("created_at", cutoff.toISOString())
    .lt("created_at", startOfTodayUTC().toISOString());

  if (error) {
    console.error("getHallOfFame error:", error.message);
    return [];
  }
  if (bids.length === 0) return [];

  // Group by (UTC day, project) first.
  const byDay = new Map(); // "YYYY-MM-DD" -> Map(project_id -> {total, earliest})
  for (const b of bids) {
    const day = b.created_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, new Map());
    const dayTotals = byDay.get(day);
    const cur = dayTotals.get(b.project_id) || { total: 0, earliest: b.created_at };
    cur.total += Number(b.amount);
    if (b.created_at < cur.earliest) cur.earliest = b.created_at;
    dayTotals.set(b.project_id, cur);
  }

  const allProjectIds = [...new Set(bids.map((b) => b.project_id))];
  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id, name, ticker, logo_url")
    .in("id", allProjectIds);

  if (pErr) {
    console.error("getHallOfFame projects error:", pErr.message);
    return [];
  }
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const days_ = [...byDay.keys()].sort().reverse(); // newest first
  return days_.map((day) => {
    const dayTotals = byDay.get(day);
    const bidsThatDay = bids.filter((b) => b.created_at.slice(0, 10) === day).length;
    const ranked = [...dayTotals.entries()]
      .sort(
        (a, b) =>
          b[1].total - a[1].total || new Date(a[1].earliest) - new Date(b[1].earliest)
      )
      .slice(0, 3)
      .map(([projectId, { total }]) => {
        const p = projectById.get(projectId);
        return {
          id: projectId,
          name: p?.name || "Unknown",
          ticker: p?.ticker || null,
          logoUrl: p?.logo_url || null,
          total,
        };
      });
    return {
      date: day,
      top3: ranked,
      projectsCount: dayTotals.size,
      bidsCount: bidsThatDay,
      wonBy: ranked.length > 1 ? ranked[0].total - ranked[1].total : null,
    };
  });
}

function aggregateByProject(bids) {
  const totals = new Map();
  for (const b of bids) {
    const cur = totals.get(b.project_id) || { total: 0, earliest: b.created_at };
    cur.total += Number(b.amount);
    if (b.created_at < cur.earliest) cur.earliest = b.created_at;
    totals.set(b.project_id, cur);
  }
  return totals;
}

export async function incrementClicks(id) {
  const { error } = await supabase.rpc("increment_clicks", { row_id: id });
  if (error) {
    // Fall back to a plain read-then-write if the RPC function hasn't
    // been created — see supabase-update.sql for the optional RPC.
    const project = await getProject(id);
    if (!project) return;
    await supabase
      .from("projects")
      .update({ clicks: (project.clicks || 0) + 1 })
      .eq("id", id);
  }
}

// Called by the Stripe webhook once a payment actually succeeds.
// `payload` is the pending-bid data we stashed in the Checkout Session's
// metadata when it was created (see app/api/checkout/route.js).
export async function applyPaidBid(payload) {
  const { projectId, amount, name, ticker, description, logoUrl, projectUrl } =
    payload;

  const id = projectId || nanoid(8);
  const existing = await getProject(id);
  const now = new Date().toISOString();

  if (existing) {
    const { error } = await supabase
      .from("projects")
      .update({
        total_bid: existing.totalBid + amount,
        last_bid_at: now,
      })
      .eq("id", id);

    if (error) console.error("applyPaidBid update error:", error.message);
  } else {
    const { error } = await supabase.from("projects").insert({
      id,
      name,
      ticker,
      description,
      logo_url: logoUrl,
      project_url: projectUrl,
      total_bid: amount,
      last_bid_at: now,
    });

    if (error) console.error("applyPaidBid insert error:", error.message);
  }

  // Log the individual bid — this is the row today's board and the
  // Hall of Fame are built from.
  const { error: bidErr } = await supabase.from("bids").insert({
    id: nanoid(12),
    project_id: id,
    amount,
    created_at: now,
  });
  if (bidErr) console.error("applyPaidBid bid-log error:", bidErr.message);
}

function toClientShape(row) {
  return {
    id: row.id,
    name: row.name,
    ticker: row.ticker,
    description: row.description,
    logoUrl: row.logo_url,
    projectUrl: row.project_url,
    totalBid: Number(row.total_bid),
    clicks: Number(row.clicks || 0),
    createdAt: row.created_at,
    lastBidAt: row.last_bid_at,
  };
}

// Feeds the "Latest activity" strip — the raw bid log, newest first, with
// just enough project info to render a line like "PepeCoin bid $50".
export async function getRecentActivity(limit = 12) {
  const { data: bids, error } = await supabase
    .from("bids")
    .select("id, project_id, amount, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentActivity error:", error.message);
    return [];
  }
  if (bids.length === 0) return [];

  const ids = [...new Set(bids.map((b) => b.project_id))];
  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id, name, ticker")
    .in("id", ids);

  if (pErr) {
    console.error("getRecentActivity projects error:", pErr.message);
    return [];
  }
  const byId = new Map(projects.map((p) => [p.id, p]));

  return bids.map((b) => ({
    id: b.id,
    amount: Number(b.amount),
    createdAt: b.created_at,
    projectName: byId.get(b.project_id)?.name || "Unknown",
    ticker: byId.get(b.project_id)?.ticker || null,
  }));
}

// Site-wide numbers for the "why compete" stats strip — kept to a single
// round trip each so this stays cheap to render on every page load.
export async function getStats() {
  const [{ count: projectCount }, { count: bidCount }, { data: allBids }] =
    await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("bids").select("*", { count: "exact", head: true }),
      supabase.from("bids").select("amount"),
    ]);

  const totalPot = (allBids || []).reduce((sum, b) => sum + Number(b.amount), 0);
  const biggestBidAmount = (allBids || []).reduce(
    (max, b) => Math.max(max, Number(b.amount)),
    0
  );

  return {
    projectCount: projectCount || 0,
    bidCount: bidCount || 0,
    totalPot,
    biggestBidAmount,
  };
}

// Replays bids in chronological order, tracking the running total per
// project, and records every moment the #1 spot changed hands. No extra
// column needed — "who's been king how long" is fully derivable from the
// bid log we already keep.
function computeLeadershipEvents(bidsAsc) {
  const totals = {};
  let curLeader = null;
  let curMax = -Infinity;
  const events = [];

  for (const b of bidsAsc) {
    const t = (totals[b.project_id] || 0) + Number(b.amount);
    totals[b.project_id] = t;
    if (t > curMax) {
      curMax = t;
      if (curLeader !== b.project_id) {
        curLeader = b.project_id;
        events.push({ projectId: b.project_id, since: b.created_at, bidId: b.id });
      }
    }
  }
  return events;
}

// Powers the "KING FOR Xh Ym" line on the throne card, and flags which
// historical bids were the exact moment a new leader took over (used to
// tag "👑 took #1" in the activity ticker instead of a plain "added $X").
export async function getThroneSince(todayOnly = false) {
  let query = supabase
    .from("bids")
    .select("id, project_id, amount, created_at")
    .order("created_at", { ascending: true });

  if (todayOnly) {
    query = query.gte("created_at", startOfTodayUTC().toISOString());
  }

  const { data: bids, error } = await query;
  if (error) {
    console.error("getThroneSince error:", error.message);
    return null;
  }
  if (!bids || bids.length === 0) return null;

  const events = computeLeadershipEvents(bids);
  if (events.length === 0) return null;

  const last = events[events.length - 1];
  return {
    leaderId: last.projectId,
    since: last.since,
    leadershipChangeBidIds: events.map((e) => e.bidId),
  };
}
