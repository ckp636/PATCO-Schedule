import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PATCO Speedline Schedule",
  description: "Live PATCO Speedline train schedules between Philadelphia and Southern New Jersey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="bg-blue-800 text-white px-4 py-3 shadow">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight">PATCO</span>
            <span className="text-blue-200 text-sm">Speedline Schedule</span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-6">
          Schedule data sourced from{" "}
          <a href="https://www.ridepatco.org" className="underline">ridepatco.org</a>.
          Not an official PATCO product.
        </footer>
      </body>
    </html>
  );
}
