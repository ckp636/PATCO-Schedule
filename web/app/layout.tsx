import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://patco-schedule.vercel.app"),
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
  alternates: { canonical: "https://patco-schedule.vercel.app/" },
  openGraph: {
    title: "PATCO Schedule | NJ to Philadelphia Train Times",
    description:
      "PATCO Speedline train schedules between South Jersey and Philadelphia. Find next trains from Lindenwold, Haddonfield, Collingswood and all NJ stations.",
    url: "https://patco-schedule.vercel.app/",
    siteName: "PATCO Schedule",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PATCO Schedule | NJ to Philadelphia Train Times",
    description: "Find next PATCO trains from any NJ station to Philadelphia.",
  },
  verification: {
    google: "4vwnOxbMFSXGjthAO-nuq-bV_olnsmW3ZRLiq1f6N8A",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="max-w-xl mx-auto px-4 pt-6">
          <Navbar />
        </div>
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
