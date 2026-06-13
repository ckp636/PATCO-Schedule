import type { MetadataRoute } from 'next'

const BASE_URL = 'https://patco-schedule.vercel.app'

const ROUTE_SLUGS = [
  'lindenwold-to-philadelphia',
  'haddonfield-to-philadelphia',
  'collingswood-to-philadelphia',
  'woodcrest-to-philadelphia',
  'westmont-to-philadelphia',
  'ashland-to-philadelphia',
  'ferry-ave-to-philadelphia',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/map`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  const routePages: MetadataRoute.Sitemap = ROUTE_SLUGS.map(slug => ({
    url: `${BASE_URL}/schedule/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...routePages]
}
