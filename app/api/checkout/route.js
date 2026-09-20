import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { stripe } from "@/lib/stripe";
import { sanitizeProjectUrl } from "@/lib/url";

// Minimum bid enforced server-side — never trust a client-sent price.
// Whole dollars only, like outbid.lol: keeps the "how much do I owe to
// retake #1" math clean and legible at a glance.
const MIN_BID_USD = 1;

export async function POST(req) {
  const body = await req.json();
  const { projectId, amount, name, ticker, description, logoUrl, projectUrl } =
    body || {};

  const bidAmount = Number(amount);
  if (
    !Number.isFinite(bidAmount) ||
    !Number.isInteger(bidAmount) ||
    bidAmount < MIN_BID_USD
  ) {
    return NextResponse.json(
      { error: `Bids are whole dollars, $${MIN_BID_USD} minimum.` },
      { status: 400 }
    );
  }

  // New projects must supply a name; existing ones just need a projectId.
  if (!projectId && !name) {
    return NextResponse.json(
      { error: "Missing project name" },
      { status: 400 }
    );
  }

  // Reject spam/shortener links so the board stays trustworthy — a
  // missing/invalid URL on a NEW listing is a hard stop; on an existing
  // project (pure outbid, no URL resubmitted) it's simply left blank.
  let cleanUrl = null;
  if (projectUrl) {
    cleanUrl = sanitizeProjectUrl(projectUrl);
    if (!cleanUrl && !projectId) {
      return NextResponse.json(
        { error: "That project link looks invalid — check it starts with https:// and try again." },
        { status: 400 }
      );
    }
  }

  // A logo is just an image URL — same basic sanity check as the project
  // link, but never blocks the bid: a bad logo URL just means no logo.
  let cleanLogoUrl = null;
  if (logoUrl) {
    try {
      const u = new URL(logoUrl.trim());
      if (["http:", "https:"].includes(u.protocol)) cleanLogoUrl = u.toString();
    } catch {
      cleanLogoUrl = null;
    }
  }

  const origin = req.headers.get("origin") || process.env.APP_URL;

  // Stash everything the webhook needs to apply the bid once payment
  // actually clears. Stripe metadata values must be strings.
  const metadata = {
    projectId: projectId || nanoid(8),
    amount: String(bidAmount),
    name: name || "",
    ticker: ticker || "",
    description: description || "",
    logoUrl: cleanLogoUrl || "",
    projectUrl: cleanUrl || "",
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: projectId
                ? `Outbid on Memvoro — ${name || projectId}`
                : `Join the Memvoro leaderboard — ${name}`,
              description: "Ranking spot on the Memvoro live leaderboard.",
            },
            unit_amount: Math.round(bidAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${origin}/?paid=1`,
      cancel_url: `${origin}/?paid=0`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Surface the real reason instead of a generic 500 — this is what
    // shows up in the bid modal, so it needs to actually mean something.
    console.error("Stripe checkout session error:", err);
    return NextResponse.json(
      { error: err.message || "Payment setup failed. Try again in a moment." },
      { status: 500 }
    );
  }
}
