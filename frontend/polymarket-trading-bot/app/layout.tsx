/* ============================================================
   ROOT LAYOUT — Main layout with sidebar and content area
   
   This layout wraps all pages with:
   - The hacker-style sidebar navigation
   - A market ticker at the top
   - The scanline overlay effect
   - The main content area (with left margin for sidebar)
   ============================================================ */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POLYBOT — AI Trading Terminal",
  description: "AI-powered Polymarket trading bot dashboard. Monitor trades, portfolio, and communicate with your trading AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased scanline-overlay`}
      >
        {children}
      </body>
    </html>
  );
}
