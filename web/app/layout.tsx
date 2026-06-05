import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PATCO Speedline Schedule",
  description: "Live PATCO Speedline train schedules between Philadelphia and Southern New Jersey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <main className="px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
