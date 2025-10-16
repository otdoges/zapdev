# SEO Module

Comprehensive SEO utilities and helpers for Zapdev. This module provides everything needed for world-class search engine optimization.

## Features

- 🎯 **Metadata Generation**: Complete Next.js metadata generation with type safety
- 🏗️ **Structured Data**: Schema.org JSON-LD for all major types
- 📱 **Social Media**: Open Graph and Twitter Card optimization
- 🗺️ **Sitemaps**: Dynamic sitemap generation utilities
- 🍞 **Breadcrumbs**: Automatic breadcrumb generation with Schema.org
- 🤖 **Robots.txt**: Smart robots.txt generation with AI bot blocking
- 📊 **Analytics**: Easy integration with GA, GTM, Clarity, and more
- 🎨 **Presets**: Ready-to-use metadata for common pages

## Installation

All files are in `/src/seo/`. Import what you need:

```typescript
import { generateMetadata, SEO_CONFIG } from "@/seo";
```

## Quick Start

### Basic Page Metadata

```typescript
import { generateMetadata } from "@/seo";

export const metadata = generateMetadata({
  title: "About Us",
  description: "Learn about Zapdev and our mission",
  canonical: "/about",
});
```

### Using Presets

```typescript
import { homePageMetadata, pricingPageMetadata } from "@/seo/presets";

export const metadata = homePageMetadata;
```

### Structured Data

```typescript
import { generateOrganizationSchema, generateArticleSchema } from "@/seo";

const organizationSchema = generateOrganizationSchema();
const articleSchema = generateArticleSchema({
  headline: "10 Tips for Better Development",
  description: "Expert tips for developers",
  image: "/images/article.jpg",
  datePublished: "2024-10-16",
  authorName: "John Doe",
});
```

### Breadcrumbs

```typescript
import { generateBreadcrumbs, generateBreadcrumbJsonLd } from "@/seo";

const breadcrumbs = generateBreadcrumbs("/blog/category/tutorials");
const breadcrumbSchema = generateBreadcrumbJsonLd(breadcrumbs);
```

### Open Graph

```typescript
import { generateArticleOG, generateProductOG } from "@/seo";

const ogTags = generateArticleOG({
  title: "Amazing Article",
  description: "Read this amazing article",
  image: "/og-image.jpg",
  publishedTime: "2024-10-16T10:00:00Z",
  authors: ["John Doe"],
  tags: ["development", "tutorial"],
});
```

### Twitter Cards

```typescript
import { generateSummaryLargeImageCard } from "@/seo";

const twitterCard = generateSummaryLargeImageCard({
  title: "Check this out!",
  description: "Amazing content",
  image: "/twitter-card.jpg",
});
```

### Sitemap Generation

```typescript
import { generateStaticSitemap, generateDynamicSitemapEntries, mergeSitemaps } from "@/seo";

export default function sitemap() {
  const staticPages = generateStaticSitemap();
  const blogPosts = generateDynamicSitemapEntries(
    posts,
    (post) => `/blog/${post.slug}`,
    { priority: 0.7, changeFrequency: "weekly" }
  );
  
  return mergeSitemaps(staticPages, blogPosts);
}
```

### Robots.txt

```typescript
import { generateRobots } from "@/seo";

export default function robots() {
  return generateRobots();
}
```

## Module Structure

```
/src/seo/
├── config.ts              # SEO configuration and constants
├── types.ts               # TypeScript type definitions
├── metadata.ts            # Metadata generation functions
├── structured-data.ts     # Schema.org structured data
├── open-graph.ts          # Open Graph tags
├── twitter-card.ts        # Twitter Card tags
├── breadcrumbs.ts         # Breadcrumb generation
├── utils.ts               # Utility functions
├── sitemap-utils.ts       # Sitemap generation helpers
├── robots.ts              # Robots.txt generation
├── presets.ts             # Pre-configured metadata
├── analytics.ts           # Analytics integration
└── index.ts               # Main exports
```

## Configuration

Edit `/src/seo/config.ts` to customize:

- Site name and URL
- Default metadata
- Social media handles
- Verification codes
- Company information
- Structured data defaults

## Best Practices

1. **Always use canonical URLs** to prevent duplicate content
2. **Include structured data** on all major pages
3. **Optimize images** for Open Graph (1200x630px recommended)
4. **Use descriptive titles** (50-60 characters)
5. **Write compelling descriptions** (150-160 characters)
6. **Add breadcrumbs** to improve navigation and SEO
7. **Generate sitemaps** dynamically for large sites
8. **Block AI bots** if you don't want content used for training
9. **Track conversions** with analytics events
10. **Test metadata** with social media debuggers

## Testing Tools

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Schema.org Validator](https://validator.schema.org/)

## Advanced Usage

### Custom Page Types

```typescript
import { generateMetadata } from "@/seo";

export function generateLandingPageMetadata(title: string, features: string[]) {
  return generateMetadata({
    title,
    description: `${title} with ${features.join(", ")}`,
    keywords: [...features, "Zapdev", "AI development"],
  });
}
```

### Dynamic Structured Data

```typescript
import { generateProductSchema } from "@/seo";

export function getProductSchema(product: Product) {
  return generateProductSchema({
    name: product.name,
    description: product.description,
    image: product.images,
    price: product.price.toString(),
    currency: "USD",
    availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    ratingValue: product.rating,
    reviewCount: product.reviewCount,
  });
}
```

### Multi-Language Support

```typescript
import { generateAlternateLanguageLinks } from "@/seo";

const alternates = generateAlternateLanguageLinks("/features");
// Returns links for en-US, es-ES, fr-FR, de-DE
```

## Performance

All SEO utilities are:
- ✅ Server-side only (no client bundle impact)
- ✅ Type-safe with TypeScript
- ✅ Tree-shakeable (import only what you need)
- ✅ Zero runtime dependencies

## Support

For issues or questions about SEO implementation, check:
1. This README
2. Next.js metadata documentation
3. Schema.org documentation
4. Open an issue in the project repo

---

Built with ❤️ by the Zapdev team
