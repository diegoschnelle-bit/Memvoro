import { Fredoka } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Headlines, big names, primary CTAs — the rounded, friendly "claim" voice.
const display = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
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
      className={`${display.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="bg-ink text-cream font-body">{children}</body>
    </html>
  );
}
