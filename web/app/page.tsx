import { readFile } from "fs/promises";
import path from "path";
import ScheduleTable from "@/components/ScheduleTable";
import ServiceSelector from "@/components/ServiceSelector";

export const revalidate = 3600; // ISR: refresh every hour

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string; service?: string }>;
}) {
  const params = await searchParams;
  const schedule = await getSchedule();
  const direction = (params.direction ?? "NJ_TO_PHILLY") as Trip["direction"];
  const service = (params.service ?? "weekday") as Trip["service_type"];

  const filtered =
    schedule?.trips.filter(
      (t) => t.direction === direction && t.service_type === service
    ) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Train Schedule</h1>
        {schedule && (
          <p className="text-sm text-gray-500 mt-1">
            Effective {schedule.effective_date} &mdash; updated{" "}
            {new Date(schedule.generated_at).toLocaleString()}
          </p>
        )}
      </div>

      <ServiceSelector direction={direction} service={service} />

      {!schedule && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          Schedule data not yet available. Run the pipeline first:{" "}
          <code className="font-mono">python pipeline/main.py</code>
        </div>
      )}

      {schedule && filtered.length === 0 && (
        <p className="text-gray-500 text-sm">No trips found for this selection.</p>
      )}

      {filtered.map((trip, i) => (
        <ScheduleTable key={i} trip={trip} />
      ))}
    </div>
  );
}
