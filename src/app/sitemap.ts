import type { MetadataRoute } from 'next'
import { buildSitemap } from '@/seo/sitemap'

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap()
}
