import { MetadataRoute } from "next";

const baseUrl = "https://zapdev.link";

const staticRoutes: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/pricing",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/sign-in",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/sign-up",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/terms",
    changeFrequency: "yearly",
    priority: 0.5,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return staticRoutes.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
