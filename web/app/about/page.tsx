import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · PATCO Schedule",
  description:
    "Built by a Drexel AI student who commutes weekly between South Jersey and Philadelphia.",
};

export default function AboutPage() {
  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-8">

      {/* Name + title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Chakat (CK)</h2>
        <p className="text-sm text-gray-500">
          MS in Artificial Intelligence &amp; Machine Learning<br />
          Drexel University, Philadelphia
        </p>
      </div>

      {/* Story */}
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed mb-8">
        <p>
          I commute between South Jersey and Philadelphia every week. PATCO is
          great — but their website requires hunting through PDFs just to find
          the next train.
        </p>
        <p>
          So I built this as a fun side project to scratch my own itch: a clean,
          mobile-friendly schedule viewer that shows countdowns, highlights
          upcoming trains, and stays up-to-date automatically by parsing the
          official PATCO timetable PDF every day.
        </p>
        <p>
          Unlike Google Maps or other transit apps — which often serve outdated
          schedules and may not reflect the latest timetable — this app parses
          the{" "}
          <a
            href="https://www.ridepatco.org/schedules/schedules.asp"
            className="text-[#d11241] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            official PATCO PDF
          </a>
          {" "}directly, so it always reflects the current schedule, updated
          automatically every morning.
        </p>
        <p>
          This is a <span className="font-medium text-gray-900">vibe coding</span>{" "}
          project — built quickly with AI assistance, iterated in real commutes,
          and shaped entirely by what I actually needed as a daily rider.
        </p>
      </div>

      {/* CTA */}
      <div className="p-4 bg-[#FCEBEB] border border-[#d11241]/30 rounded-xl">
        <p className="text-sm text-[#a50e33] font-medium mb-1">
          If you find this useful, I&apos;d love to hear from you!
        </p>
        <a
          href="mailto:cs635@drexel.edu"
          className="text-sm text-[#d11241] hover:underline font-mono"
        >
          cs635@drexel.edu
        </a>
      </div>

      {/* Footer nav */}
      <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600">
          ← Back to schedule
        </Link>
        <span>Unofficial · Not affiliated with PATCO</span>
      </div>

    </div>
  );
}
