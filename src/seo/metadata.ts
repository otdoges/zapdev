import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/seo/config";

function getEnv(key: string): string | undefined {
  const value = process.env[key];
  if (value && value.trim().length > 0) return value;
  return undefined;
}

const googleVerification =
  getEnv("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION") || getEnv("GOOGLE_SITE_VERIFICATION");

export function createDefaultMetadata(): Metadata {
  const title = `${siteConfig.siteName} - Build Fast, Scale Smart`;
  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
      default: title,
      template: `%s | ${siteConfig.siteName}`,
    },
    description: siteConfig.siteDescription,
    keywords: [
      "software development",
      "web development",
      "mobile apps",
      "enterprise solutions",
      siteConfig.siteName,
      "app development",
      "custom software",
    ],
    authors: [{ name: siteConfig.siteName }],
    creator: siteConfig.siteName,
    publisher: siteConfig.siteName,
    alternates: { canonical: "/" },
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.siteUrl,
      siteName: siteConfig.siteName,
      title,
      description: siteConfig.siteDescription,
      images: siteConfig.defaultOgImage
        ? [{ url: siteConfig.defaultOgImage }]
        : [{ url: absoluteUrl("/opengraph-image") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: siteConfig.siteDescription,
      creator: siteConfig.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: googleVerification,
    },
  };
}

export function buildPageMetadata(options: {
  title?: string;
  description?: string;
  path?: string;
  index?: boolean;
  image?: string;
}): Metadata {
  const { title, description, path, index = true, image } = options;
  const url = path ? absoluteUrl(path) : siteConfig.siteUrl;
  const computedTitle = title
    ? `${title} | ${siteConfig.siteName}`
    : `${siteConfig.siteName} - Build Fast, Scale Smart`;
  const fallbackImage = image || siteConfig.defaultOgImage || absoluteUrl("/opengraph-image");

  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: title ? { default: computedTitle, template: `%s | ${siteConfig.siteName}` } : undefined,
    description: description || siteConfig.siteDescription,
    alternates: path ? { canonical: path } : undefined,
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.siteName,
      title: title || siteConfig.siteName,
      description: description || siteConfig.siteDescription,
      images: [{ url: fallbackImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: title || siteConfig.siteName,
      description: description || siteConfig.siteDescription,
      creator: siteConfig.twitterHandle,
      images: [fallbackImage],
    },
    robots: index
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        },
  };
}
