import { headers } from "next/headers";

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  twitterHandle?: string;
  defaultOgImage?: string;
}

function getEnv(key: string): string | undefined {
  const value = process.env[key];
  if (value && value.trim().length > 0) return value;
  return undefined;
}

function inferRuntimeSiteUrl(): string | undefined {
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() is not available at build time; ignore
  }
  return undefined;
}

const envSiteUrl =
  getEnv("NEXT_PUBLIC_SITE_URL") || getEnv("NEXT_PUBLIC_APP_URL") || inferRuntimeSiteUrl();

export const siteConfig: SiteConfig = {
  siteName: getEnv("NEXT_PUBLIC_SITE_NAME") || "Zapdev",
  siteDescription:
    getEnv("NEXT_PUBLIC_SITE_DESCRIPTION") ||
    "Zapdev builds scalable web and mobile applications with modern stacks.",
  siteUrl: (envSiteUrl || "http://localhost:3000").replace(/\/$/, ""),
  twitterHandle: getEnv("NEXT_PUBLIC_TWITTER_HANDLE"),
  defaultOgImage: getEnv("NEXT_PUBLIC_DEFAULT_OG_IMAGE"),
};

export function absoluteUrl(pathname: string): string {
  const base = siteConfig.siteUrl;
  if (!pathname) return base;
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  return `${base}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}
