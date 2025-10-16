import { SEO_CONFIG } from "./config";
import type {
  OrganizationSchema,
  ArticleSchema,
  ProductSchema,
  SoftwareApplicationSchema,
  WebPageSchema,
  BreadcrumbListSchema,
  FAQPageSchema,
  HowToSchema,
  VideoObjectSchema,
  BreadcrumbItem,
  FAQItem,
} from "./types";

export function generateOrganizationSchema(): OrganizationSchema & { "@context": string } {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_CONFIG.company.name,
    legalName: SEO_CONFIG.company.legalName,
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}${SEO_CONFIG.logo.url}`,
    description: SEO_CONFIG.defaultDescription,
    foundingDate: SEO_CONFIG.company.foundingDate,
    slogan: SEO_CONFIG.company.slogan,
    sameAs: [
      SEO_CONFIG.social.twitterUrl,
      SEO_CONFIG.social.linkedin,
      SEO_CONFIG.social.github,
      SEO_CONFIG.social.facebook,
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SEO_CONFIG.contact.supportEmail,
        availableLanguage: SEO_CONFIG.structuredData.availableLanguage,
        areaServed: SEO_CONFIG.structuredData.areaServed,
      },
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: SEO_CONFIG.contact.salesEmail,
        availableLanguage: SEO_CONFIG.structuredData.availableLanguage,
        areaServed: SEO_CONFIG.structuredData.areaServed,
      },
    ],
  };
}

export function generateArticleSchema(options: {
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl?: string;
}): ArticleSchema & { "@context": string; "@type": "Article" } {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.headline,
    description: options.description,
    image: options.image,
    datePublished: options.datePublished,
    dateModified: options.dateModified || options.datePublished,
    author: {
      "@type": "Person",
      name: options.authorName,
      url: options.authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: SEO_CONFIG.company.name,
      logo: `${SEO_CONFIG.siteUrl}${SEO_CONFIG.logo.url}`,
    },
  };
}

export function generateProductSchema(options: {
  name: string;
  description: string;
  image?: string | string[];
  price?: string;
  currency?: string;
  availability?: string;
  ratingValue?: number;
  reviewCount?: number;
}): ProductSchema & { "@context": string } {
  const schema: ProductSchema & { "@context": string } = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: options.name,
    description: options.description,
    brand: {
      "@type": "Brand",
      name: SEO_CONFIG.siteName,
    },
  };

  if (options.image) {
    schema.image = options.image;
  }

  if (options.price && options.currency) {
    schema.offers = {
      "@type": "Offer",
      price: options.price,
      priceCurrency: options.currency,
      availability: options.availability || "https://schema.org/InStock",
      url: SEO_CONFIG.siteUrl,
    };
  }

  if (options.ratingValue && options.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: options.ratingValue,
      reviewCount: options.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function generateSoftwareApplicationSchema(options: {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem?: string;
  price?: string;
  currency?: string;
  ratingValue?: number;
  reviewCount?: number;
  screenshot?: string | string[];
  version?: string;
}): SoftwareApplicationSchema & { "@context": string } {
  const schema: SoftwareApplicationSchema & { "@context": string } = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: options.name,
    description: options.description,
    applicationCategory: options.applicationCategory,
    operatingSystem: options.operatingSystem || "Web Browser",
  };

  if (options.price && options.currency) {
    schema.offers = {
      "@type": "Offer",
      price: options.price,
      priceCurrency: options.currency,
    };
  }

  if (options.ratingValue && options.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: options.ratingValue,
      reviewCount: options.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (options.screenshot) {
    schema.screenshot = options.screenshot;
  }

  if (options.version) {
    schema.softwareVersion = options.version;
  }

  return schema;
}

export function generateWebPageSchema(options: {
  name: string;
  description: string;
  url: string;
  breadcrumbs?: BreadcrumbItem[];
}): WebPageSchema & { "@context": string } {
  const schema: WebPageSchema & { "@context": string } = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.name,
    description: options.description,
    url: options.url,
  };

  if (options.breadcrumbs && options.breadcrumbs.length > 0) {
    schema.breadcrumb = generateBreadcrumbSchema(options.breadcrumbs);
  }

  return schema;
}

export function generateBreadcrumbSchema(
  items: BreadcrumbItem[]
): BreadcrumbListSchema {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SEO_CONFIG.siteUrl}${item.url}`,
    })),
  };
}

export function generateFAQSchema(faqs: FAQItem[]): FAQPageSchema & { "@context": string } {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateHowToSchema(options: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; image?: string }>;
  totalTime?: string;
  cost?: { currency: string; value: string };
  tools?: string[];
  supplies?: string[];
}): HowToSchema & { "@context": string } {
  const schema: HowToSchema & { "@context": string } = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: options.name,
    description: options.description,
    step: options.steps.map((step, index) => ({
      "@type": "HowToStep",
      name: step.name,
      text: step.text,
      url: step.image ? `${SEO_CONFIG.siteUrl}${step.image}` : undefined,
      image: step.image,
    })),
  };

  if (options.totalTime) {
    schema.totalTime = options.totalTime;
  }

  if (options.cost) {
    schema.estimatedCost = {
      "@type": "MonetaryAmount",
      currency: options.cost.currency,
      value: options.cost.value,
    };
  }

  if (options.tools) {
    schema.tool = options.tools;
  }

  if (options.supplies) {
    schema.supply = options.supplies;
  }

  return schema;
}

export function generateVideoSchema(options: {
  name: string;
  description: string;
  thumbnailUrl: string | string[];
  uploadDate: string;
  contentUrl?: string;
  embedUrl?: string;
  duration?: string;
}): VideoObjectSchema & { "@context": string } {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: options.name,
    description: options.description,
    thumbnailUrl: options.thumbnailUrl,
    uploadDate: options.uploadDate,
    contentUrl: options.contentUrl,
    embedUrl: options.embedUrl,
    duration: options.duration,
    publisher: {
      "@type": "Organization",
      name: SEO_CONFIG.company.name,
      logo: `${SEO_CONFIG.siteUrl}${SEO_CONFIG.logo.url}`,
    },
  };
}

export function generateLocalBusinessSchema(options: {
  name?: string;
  description?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  priceRange?: string;
  openingHours?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: options.name || SEO_CONFIG.company.name,
    description: options.description || SEO_CONFIG.defaultDescription,
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}${SEO_CONFIG.logo.url}`,
    ...(options.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: options.address.street,
        addressLocality: options.address.city,
        addressRegion: options.address.state,
        postalCode: options.address.postalCode,
        addressCountry: options.address.country,
      },
    }),
    ...(options.phone && { telephone: options.phone }),
    priceRange: options.priceRange || SEO_CONFIG.structuredData.priceRange,
    openingHoursSpecification: options.openingHours || [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
  };
}
