export interface SiteConfig {
  name: string;
  description: string;
  siteUrl: string;
  defaultTitle: string;
  titleTemplate: string;
  keywords: string[];
  twitterHandle?: string;
  organization: {
    name: string;
    legalName?: string;
    url: string;
    logoUrl?: string;
    sameAs?: string[];
  };
  noIndex: boolean;
  verification: {
    google?: string;
  };
}

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zapdev.link";
const normalizedSiteUrl = rawSiteUrl.endsWith("/")
  ? rawSiteUrl.slice(0, -1)
  : rawSiteUrl;

export const siteConfig: SiteConfig = {
  name: "Zapdev",
  description:
    "Zapdev is a leading software development company specializing in building scalable web applications, mobile apps, and enterprise solutions. Transform your ideas into reality with our expert development team.",
  siteUrl: normalizedSiteUrl,
  defaultTitle: "Zapdev - Build Fast, Scale Smart",
  titleTemplate: "%s | Zapdev",
  keywords: [
    "software development",
    "web development",
    "mobile apps",
    "enterprise solutions",
    "Zapdev",
    "app development",
    "custom software",
  ],
  twitterHandle: "@zapdev",
  organization: {
    name: "Zapdev",
    url: normalizedSiteUrl,
    logoUrl: `${normalizedSiteUrl}/logo.png`,
    sameAs: [
      "https://twitter.com/zapdev",
      "https://linkedin.com/company/zapdev",
    ],
  },
  noIndex:
    process.env.NEXT_PUBLIC_NO_INDEX === "true" ||
    process.env.NODE_ENV !== "production",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export function toAbsoluteUrl(pathname: string): string {
  if (pathname.startsWith("http")) return pathname;
  return new URL(pathname, normalizedSiteUrl).toString();
}
