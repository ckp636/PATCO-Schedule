import TripPlanner from "@/components/TripPlanner";

export const revalidate = 3600;

const SCHEDULE_URL =
  "https://raw.githubusercontent.com/ckp636/PATCO-Schedule/master/data/public/schedule.json";

interface Stop {
  station: string;
  time: string;
}

interface Trip {
  direction: "NJ_TO_PHILLY" | "PHILLY_TO_NJ";
  service_type: "weekday" | "saturday" | "sunday";
  stops: Stop[];
}

interface ScheduleData {
  effective_date: string;
  generated_at: string;
  trips: Trip[];
}

async function getSchedule(): Promise<ScheduleData | null> {
  try {
    const res = await fetch(SCHEDULE_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json() as Promise<ScheduleData>;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const schedule = await getSchedule();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <TripPlanner
      trips={schedule?.trips ?? []}
      generatedAt={schedule?.generated_at ?? ""}
      today={today}
    />
  );
}
