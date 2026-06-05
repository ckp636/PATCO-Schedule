import { readFile } from "fs/promises";
import path from "path";
import TripPlanner from "@/components/TripPlanner";

export const revalidate = 3600;

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
    const filePath = path.join(process.cwd(), "..", "data", "public", "schedule.json");
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as ScheduleData;
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
