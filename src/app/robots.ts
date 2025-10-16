import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = absoluteUrl("/");
  const sitemap = absoluteUrl("/sitemap.xml");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",
          "/api/*",
          "/_next/",
        ],
      },
    ],
    host: base,
    sitemap,
  };
}
