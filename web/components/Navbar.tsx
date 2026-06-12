'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const path = usePathname()

  const navLink = (href: string, label: string) => {
    const active = path === href
    return active ? (
      <span className="text-sm font-medium text-[#d11241] border-b-2 border-[#d11241] pb-0.5">
        {label}
      </span>
    ) : (
      <Link href={href} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
        {label}
      </Link>
    )
  }

  return (
    <header className="flex items-center justify-between pb-4 mb-2 border-b border-gray-100">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-[#d11241] rounded-full flex items-center justify-center shrink-0">
          <i className="ti ti-train text-white text-lg" aria-hidden="true" />
        </div>
        <span className="text-xl font-bold text-[#d11241] tracking-tight">PATCO</span>
      </Link>
      <nav className="flex items-center gap-5">
        {navLink('/', 'Schedule')}
        {navLink('/map', 'Stations')}
        {navLink('/about', 'About')}
      </nav>
    </header>
  )
}
