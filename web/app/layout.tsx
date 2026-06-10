import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PATCO Schedule | NJ to Philadelphia Train Times",
  description:
    "PATCO Speedline train schedules between South Jersey and Philadelphia. Find next trains from Lindenwold, Haddonfield, Collingswood and all NJ stations.",
  keywords: [
    "PATCO schedule",
    "PATCO train times",
    "NJ to Philadelphia train",
    "PATCO Speedline",
    "Lindenwold to Philadelphia",
    "South Jersey train",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <main className="px-4 py-6">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
