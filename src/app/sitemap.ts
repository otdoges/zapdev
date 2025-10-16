import { MetadataRoute } from 'next'
import { getAllFrameworks } from '@/lib/frameworks'
import { getAllSolutions } from '@/lib/solutions'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://zapdev.link'
  const frameworks = getAllFrameworks()
  const solutions = getAllSolutions()
  
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/home/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/frameworks`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/showcase`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/solutions`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/home/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/home/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
  ]

  const frameworkPages = frameworks.map(framework => ({
    url: `${baseUrl}/frameworks/${framework.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const solutionPages = solutions.map(solution => ({
    url: `${baseUrl}/solutions/${solution.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...frameworkPages, ...solutionPages]
}
