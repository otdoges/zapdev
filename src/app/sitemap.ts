import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const baseUrl = 'https://zapdev.link';

const frameworks = ['nextjs', 'react', 'vue', 'angular', 'svelte'];
const useCases = ['landing-pages', 'ecommerce', 'dashboards', 'saas', 'mobile', 'apis'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/frameworks`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/use-cases`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const frameworkRoutes: MetadataRoute.Sitemap = frameworks.map((framework) => ({
    url: `${baseUrl}/frameworks/${framework}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const useCaseRoutes: MetadataRoute.Sitemap = useCases.map((useCase) => ({
    url: `${baseUrl}/use-cases/${useCase}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const projects = await db.project.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
      take: 1000,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    projectRoutes = projects.map((project) => ({
      url: `${baseUrl}/projects/${project.id}`,
      lastModified: project.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error fetching projects for sitemap:', error);
  }

  return [...staticRoutes, ...frameworkRoutes, ...useCaseRoutes, ...projectRoutes];
}
