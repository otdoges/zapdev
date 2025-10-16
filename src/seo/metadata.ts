import { Metadata } from "next";
import { SEO_CONFIG, ROBOTS_CONFIG } from "./config";
import { SEOMetadata } from "./types";

export function generateMetadata(options: SEOMetadata = {}): Metadata {
  const {
    title,
    description = SEO_CONFIG.defaultDescription,
    keywords = SEO_CONFIG.defaultKeywords,
    canonical,
    noIndex = false,
    noFollow = false,
    ogImage,
    twitterCard = "summary_large_image",
    publishedTime,
    modifiedTime,
    authors,
    section,
    tags,
  } = options;

  const pageTitle = title
    ? `${title} | ${SEO_CONFIG.siteName}`
    : SEO_CONFIG.defaultTitle;

  const canonicalUrl = canonical
    ? `${SEO_CONFIG.siteUrl}${canonical}`
    : SEO_CONFIG.siteUrl;

  const imageUrl =
    typeof ogImage === "string"
      ? ogImage
      : ogImage?.url || `${SEO_CONFIG.siteUrl}${SEO_CONFIG.ogImage.url}`;

  const metadata: Metadata = {
    title: pageTitle,
    description,
    keywords: Array.isArray(keywords) ? keywords : [keywords],
    authors: authors
      ? authors.map((name) => ({ name }))
      : [{ name: SEO_CONFIG.author }],
    creator: SEO_CONFIG.creator,
    publisher: SEO_CONFIG.publisher,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SEO_CONFIG.siteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "en-US": "/",
        "en-GB": "/en-gb",
        "es-ES": "/es",
        "fr-FR": "/fr",
        "de-DE": "/de",
      },
    },
    openGraph: {
      type: publishedTime ? "article" : "website",
      locale: SEO_CONFIG.locale,
      url: canonicalUrl,
      title: pageTitle,
      description,
      siteName: SEO_CONFIG.siteName,
      images: [
        {
          url: imageUrl,
          width: typeof ogImage === "object" ? ogImage.width : SEO_CONFIG.ogImage.width,
          height: typeof ogImage === "object" ? ogImage.height : SEO_CONFIG.ogImage.height,
          alt: typeof ogImage === "object" ? ogImage.alt : SEO_CONFIG.ogImage.alt,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags && { tags }),
    },
    twitter: {
      card: twitterCard,
      title: pageTitle,
      description,
      creator: SEO_CONFIG.social.twitter,
      site: SEO_CONFIG.social.twitter,
      images: [imageUrl],
    },
    robots: noIndex || noFollow
      ? {
          index: !noIndex,
          follow: !noFollow,
        }
      : ROBOTS_CONFIG,
    verification: SEO_CONFIG.verification,
  };

  return metadata;
}

export function generateArticleMetadata(options: {
  title: string;
  description: string;
  publishedTime: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
  category?: string;
  image?: string;
}): Metadata {
  return generateMetadata({
    ...options,
    section: options.category,
  });
}

export function generateProductMetadata(options: {
  title: string;
  description: string;
  image?: string;
  price?: string;
  currency?: string;
  availability?: string;
}): Metadata {
  return generateMetadata({
    title: options.title,
    description: options.description,
    ogImage: options.image,
  });
}

export function generateVideoMetadata(options: {
  title: string;
  description: string;
  thumbnail: string;
  duration?: string;
  uploadDate?: string;
}): Metadata {
  return generateMetadata({
    title: options.title,
    description: options.description,
    ogImage: options.thumbnail,
    twitterCard: "player",
  });
}

export function generateProfileMetadata(options: {
  name: string;
  bio: string;
  image?: string;
  username?: string;
}): Metadata {
  return generateMetadata({
    title: options.name,
    description: options.bio,
    ogImage: options.image,
  });
}

export function generatePageMetadata(pageName: string, customDescription?: string): Metadata {
  const descriptions: Record<string, string> = {
    home: "Build apps and websites through intelligent conversation with Zapdev's AI-powered development platform.",
    pricing: "Affordable pricing plans for individuals, teams, and enterprises. Start building with Zapdev today.",
    features: "Discover Zapdev's powerful features: AI-powered development, multi-framework support, real-time collaboration, and more.",
    documentation: "Complete documentation and guides to help you build amazing applications with Zapdev.",
    projects: "Manage and collaborate on your development projects with Zapdev's intuitive platform.",
    "sign-in": "Sign in to your Zapdev account and continue building amazing applications.",
    "sign-up": "Create your Zapdev account and start building apps and websites with AI assistance.",
  };

  return generateMetadata({
    title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
    description: customDescription || descriptions[pageName] || SEO_CONFIG.defaultDescription,
  });
}
