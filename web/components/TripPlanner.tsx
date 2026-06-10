'use client'

import { useState, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Train = Record<string, string | null>
type DaySchedule = { eastbound: Train[]; westbound: Train[] }

export interface ScheduleData {
  effective_date: string
  generated_at: string
  stations?: string[]
  schedule: {
    weekday: DaySchedule
    saturday: DaySchedule
    sunday: DaySchedule
  }
  special_dates?: Record<string, { note: string; pdf_url: string }>
  confirmed_dates?: string[]
}

// ── Special schedule dates (FIFA World Cup 2026 Philadelphia matches) ──────────
const SPECIAL: Record<string, { note: string; pdf_url: string }> = {
  '2026-06-14': { note: 'FIFA World Cup · Côte d\'Ivoire vs Ecuador · Trains every 15 min 10am–6:30pm', pdf_url: 'https://www.ridepatco.org/worldcup/' },
  '2026-06-19': { note: 'FIFA World Cup (Juneteenth) · Brazil vs Haiti · Holiday enhanced service',      pdf_url: 'https://www.ridepatco.org/worldcup/' },
  '2026-06-22': { note: 'FIFA World Cup · France vs Iraq · Six-car trains',                               pdf_url: 'https://www.ridepatco.org/worldcup/' },
  '2026-06-25': { note: 'FIFA World Cup · Curaçao vs Côte d\'Ivoire · Six-car trains',                    pdf_url: 'https://www.ridepatco.org/worldcup/' },
  '2026-06-27': { note: 'FIFA World Cup · Croatia vs Ghana · Trains every 15 min 7:30am–7:30pm',         pdf_url: 'https://www.ridepatco.org/worldcup/' },
  '2026-07-04': { note: 'FIFA World Cup Round of 16 (Independence Day) · Trains every 10 min 10am–11:30pm', pdf_url: 'https://www.ridepatco.org/worldcup/' },
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATIONS = [
  'Lindenwold', 'Ashland', 'Woodcrest', 'Haddonfield', 'Westmont',
  'Collingswood', 'Ferry Ave', 'Broadway', 'City Hall',
  'Franklin Square', '8th & Market', '9/10th & Locust',
  '12/13th & Locust', '15/16th & Locust',
]

const PHILLY_STATIONS = new Set([
  'Franklin Square', '8th & Market', '9/10th & Locust',
  '12/13th & Locust', '15/16th & Locust',
])

const NJ_STATIONS    = STATIONS.filter(s => !PHILLY_STATIONS.has(s))
const PHILLY_LIST    = STATIONS.filter(s =>  PHILLY_STATIONS.has(s))

// Time-filter dropdown options every 10 minutes (value = HH:MM 24hr, label = 12hr)
const TIME_OPTIONS = Array.from({ length: 144 }, (_, i) => {
  const h = Math.floor(i * 10 / 60)
  const m = (i * 10) % 60
  return {
    value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    label: `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`,
  }
})

// ── Utilities ─────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')

const toMins = (t: string | null | undefined): number => {
  if (!t) return -1
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const nowMins = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

const fmt12 = (t: string | null | undefined): string => {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const getDayType = (d: Date): 'weekday' | 'saturday' | 'sunday' => {
  const day = d.getDay()
  if (day === 0) return 'sunday'
  if (day === 6) return 'saturday'
  return 'weekday'
}

// ── CalendarGrid ──────────────────────────────────────────────────────────────
function CalendarGrid({
  selected,
  onSelect,
  specialDates,
  confirmedCount,
}: {
  selected: Date
  onSelect: (d: Date) => void
  specialDates: Set<string>
  confirmedCount: number
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  const startPad = (days[0].getDay() + 6) % 7

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}

        {days.map((day, idx) => {
          const isToday     = isSameDay(day, today)
          const isSelected  = isSameDay(day, selected)
          const isConfirmed = idx < confirmedCount
          const isSpecial   = specialDates.has(toKey(day))

          if (!isConfirmed) {
            return (
              <div
                key={toKey(day)}
                title="Not yet confirmed by PATCO — check back closer to the date"
                className="relative text-center py-2 text-sm text-gray-300 rounded-lg cursor-not-allowed select-none"
              >
                {day.getDate()}
              </div>
            )
          }

          return (
            <button
              key={toKey(day)}
              onClick={() => onSelect(day)}
              className={[
                'relative text-center py-2 rounded-lg text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isToday
                  ? 'border-2 border-gray-800 text-gray-900 hover:bg-gray-100'
                  : 'text-gray-700 hover:bg-gray-100',
              ].join(' ')}
            >
              {day.getDate()}
              {isSpecial && (
                <span
                  className={[
                    'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full',
                    isSelected ? 'bg-white' : 'bg-amber-500',
                  ].join(' ')}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          Special schedule
        </span>
        <span>Greyed = not yet confirmed</span>
      </div>
    </div>
  )
}

// ── TrainList ─────────────────────────────────────────────────────────────────
function TrainList({
  trains,
  from,
  to,
  isToday,
  filterTime,
}: {
  trains: Train[]
  from: string
  to: string
  isToday: boolean
  filterTime: string
}) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const cur     = isToday ? nowMins() : 0
  const hasDest = !!to

  const rows = trains
    .map(tr => ({ dep: tr[from] ?? null, arr: hasDest ? (tr[to] ?? null) : null }))
    .filter(r => r.dep !== null)
    .filter(r => !hasDest || (r.arr !== null && toMins(r.arr) > toMins(r.dep)))
    .sort((a, b) => toMins(a.dep) - toMins(b.dep))

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No trains found for this route
      </div>
    )
  }

  const lastRow = rows[rows.length - 1]
  if (isToday && !filterTime && toMins(lastRow.dep) < cur) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
        <p className="font-medium text-gray-900 mb-1">🌙 Last train has departed</p>
        <p className="text-sm text-gray-500">
          Last departure:{' '}
          <span className="font-mono">{fmt12(lastRow.dep)}</span>
          {' '}· Service resumes at{' '}
          <strong>4:30 AM tomorrow</strong>
        </p>
      </div>
    )
  }

  // Time filter takes priority; otherwise show last-2-past + all-future for today
  const filterMins = toMins(filterTime || null)
  const pastRows   = isToday && filterMins < 0 ? rows.filter(r => toMins(r.dep) < cur - 1) : []
  const futureRows = isToday && filterMins < 0 ? rows.filter(r => toMins(r.dep) >= cur - 1) : rows
  const visible    = filterMins >= 0
    ? rows.filter(r => toMins(r.dep) >= filterMins)
    : [...pastRows.slice(-2), ...futureRows]

  let upcomingCount = 0

  return (
    <div>
      {/* Header row */}
      <div
        style={{ gridTemplateColumns: hasDest ? '1fr auto 1fr' : '1fr' }}
        className="grid items-center gap-3 px-4 mb-2"
      >
        <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">{from}</span>
        {hasDest && (
          <>
            <span className="text-base font-bold text-gray-400">→</span>
            <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">{to}</span>
          </>
        )}
      </div>
      <div className="flex justify-end px-1 mb-2">
        <span className="text-sm font-bold text-gray-900">{visible.length} / {rows.length} trains</span>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Scrollable rows — fixed height ~10 rows */}
        <div className="overflow-y-auto max-h-[440px]">
          {visible.map((r, i) => {
            const depM   = toMins(r.dep)
            const isPast = isToday && filterMins < 0 && depM < cur - 1
            if (!isPast) upcomingCount++
            const isYellow = isToday && filterMins < 0 && !isPast && upcomingCount <= 2
            const diff     = isToday && !isPast ? depM - cur : -1
            const badge    = isPast ? 'passed'
              : diff === 0 ? 'now'
              : diff > 0
                ? diff < 60 ? `${diff}m` : `${Math.floor(diff / 60)}h${diff % 60 ? ` ${diff % 60}m` : ''}`
                : ''

            return (
              <div
                key={i}
                style={{ gridTemplateColumns: hasDest ? '1fr auto 1fr' : '1fr' }}
                className={[
                  'grid items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 last:border-0',
                  isYellow ? 'bg-yellow-50 border-l-4 border-l-yellow-400'
                    : isPast ? 'opacity-25 border-l-4 border-l-transparent'
                    : 'border-l-4 border-l-transparent',
                ].join(' ')}
              >
                <span className={[
                  'font-mono font-medium',
                  isYellow ? 'text-yellow-700' : 'text-gray-900',
                ].join(' ')}>
                  {fmt12(r.dep)}
                  {badge && (
                    <span className={[
                      'ml-1.5 text-xs font-normal',
                      isYellow ? 'text-yellow-500' : 'text-gray-400',
                    ].join(' ')}>
                      ({badge})
                    </span>
                  )}
                </span>

                {hasDest && (
                  <>
                    <span className="text-base text-gray-300">→</span>
                    <span className="font-mono text-gray-500">{fmt12(r.arr)}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main TripPlanner ──────────────────────────────────────────────────────────
export default function TripPlanner({ data }: { data: ScheduleData }) {
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  const [selectedDate, setSelectedDate] = useState<Date>(new Date(todayDate))
  const [from,         setFrom]         = useState('')
  const [to,           setTo]           = useState('')
  const [showTo,       setShowTo]       = useState(false)
  const [warnPhilly,   setWarnPhilly]   = useState(false)
  const [warnNJ,       setWarnNJ]       = useState(false)
  const [filterTime,   setFilterTime]   = useState('')
  const [searched,     setSearched]     = useState(false)

  // Direction is fully derived from the chosen station — no separate state needed
  const dir: 'eastbound' | 'westbound' = from && PHILLY_STATIONS.has(from) ? 'eastbound' : 'westbound'

  const confirmedCount = data.confirmed_dates?.length ?? 14
  const mergedSpecial  = { ...SPECIAL, ...(data.special_dates ?? {}) }
  const specialDates   = new Set(Object.keys(mergedSpecial))
  const specialForDate = mergedSpecial[toKey(selectedDate)]

  const orderedStations = dir === 'westbound' ? STATIONS : [...STATIONS].reverse()
  const fromIdx         = orderedStations.indexOf(from)
  const toStations      = fromIdx >= 0 ? orderedStations.slice(fromIdx + 1) : []

  const isToday = isSameDay(selectedDate, todayDate)
  const dayType = getDayType(selectedDate)
  const trains  = data.schedule[dayType][dir] ?? []
  const isNoSvc = isToday && nowMins() < 270

  const onFromChange = (val: string) => {
    const isPhilly = !!val && PHILLY_STATIONS.has(val)
    const isNJ     = !!val && !PHILLY_STATIONS.has(val)
    const terminal = isPhilly ? 'Lindenwold' : '15/16th & Locust'
    const defaultTo = val && val !== terminal ? terminal : ''
    setFrom(val); setTo(defaultTo); setShowTo(!!defaultTo); setSearched(false)
    setWarnPhilly(isPhilly)
    setWarnNJ(isNJ)
  }

  const selectDate = (d: Date) => { setSelectedDate(d); setSearched(false) }

  const doSearch = () => { if (from) setSearched(true) }

  const clearAll = () => {
    setFrom(''); setTo('')
    setShowTo(false); setWarnPhilly(false); setWarnNJ(false)
    setFilterTime(''); setSearched(false)
    setSelectedDate(new Date(todayDate))
  }

  const rideNow = () => {
    setSelectedDate(new Date(todayDate))
    if (!from) setFrom(NJ_STATIONS[0])
    setSearched(true)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>🚇</span>
          <div>
            <h1 className="text-base font-semibold text-gray-900">PATCO Speedline</h1>
            <p className="text-xs text-gray-400">
              Unofficial viewer ·{' '}
              <a href="https://ridepatco.org" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                ridepatco.org
              </a>
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Updated{' '}
          {new Date(data.generated_at).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit',
          })}
        </p>
      </div>

      {/* 1. Search card (From / To) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm space-y-4">

        {/* From — combined station + direction via optgroups */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            From <span className="text-red-500">*</span>
          </label>
          <select
            value={from}
            onChange={e => onFromChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select departure station</option>
            <optgroup label="NJ Stations (Westbound → Philadelphia)">
              {NJ_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>
            <optgroup label="Philly Stations (Eastbound → New Jersey)">
              {PHILLY_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>
          </select>
        </div>

        {from && (
          <>
            {/* Philly warning */}
            {warnPhilly && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>
                  Starting from Philadelphia — defaulted to{' '}
                  <strong>Eastbound → Lindenwold</strong>.
                  Change direction above if needed.
                </span>
              </div>
            )}

            {/* NJ warning */}
            {warnNJ && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>
                  Starting from New Jersey — defaulted to{' '}
                  <strong>Westbound → 15/16th &amp; Locust</strong>.
                  Change direction above if needed.
                </span>
              </div>
            )}

            {/* To — collapsed by default */}
            {!showTo ? (
              <button
                onClick={() => setShowTo(true)}
                className="text-xs text-gray-500 underline decoration-dotted underline-offset-2 hover:text-gray-700 flex items-center gap-1"
              >
                + Add specific destination
              </button>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  To
                </label>
                <select
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any destination</option>
                  {toStations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* 2. Calendar */}
      <section className="mb-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">
          📅{' '}
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <CalendarGrid
          selected={selectedDate}
          onSelect={selectDate}
          specialDates={specialDates}
          confirmedCount={confirmedCount}
        />
      </section>

      <p className="text-xs text-gray-500 mb-5">
        {isToday && 'Today · '}
        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {/* 3. Ride Now + Time filter */}
      <div className="flex items-stretch gap-3 mb-4">
        <button
          onClick={rideNow}
          className="flex-1 py-3 bg-green-50 border border-green-300 text-green-800 font-semibold rounded-xl hover:bg-green-100 transition-colors"
        >
          ▶ Ride now
        </button>
        <select
          value={filterTime}
          onChange={e => setFilterTime(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-3 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">🕐 Any time</option>
          {TIME_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 4. Find trains + Clear */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={doSearch}
          disabled={!from}
          className="flex-1 py-2.5 bg-blue-50 border border-blue-300 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          🔍 Find trains
        </button>
        <button
          onClick={clearAll}
          className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          ✕ Clear
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          {specialForDate && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-sm">
              <span className="shrink-0">ℹ️</span>
              <div>
                <span className="font-semibold text-amber-800">Special schedule in effect</span>
                <span className="text-amber-700"> · {specialForDate.note}</span>
                <a
                  href={specialForDate.pdf_url}
                  className="ml-2 text-xs text-blue-600 hover:underline"
                  target="_blank" rel="noopener noreferrer"
                >
                  View PDF ↗
                </a>
              </div>
            </div>
          )}

          {isNoSvc ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
              <p className="font-medium text-gray-900 mb-1">No service · Overnight maintenance</p>
              <p className="text-sm text-gray-500">
                12:00 AM – 4:30 AM · Next train at <strong>4:30 AM</strong>
              </p>
            </div>
          ) : (
            <TrainList trains={trains} from={from} to={to} isToday={isToday} filterTime={filterTime} />
          )}
        </div>
      )}

      {!searched && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-3xl mb-2 opacity-30">📍</div>
          <p className="text-sm">Select a date and departure station, then tap Find trains</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 pt-4 border-t border-gray-100 flex justify-between items-center flex-wrap gap-3 text-xs text-gray-400">
        <span>
          Unofficial · Not affiliated with PATCO ·{' '}
          <a href="https://ridepatco.org" className="text-blue-400 hover:underline">ridepatco.org</a>
          {' '}·{' '}
          <a href="/about" className="text-blue-400 hover:underline">About</a>
        </span>
        <a
          href="mailto:cs635@drexel.edu?subject=PATCO Schedule Issue"
          className="hover:text-gray-600 flex items-center gap-1"
        >
          ✉ Report an issue
        </a>
      </div>
    </div>
  )
}
