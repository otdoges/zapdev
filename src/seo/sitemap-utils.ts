import { MetadataRoute } from "next";
import { SEO_CONFIG } from "./config";
import { PAGE_PRIORITIES, CHANGE_FREQUENCIES } from "./config";

export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  alternateLanguages?: Record<string, string>;
}

export function createSitemapEntry(options: {
  path: string;
  lastModified?: Date | string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}): MetadataRoute.Sitemap[number] {
  return {
    url: `${SEO_CONFIG.siteUrl}${options.path}`,
    lastModified: options.lastModified || new Date(),
    changeFrequency: options.changeFrequency || "weekly",
    priority: options.priority || 0.5,
  };
}

export function generateStaticSitemap(): MetadataRoute.Sitemap {
  return [
    createSitemapEntry({
      path: "/",
      changeFrequency: CHANGE_FREQUENCIES.daily,
      priority: PAGE_PRIORITIES.home,
    }),
    createSitemapEntry({
      path: "/pricing",
      changeFrequency: CHANGE_FREQUENCIES.monthly,
      priority: PAGE_PRIORITIES.pricing,
    }),
    createSitemapEntry({
      path: "/features",
      changeFrequency: CHANGE_FREQUENCIES.monthly,
      priority: PAGE_PRIORITIES.features,
    }),
    createSitemapEntry({
      path: "/projects",
      changeFrequency: CHANGE_FREQUENCIES.weekly,
      priority: PAGE_PRIORITIES.projects,
    }),
    createSitemapEntry({
      path: "/sign-in",
      changeFrequency: CHANGE_FREQUENCIES.yearly,
      priority: PAGE_PRIORITIES.signIn,
    }),
    createSitemapEntry({
      path: "/sign-up",
      changeFrequency: CHANGE_FREQUENCIES.yearly,
      priority: PAGE_PRIORITIES.signUp,
    }),
  ];
}

export function generateDynamicSitemapEntries<T>(
  items: T[],
  pathGenerator: (item: T) => string,
  options?: {
    changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority?: number;
    lastModifiedGetter?: (item: T) => Date | string;
  }
): MetadataRoute.Sitemap {
  return items.map((item) =>
    createSitemapEntry({
      path: pathGenerator(item),
      changeFrequency: options?.changeFrequency || "weekly",
      priority: options?.priority || 0.6,
      lastModified: options?.lastModifiedGetter?.(item),
    })
  );
}

export function generateBlogSitemapEntries(
  posts: Array<{
    slug: string;
    updatedAt?: Date | string;
  }>
): MetadataRoute.Sitemap {
  return generateDynamicSitemapEntries(
    posts,
    (post) => `/blog/${post.slug}`,
    {
      changeFrequency: "monthly",
      priority: PAGE_PRIORITIES.blogPost,
      lastModifiedGetter: (post) => post.updatedAt || new Date(),
    }
  );
}

export function generateProjectSitemapEntries(
  projects: Array<{
    id: string;
    updatedAt?: Date | string;
  }>
): MetadataRoute.Sitemap {
  return generateDynamicSitemapEntries(
    projects,
    (project) => `/projects/${project.id}`,
    {
      changeFrequency: "daily",
      priority: 0.7,
      lastModifiedGetter: (project) => project.updatedAt || new Date(),
    }
  );
}

export function mergeSitemaps(...sitemaps: MetadataRoute.Sitemap[]): MetadataRoute.Sitemap {
  return sitemaps.flat();
}

export function filterSitemapByLanguage(
  sitemap: MetadataRoute.Sitemap,
  language: string
): MetadataRoute.Sitemap {
  const langPrefix = language === "en" ? "" : `/${language}`;
  return sitemap.filter((entry) => {
    const url = typeof entry.url === "string" ? entry.url : entry.url.toString();
    return url.includes(langPrefix);
  });
}

export function addAlternateLanguages(
  entry: MetadataRoute.Sitemap[number],
  languages: string[] = ["en", "es", "fr", "de"]
): MetadataRoute.Sitemap[number] {
  const baseUrl = typeof entry.url === "string" ? entry.url : entry.url.toString();
  const path = baseUrl.replace(SEO_CONFIG.siteUrl, "");

  return entry;
}
