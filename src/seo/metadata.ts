import type { Metadata } from "next";
import { siteConfig, toAbsoluteUrl } from "./config";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.defaultTitle,
    template: siteConfig.titleTemplate,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.siteUrl,
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
  },
  robots: {
    index: !siteConfig.noIndex,
    follow: !siteConfig.noIndex,
    googleBot: {
      index: !siteConfig.noIndex,
      follow: !siteConfig.noIndex,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: siteConfig.verification.google,
  },
};

export function createPageMetadata(input: {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
} = {}): Metadata {
  const { title, description, path, keywords } = input;
  const canonical = toAbsoluteUrl(path ?? "/");

  return {
    title: title ?? defaultMetadata.title!,
    description: description ?? siteConfig.description,
    keywords: keywords ?? siteConfig.keywords,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title: title ?? siteConfig.defaultTitle,
      description: description ?? siteConfig.description,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      title: title ?? siteConfig.defaultTitle,
      description: description ?? siteConfig.description,
      card: "summary_large_image",
      creator: siteConfig.twitterHandle,
    },
  };
}
