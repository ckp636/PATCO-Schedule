import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 3600

const SCHEDULE_URL =
  'https://raw.githubusercontent.com/ckp636/PATCO-Schedule/master/data/public/schedule.json'

// Slug → canonical station name
const ROUTE_MAP: Record<string, string> = {
  'lindenwold-to-philadelphia':    'Lindenwold',
  'haddonfield-to-philadelphia':   'Haddonfield',
  'collingswood-to-philadelphia':  'Collingswood',
  'woodcrest-to-philadelphia':     'Woodcrest',
  'westmont-to-philadelphia':      'Westmont',
  'ashland-to-philadelphia':       'Ashland',
  'ferry-ave-to-philadelphia':     'Ferry Ave',
}

export function generateStaticParams() {
  return Object.keys(ROUTE_MAP).map(route => ({ route }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ route: string }> }
): Promise<Metadata> {
  const { route } = await params
  const station = ROUTE_MAP[route]
  if (!station) return {}
  return {
    title: `${station} to Philadelphia PATCO Schedule`,
    description: `PATCO train times from ${station} to Philadelphia. Next trains, weekend schedules and trip planner.`,
    keywords: [
      `${station} to Philadelphia`,
      `PATCO ${station}`,
      'PATCO schedule',
      'PATCO train times',
      'NJ to Philadelphia train',
    ],
  }
}

interface RawStop { station: string; time: string }
interface RawTrip {
  direction: 'NJ_TO_PHILLY' | 'PHILLY_TO_NJ'
  service_type: 'weekday' | 'saturday' | 'sunday'
  stops: RawStop[]
}
interface RawSchedule { effective_date: string; trips: RawTrip[] }

async function getDepartures(station: string): Promise<{ time: string; label: string }[]> {
  try {
    const res = await fetch(SCHEDULE_URL, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const raw: RawSchedule = await res.json()
    return raw.trips
      .filter(t => t.direction === 'NJ_TO_PHILLY' && t.service_type === 'weekday')
      .flatMap(t => t.stops.filter(s => s.station === station).map(s => s.time))
      .sort()
      .slice(0, 5)
      .map(t => {
        const [hStr, mStr] = t.split(':')
        const h = parseInt(hStr, 10)
        const m = mStr
        const ampm = h >= 12 ? 'PM' : 'AM'
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
        return { time: t, label: `${h12}:${m} ${ampm}` }
      })
  } catch {
    return []
  }
}

export default async function RoutePage(
  { params }: { params: Promise<{ route: string }> }
) {
  const { route } = await params
  const station = ROUTE_MAP[route]
  if (!station) notFound()

  const departures = await getDepartures(station)

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-blue-500 hover:underline mb-6 inline-block">
        ← Full trip planner
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {station} to Philadelphia
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        PATCO Speedline weekday schedule
      </p>

      {departures.length > 0 ? (
        <>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            First 5 weekday departures
          </h2>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden mb-6">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">#</th>
                <th className="px-4 py-2 text-left font-medium">Departs {station}</th>
                <th className="px-4 py-2 text-left font-medium">Destination</th>
              </tr>
            </thead>
            <tbody>
              {departures.map((d, i) => (
                <tr key={d.time} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{d.label}</td>
                  <td className="px-4 py-2 text-gray-600">Philadelphia</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="text-sm text-gray-500 mb-6">Schedule data unavailable.</p>
      )}

      <Link
        href={`/?from=${encodeURIComponent(station)}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        View full schedule & next trains →
      </Link>

      <p className="mt-8 text-xs text-gray-400">
        Unofficial viewer · Not affiliated with PATCO ·{' '}
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
