import type { Metadata } from 'next'
import Link from 'next/link'
import StationMapClient from '../../components/StationMapClient'

export const metadata: Metadata = {
  title: 'PATCO Station Map',
  description: 'Map of all 14 PATCO Speedline stations between Lindenwold, NJ and Philadelphia, PA',
}

export default function MapPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-blue-500 hover:underline mb-6 inline-block">
        ← Back to schedule
      </Link>

      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        🗺️ PATCO Speedline Stations
      </h1>

      {/* Official PATCO line map */}
      <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
        <img
          src="https://www.ridepatco.org/images/PATCO_LineMap.jpg"
          alt="PATCO Speedline route map from Lindenwold NJ to Philadelphia PA"
          className="w-full h-auto"
        />
      </div>

      <div className="min-h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <StationMapClient />
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        Click any station to view its schedule · Unofficial viewer ·{' '}
        <a
          href="https://ridepatco.org"
          className="text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          ridepatco.org
        </a>
      </p>
    </div>
  )
}
