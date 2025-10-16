import type { MetadataRoute } from "next";
import { siteConfig } from "./config";

export function buildRobots(): MetadataRoute.Robots {
  if (siteConfig.noIndex) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      host: siteConfig.siteUrl,
      sitemap: [],
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api",
      ],
      crawlDelay: 1,
    },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    host: siteConfig.siteUrl,
  };
}
