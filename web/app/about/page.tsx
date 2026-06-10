import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About · PATCO Schedule',
  description: 'Built by a Drexel AI student who commutes NJ to Philly',
}

export default function AboutPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-10">

      {/* Back link */}
      <Link href="/" className="text-sm text-blue-500 hover:underline mb-8 inline-block">
        ← Back to schedule
      </Link>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">

        {/* Identity */}
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden>🚇</span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Chakat (CKP)</h1>
            <p className="text-sm text-gray-500">
              MS in Artificial Intelligence &amp; Machine Learning
              <br />
              Drexel University, Philadelphia
            </p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Story */}
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            I commute between South Jersey and Philadelphia every week. PATCO is great —
            but their website requires hunting through PDFs just to find the next train.
          </p>
          <p>
            So I built this as a fun side project to scratch my own itch: a clean,
            mobile-friendly schedule viewer that shows countdowns, highlights upcoming
            trains, and stays up-to-date automatically by parsing the official PATCO
            timetable PDF every day.
          </p>
          <p>
            The pipeline is Python + pdfplumber, the frontend is Next.js, and
            everything runs on GitHub Actions + Vercel — fully automated.
          </p>
        </div>

        <hr className="border-gray-100" />

        {/* Call to action */}
        <div className="text-sm text-gray-600">
          <p className="mb-3 font-medium text-gray-800">If you find this useful, I&apos;d love to hear from you!</p>
          <a
            href="mailto:cs635@drexel.edu?subject=PATCO Schedule App"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            ✉ cs635@drexel.edu
          </a>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs text-gray-400 text-center">
        Unofficial viewer · Not affiliated with PATCO ·{' '}
        <a href="https://ridepatco.org" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
          ridepatco.org
        </a>
      </p>
    </div>
  )
}
