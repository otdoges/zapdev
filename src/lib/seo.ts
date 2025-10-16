import type { Metadata } from "next";

export const site = {
  name: "Zapdev",
  domain:
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://zapdev.link",
  twitter: "@zapdev",
  description:
    "Zapdev is a leading software development company specializing in building scalable web applications, mobile apps, and enterprise solutions.",
  keywords: [
    "software development",
    "web development",
    "mobile apps",
    "enterprise solutions",
    "Zapdev",
    "app development",
    "custom software",
  ] as string[],
} as const;

export function absoluteUrl(pathname: string = "/"): string {
  const base = site.domain.replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

export function buildDefaultMetadata(): Metadata {
  const title = {
    default: `${site.name} - Build Fast, Scale Smart`,
    template: `%s | ${site.name}`,
  } as const;

  return {
    metadataBase: new URL(site.domain),
    title,
    description: site.description,
    keywords: site.keywords,
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: site.domain,
      siteName: site.name,
      title: `${site.name} - Build Fast, Scale Smart`,
      description: site.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name} - Build Fast, Scale Smart`,
      description: site.description,
      creator: site.twitter,
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
    formatDetection: { email: false, address: false, telephone: false },
  } satisfies Metadata;
}

export function buildPageMetadata(input: {
  title: string;
  description?: string;
  canonicalPath?: string;
  imagePath?: string;
}): Metadata {
  const pageUrl = absoluteUrl(input.canonicalPath ?? "/");
  const imageUrl = input.imagePath ? absoluteUrl(input.imagePath) : undefined;

  return {
    title: input.title,
    description: input.description ?? site.description,
    alternates: { canonical: pageUrl },
    openGraph: {
      url: pageUrl,
      title: input.title,
      description: input.description ?? site.description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      siteName: site.name,
      type: "website",
    },
    twitter: {
      title: input.title,
      description: input.description ?? site.description,
      images: imageUrl ? [imageUrl] : undefined,
      card: "summary_large_image",
      creator: site.twitter,
    },
  } satisfies Metadata;
}

export function orgJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.domain,
    logo: absoluteUrl("/logo.svg"),
    description: site.description,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      availableLanguage: "English",
    },
    sameAs: [
      "https://twitter.com/zapdev",
      "https://linkedin.com/company/zapdev",
    ],
  } as const;
}
