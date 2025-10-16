import { Metadata } from "next";

export interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  ogImage?: string | OGImage;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

export interface OGImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ArticleSchema {
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified?: string;
  author: PersonSchema | PersonSchema[];
  publisher: OrganizationSchema;
}

export interface PersonSchema {
  "@type": "Person";
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  worksFor?: OrganizationSchema;
}

export interface OrganizationSchema {
  "@type": "Organization";
  name: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  address?: PostalAddressSchema;
  contactPoint?: ContactPointSchema[];
}

export interface PostalAddressSchema {
  "@type": "PostalAddress";
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface ContactPointSchema {
  "@type": "ContactPoint";
  telephone?: string;
  contactType: string;
  email?: string;
  availableLanguage?: string | string[];
  areaServed?: string | string[];
}

export interface ProductSchema {
  "@type": "Product";
  name: string;
  description: string;
  image?: string | string[];
  brand?: {
    "@type": "Brand";
    name: string;
  };
  offers?: OfferSchema | OfferSchema[];
  aggregateRating?: AggregateRatingSchema;
  review?: ReviewSchema[];
}

export interface OfferSchema {
  "@type": "Offer";
  price?: string;
  priceCurrency?: string;
  availability?: string;
  url?: string;
  priceValidUntil?: string;
}

export interface AggregateRatingSchema {
  "@type": "AggregateRating";
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface ReviewSchema {
  "@type": "Review";
  author: PersonSchema;
  datePublished: string;
  reviewBody: string;
  reviewRating: {
    "@type": "Rating";
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
  };
}

export interface SoftwareApplicationSchema {
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem?: string;
  offers?: OfferSchema;
  aggregateRating?: AggregateRatingSchema;
  screenshot?: string | string[];
  softwareVersion?: string;
  releaseNotes?: string;
}

export interface WebPageSchema {
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  breadcrumb?: BreadcrumbListSchema;
  mainEntity?: Record<string, unknown>;
  speakable?: {
    "@type": "SpeakableSpecification";
    cssSelector?: string[];
    xpath?: string[];
  };
}

export interface BreadcrumbListSchema {
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbItemSchema[];
}

export interface BreadcrumbItemSchema {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}

export interface FAQPageSchema {
  "@type": "FAQPage";
  mainEntity: FAQItemSchema[];
}

export interface FAQItemSchema {
  "@type": "Question";
  name: string;
  acceptedAnswer: {
    "@type": "Answer";
    text: string;
  };
}

export interface HowToSchema {
  "@type": "HowTo";
  name: string;
  description: string;
  step: HowToStepSchema[];
  totalTime?: string;
  estimatedCost?: {
    "@type": "MonetaryAmount";
    currency: string;
    value: string;
  };
  tool?: string | string[];
  supply?: string | string[];
}

export interface HowToStepSchema {
  "@type": "HowToStep";
  name: string;
  text: string;
  url?: string;
  image?: string;
}

export interface VideoObjectSchema {
  "@type": "VideoObject";
  name: string;
  description: string;
  thumbnailUrl: string | string[];
  uploadDate: string;
  contentUrl?: string;
  embedUrl?: string;
  duration?: string;
  publisher?: OrganizationSchema;
}

export type StructuredDataSchema =
  | ArticleSchema
  | PersonSchema
  | OrganizationSchema
  | ProductSchema
  | SoftwareApplicationSchema
  | WebPageSchema
  | BreadcrumbListSchema
  | FAQPageSchema
  | HowToSchema
  | VideoObjectSchema;
