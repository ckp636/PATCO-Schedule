"use client";

interface Stop {
  station: string;
  time: string;
}

interface Trip {
  direction: string;
  service_type: string;
  stops: Stop[];
}

export default function ScheduleTable({ trip }: { trip: Trip }) {
  if (!trip.stops.length) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-blue-700 text-white">
          <tr>
            <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Station</th>
            <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Departs</th>
          </tr>
        </thead>
        <tbody>
          {trip.stops.map((stop, i) => (
            <tr key={stop.station} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-2 whitespace-nowrap">{stop.station}</td>
              <td className="px-3 py-2 font-mono whitespace-nowrap">{stop.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
