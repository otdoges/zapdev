import { siteConfig, absoluteUrl } from "@/seo/config";

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.siteName,
    url: siteConfig.siteUrl,
    logo: absoluteUrl("/logo.svg"),
    description: siteConfig.siteDescription,
    sameAs: [
      siteConfig.twitterHandle ? `https://twitter.com/${siteConfig.twitterHandle.replace(/^@/, "")}` : undefined,
    ].filter(Boolean),
  } as Record<string, unknown>;
}

export function webSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.siteName,
    url: siteConfig.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  } as Record<string, unknown>;
}
