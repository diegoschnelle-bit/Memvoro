"use client";

import { useState } from "react";

const MIN_BID = 1;
const QUICK_AMOUNTS = [1, 5, 25, 100];

// Like outbid.lol: you don't have to out-earn the whole leaderboard to
// move up — just beat whoever's directly above you by $1. Cheaper than
// aiming straight for #1, and it's what keeps people fighting one rung
// of the ladder at a time instead of giving up after one loss.
function suggestedAmount(target, aboveTotal, currentValue) {
  if (target === "new") return QUICK_AMOUNTS[1];
  if (aboveTotal == null || currentValue >= aboveTotal) return MIN_BID;
  return Math.max(MIN_BID, aboveTotal - currentValue + 1);
}

export default function BidModal({ target, aboveTotal, valueField = "totalBid", onClose }) {
  const isNew = target === "new";
  const currentValue = isNew ? 0 : target[valueField] ?? target.totalBid ?? 0;
  const toRetake = !isNew && aboveTotal != null && currentValue < aboveTotal;
  const [amount, setAmount] = useState(suggestedAmount(target, aboveTotal, currentValue));
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!amount || amount < MIN_BID || !Number.isInteger(Number(amount))) {
      setError(`Bids are whole dollars, $${MIN_BID} minimum.`);
      return;
    }
    if (isNew && !name.trim()) {
      setError("Give your project a name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: isNew ? null : target.id,
          amount,
          name: isNew ? name : target.name,
          ticker: isNew ? ticker : target.ticker,
          description: isNew ? description : target.description,
          projectUrl: isNew ? projectUrl : target.projectUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 sm:items-center">
      <div className="w-full max-w-md rounded-t-lg border border-cream/10 bg-char p-6 sm:rounded-lg">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">
            {isNew ? "List your project" : `Outbid ${target.name}`}
          </h3>
          <button
            onClick={onClose}
            className="text-bone hover:text-cream"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {isNew && (
            <>
              <div>
                <label className="text-xs text-bone">Project name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded border border-cream/20 bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-volt"
                  placeholder="DogeKing"
                />
              </div>
              <div>
                <label className="text-xs text-bone">Ticker</label>
                <input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="mt-1 w-full rounded border border-cream/20 bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-volt"
                  placeholder="$DKING"
                />
              </div>
              <div>
                <label className="text-xs text-bone">
                  One-line description
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded border border-cream/20 bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-volt"
                  placeholder="What makes it worth outbidding for"
                />
              </div>
              <div>
                <label className="text-xs text-bone">
                  Project link (optional)
                </label>
                <input
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className="mt-1 w-full rounded border border-cream/20 bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-volt"
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {!isNew && (
            <p className="text-sm text-bone">
              Currently at{" "}
              <span className="font-mono text-cream">
                ${currentValue.toLocaleString("en-US")}
              </span>
              .{" "}
              {toRetake ? (
                <>
                  Bid{" "}
                  <span className="font-mono text-volt">
                    ${suggestedAmount(target, aboveTotal, currentValue).toLocaleString("en-US")}
                  </span>{" "}
                  or more to move up a spot.
                </>
              ) : (
                "Bid higher to add to your total."
              )}
            </p>
          )}

          <div>
            <label className="text-xs text-bone">Bid amount (USD, whole dollars)</label>
            <input
              type="number"
              min={MIN_BID}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Math.round(Number(e.target.value)))}
              className="mt-1 w-full rounded border border-cream/20 bg-ink px-3 py-2 font-mono text-sm text-cream outline-none focus:border-volt"
            />
            <div className="mt-2 flex gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAmount(a)}
                  className="rounded border border-cream/20 px-2.5 py-1 font-mono text-xs text-bone hover:border-volt hover:text-volt"
                >
                  ${a}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-rust">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-volt py-3 font-display text-sm font-bold uppercase tracking-wide text-ink disabled:opacity-60"
          >
            {loading ? "Redirecting to checkout…" : "Continue to payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
