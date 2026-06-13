import type { Metadata } from 'next'
import StationMapClient from '../../components/StationMapClient'

export const metadata: Metadata = {
  title: 'PATCO Station Map | All 14 Speedline Stations',
  description: 'Map of all 14 PATCO Speedline stations between Lindenwold, NJ and Philadelphia, PA',
  alternates: { canonical: 'https://patco-schedule.vercel.app/map' },
  openGraph: {
    title: 'PATCO Station Map | All 14 Speedline Stations',
    description: 'Interactive map of all 14 PATCO Speedline stations between Lindenwold NJ and Philadelphia PA.',
    url: 'https://patco-schedule.vercel.app/map',
    siteName: 'PATCO Schedule',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PATCO Station Map',
    description: 'Interactive map of all 14 PATCO Speedline stations.',
  },
}

export default function MapPage() {
  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">PATCO Station Map</h1>

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
          className="text-[#d11241] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          ridepatco.org
        </a>
      </p>
    </div>
  )
}
