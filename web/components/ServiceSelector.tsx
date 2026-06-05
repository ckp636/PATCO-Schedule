"use client";

import { useRouter } from "next/navigation";

const DIRECTIONS = [
  { value: "NJ_TO_PHILLY", label: "NJ → Philadelphia" },
  { value: "PHILLY_TO_NJ", label: "Philadelphia → NJ" },
];

const SERVICES = [
  { value: "weekday", label: "Weekday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday / Holiday" },
];

export default function ServiceSelector({
  direction,
  service,
}: {
  direction: string;
  service: string;
}) {
  const router = useRouter();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams({ direction, service, [key]: value });
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
          Direction
        </label>
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          {DIRECTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => update("direction", d.value)}
              className={`px-4 py-2 text-sm transition-colors ${
                direction === d.value
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
          Service
        </label>
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          {SERVICES.map((s) => (
            <button
              key={s.value}
              onClick={() => update("service", s.value)}
              className={`px-4 py-2 text-sm transition-colors ${
                service === s.value
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
