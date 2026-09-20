import { Space_Grotesk, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Headlines, big names, primary CTAs — the "poster" voice.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

// Body copy, nav, descriptions — the everyday, highly-legible voice.
const body = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

// Data only: amounts, tickers, timestamps, countdowns — scoreboard voice.
const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Memvoro — Outbid. Take #1.",
  description:
    "The live, pay-to-rank leaderboard for memecoin projects. The internet decides.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="bg-ink text-cream font-body">{children}</body>
    </html>
  );
}
