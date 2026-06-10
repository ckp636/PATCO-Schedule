import TripPlanner, { ScheduleData } from "@/components/TripPlanner";

export const revalidate = 3600;

const SCHEDULE_URL =
  "https://raw.githubusercontent.com/ckp636/PATCO-Schedule/master/data/public/schedule.json";

interface RawStop  { station: string; time: string }
interface RawTrip  {
  direction:    "NJ_TO_PHILLY" | "PHILLY_TO_NJ";
  service_type: "weekday" | "saturday" | "sunday";
  stops: RawStop[];
}
interface RawSchedule {
  effective_date: string;
  generated_at:   string;
  trips: RawTrip[];
}

function adapt(raw: RawSchedule): ScheduleData {
  const schedule: ScheduleData["schedule"] = {
    weekday:  { westbound: [], eastbound: [] },
    saturday: { westbound: [], eastbound: [] },
    sunday:   { westbound: [], eastbound: [] },
  };
  for (const trip of raw.trips) {
    const dir = trip.direction === "NJ_TO_PHILLY" ? "westbound" : "eastbound";
    const train: Record<string, string | null> = {};
    for (const stop of trip.stops) train[stop.station] = stop.time;
    schedule[trip.service_type][dir].push(train);
  }
  return { effective_date: raw.effective_date, generated_at: raw.generated_at, schedule };
}

async function getSchedule(): Promise<ScheduleData | null> {
  try {
    const res = await fetch(SCHEDULE_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return adapt(await res.json() as RawSchedule);
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const data = await getSchedule();

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center text-sm text-gray-500">
        Schedule data unavailable.{" "}
        <code className="font-mono">python pipeline/main.py</code>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PATCO Schedule",
    "url": "https://patco-schedule-app.vercel.app",
    "description": "Unofficial PATCO Speedline schedule viewer for NJ to Philadelphia trains",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://patco-schedule-app.vercel.app/?from={station}",
      "query-input": "required name=station",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TripPlanner data={data} />
    </>
  );
}
