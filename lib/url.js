// lib/url.js
//
// Cleans up project URLs submitted through the bid form. Two goals:
// 1. Strip tracking params so the leaderboard doesn't leak referral/UTM
//    data or let someone smuggle a tracking pixel through the link.
// 2. Reject obvious spam/redirector links so the board stays a list of
//    real projects, not shortened ad links — a leaderboard people don't
//    trust stops being worth bidding on.

const BLOCKED_HOSTS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "linktr.ee",
  "cutt.ly",
  "rebrand.ly",
];

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
  "referrer",
];

// Returns the cleaned URL string, or null if the URL is missing/invalid/blocked.
export function sanitizeProjectUrl(raw) {
  if (!raw) return null;

  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (BLOCKED_HOSTS.includes(host)) return null;

  for (const param of TRACKING_PARAMS) {
    url.searchParams.delete(param);
  }

  return url.toString();
}
