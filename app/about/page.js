import Link from "next/link";
import Crown from "../components/Crown";
import { getStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About — Memvoro",
};

function Benefit({ title, children }) {
  return (
    <div className="rounded-lg border border-cream/10 bg-char p-5">
      <h3 className="font-bold text-cream">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-bone">{children}</p>
    </div>
  );
}

export default async function AboutPage() {
  const stats = await getStats();

  return (
    <main className="min-h-screen bg-grid">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-7">
        <Link href="/" className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-volt" />
          <span className="font-display text-lg font-bold tracking-tight">Memvoro</span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-bone hover:text-volt"
        >
          ← Back to the board
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-8 pt-6">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tighter sm:text-5xl">
          The internet doesn't vote.
          <br />
          It pays.
        </h1>
        <p className="mt-6 text-lg text-bone">
          Every memecoin claims it's the next big thing. Voting-based
          rankings get brigaded, algorithms get gamed, and "trending" lists
          reward whoever has the biggest bot farm. Memvoro throws all of
          that out and replaces it with one number everyone can verify:
          how much a project is willing to put down to hold the top spot.
        </p>
        <p className="mt-4 text-bone">
          No jury, no application form, no algorithm deciding you're not
          worth showing. If you're willing to back your project, you're on
          the board — the moment your payment clears.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-6">
        <div className="grid grid-cols-3 gap-4 rounded-lg border border-cream/10 bg-char p-6 text-center">
          <div>
            <div className="font-mono text-2xl font-bold text-volt">
              {stats.projectCount}
            </div>
            <div className="mt-1 text-xs text-bone">memecoins listed</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-volt">
              ${stats.totalPot.toLocaleString("en-US")}
            </div>
            <div className="mt-1 text-xs text-bone">total ever bid</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-volt">
              {stats.bidCount}
            </div>
            <div className="mt-1 text-xs text-bone">bids placed</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="text-2xl font-bold">Why projects bid</h2>
        <p className="mt-2 text-sm text-bone">
          This isn't just a vanity ranking. Every part of it is built to
          actually get your project seen.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Benefit title="Real, tracked traffic">
            Every click on your listing routes through us and gets counted
            — publicly. You're not paying for a number on a screen, you're
            paying for visitors who actually land on your site.
          </Benefit>
          <Benefit title="Start for a dollar">
            You don't need a marketing budget to get on the board. $1 gets
            you listed. Spend more only once it's actually working for you.
          </Benefit>
          <Benefit title="No gatekeeping, no waiting">
            There's no team reviewing submissions, no "we'll get back to
            you." Pay, and you're live — instantly, for anyone to see.
          </Benefit>
          <Benefit title="Climbing is cheap">
            You never have to out-earn the whole board to move up — just
            the project directly above you. Small, affordable pushes get
            you climbing one rank at a time.
          </Benefit>
          <Benefit title="A fresh shot every day">
            The Today board resets every midnight UTC. Even if you can't
            touch the all-time whale, you've got a real, level shot at #1
            today.
          </Benefit>
          <Benefit title="Bragging rights that last">
            Every project that's ever held #1 on a given day stays in the
            Hall of Fame — permanently. Take the spot once, and it's yours
            to point to forever.
          </Benefit>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-32">
        <div className="rounded-lg border border-gold/30 bg-char p-6 text-center">
          <p className="text-lg font-bold">
            The internet decides. Make sure it's looking at you.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded bg-volt px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink transition-transform hover:scale-[1.02]"
          >
            Take #1
          </Link>
        </div>
      </section>
    </main>
  );
}
