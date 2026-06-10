'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

const STATIONS = [
  { name: 'Lindenwold',       lat: 39.8340, lng: -75.0006 },
  { name: 'Ashland',          lat: 39.8520, lng: -74.9720 },
  { name: 'Woodcrest',        lat: 39.8690, lng: -74.9540 },
  { name: 'Haddonfield',      lat: 39.8974, lng: -75.0368 },
  { name: 'Westmont',         lat: 39.9080, lng: -75.0300 },
  { name: 'Collingswood',     lat: 39.9190, lng: -75.0700 },
  { name: 'Ferry Ave',        lat: 39.9226, lng: -75.0918 },
  { name: 'Broadway',         lat: 39.9420, lng: -75.1100 },
  { name: 'City Hall',        lat: 39.9453, lng: -75.1178 },
  { name: 'Franklin Square',  lat: 39.9553, lng: -75.1480 },
  { name: '8th & Market',     lat: 39.9510, lng: -75.1535 },
  { name: '9/10th & Locust',  lat: 39.9467, lng: -75.1580 },
  { name: '12/13th & Locust', lat: 39.9460, lng: -75.1640 },
  { name: '15/16th & Locust', lat: 39.9453, lng: -75.1706 },
]

export default function StationMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)

  useEffect(() => {
    // Guard: if already initialized (StrictMode second-invoke), skip.
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      // Double-check after the async import in case cleanup already ran.
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current).setView([39.895, -75.085], 12)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      const positions: [number, number][] = STATIONS.map(s => [s.lat, s.lng])
      L.polyline(positions, { color: '#2563eb', weight: 3, opacity: 0.7 }).addTo(map)

      STATIONS.forEach(station => {
        L.circleMarker([station.lat, station.lng], {
          radius: 8,
          fillColor: '#3b82f6',
          color: '#1d4ed8',
          weight: 2,
          fillOpacity: 0.9,
        })
          .bindPopup(
            `<div style="line-height:1.6;min-width:140px">` +
            `<strong style="display:block;margin-bottom:4px">${station.name}</strong>` +
            `<a href="/?from=${encodeURIComponent(station.name)}" ` +
            `style="color:#2563eb;text-decoration:none;font-weight:500">View trains →</a>` +
            `</div>`
          )
          .addTo(map)
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', minHeight: '500px' }}
    />
  )
}
