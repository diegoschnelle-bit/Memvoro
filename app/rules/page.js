import Link from "next/link";
import Crown from "../components/Crown";

export const metadata = {
  title: "Rules — Memvoro",
};

function Rule({ title, children }) {
  return (
    <div className="border-b border-cream/10 py-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-bone">{children}</p>
    </div>
  );
}

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-grid">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-7">
        <Link href="/" className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-volt" />
          <span className="text-lg font-bold tracking-tight">Memvoro</span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-bone hover:text-volt"
        >
          ← Back to the board
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-32 pt-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Rules
        </h1>
        <p className="mt-4 text-bone">
          Short and permanent. If anything below ever changes, it changes
          here first.
        </p>

        <div className="mt-8">
          <Rule title="Rank is bought, not voted">
            No likes, no comments, no algorithm. Whoever has paid the most
            holds the spot — full stop.
          </Rule>
          <Rule title="Two boards, two clocks">
            All-time tracks every dollar ever bid on a project. Today only
            counts what's been bid since midnight UTC, and resets to zero
            every day — a fresh shot at #1 that doesn't require out-earning
            the all-time leader.
          </Rule>
          <Rule title="Ties go to whoever got there first">
            If two projects land on the exact same total, the one that
            reached it earlier keeps the higher rank.
          </Rule>
          <Rule title="$1 minimum, whole dollars only">
            No cents, no complicated math. The cheapest way onto the board
            is a single dollar.
          </Rule>
          <Rule title="You don't have to out-earn everyone">
            To move up, you only have to beat the project directly above
            you — not the whole leaderboard. Climb it one rung at a time.
          </Rule>
          <Rule title="Live the moment payment clears">
            No approval queue, no waiting on us. The instant your payment
            is confirmed, your spot updates for everyone.
          </Rule>
          <Rule title="Bids are final">
            Every bid is a real, irreversible payment. There are no
            refunds for being outbid five minutes later — that's the game.
          </Rule>
          <Rule title="Clicks are counted honestly">
            Every click through to a project's site is tracked and shown
            publicly. We don't inflate it, and we don't sell it.
          </Rule>
          <Rule title="Spam links get filtered">
            Shortened links, redirectors, and referral-tracking junk get
            stripped or rejected. A leaderboard full of dead links isn't
            worth bidding on, for anyone.
          </Rule>
          <Rule title="We can remove what's clearly abusive">
            This is a permissionless board, not an unmoderated dumping
            ground. Listings that are outright illegal, scams impersonating
            another project, or abuse the platform itself can be pulled.
            Everything else stands, no matter how much you paid.
          </Rule>
        </div>
      </section>
    </main>
  );
}
