# SEO Quick Reference Guide

## 🚀 Quick Start

### Adding Metadata to a New Page

```typescript
import type { Metadata } from "next";
import { generateMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Your Page Title",
  description: "Your page description (160 chars max)",
  keywords: ["keyword1", "keyword2", "keyword3"],
  canonical: "/your-page-url",
});

export default function YourPage() {
  return <div>Your content</div>;
}
```

### Adding Structured Data

```typescript
import { StructuredData } from "@/components/seo/structured-data";
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data";

export default function YourPage() {
  return (
    <>
      <StructuredData 
        data={generateBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Your Page", url: "/your-page" },
        ])} 
      />
      {/* Your content */}
    </>
  );
}
```

### Adding Internal Links

```typescript
import { InternalLinks } from "@/components/seo/internal-links";
import { getRelatedFrameworks } from "@/lib/seo/internal-linking";

export default function YourPage() {
  const relatedLinks = getRelatedFrameworks('nextjs');
  
  return (
    <div>
      {/* Your content */}
      <InternalLinks 
        title="Related Frameworks"
        links={relatedLinks} 
      />
    </div>
  );
}
```

## 📚 Available Utilities

### Metadata Generators

```typescript
import { 
  generateMetadata,
  generateProjectMetadata,
  generateFrameworkMetadata 
} from "@/lib/seo/metadata";

// Basic metadata
const metadata = generateMetadata({
  title: "Title",
  description: "Description",
  keywords: ["keyword"],
  canonical: "/url",
  ogType: "website", // or "article", "product"
  noindex: false,
  nofollow: false,
});

// Project metadata (dynamic)
const projectMeta = generateProjectMetadata({
  name: "Project Name",
  framework: "nextjs",
  updatedAt: new Date(),
});

// Framework metadata
const frameworkMeta = generateFrameworkMetadata("nextjs");
```

### Structured Data Schemas

```typescript
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
  generateHowToSchema,
  generateFAQSchema,
  generateProductSchema,
  generateSoftwareApplicationSchema,
} from "@/lib/seo/structured-data";

// Organization schema
const org = generateOrganizationSchema();

// Breadcrumb schema
const breadcrumb = generateBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Page", url: "/page" },
]);

// Article schema
const article = generateArticleSchema({
  title: "Article Title",
  description: "Article description",
  publishedAt: "2025-10-16T00:00:00Z",
  modifiedAt: "2025-10-16T00:00:00Z",
  authorName: "Author Name",
  url: "/blog/article",
  imageUrl: "/article-image.jpg",
});

// HowTo schema
const howTo = generateHowToSchema({
  name: "How to Build with AI",
  description: "Step-by-step guide",
  steps: [
    { name: "Step 1", text: "Description" },
    { name: "Step 2", text: "Description" },
  ],
});

// FAQ schema
const faq = generateFAQSchema([
  { question: "Question?", answer: "Answer" },
]);
```

### Internal Linking

```typescript
import {
  getRelatedFrameworks,
  getRelatedUseCases,
  getRelatedResources,
  generateInternalLinks,
} from "@/lib/seo/internal-linking";

// Get related frameworks (max 3)
const frameworks = getRelatedFrameworks('nextjs');

// Get related use cases (default 3)
const useCases = getRelatedUseCases(5); // Get 5

// Get related resources
const resources = getRelatedResources(3);

// Generate links by type
const links = generateInternalLinks('framework', 'nextjs');
```

### SEO Monitoring

```typescript
import {
  checkMetaTags,
  checkStructuredData,
  checkInternalLinks,
  checkHeadings,
  checkImages,
  performSEOAudit,
} from "@/lib/seo/monitoring";

// Individual checks
const metaResults = checkMetaTags(htmlString);
const structuredResults = checkStructuredData(htmlString);
const linkResults = checkInternalLinks(htmlString);
const headingResults = checkHeadings(htmlString);
const imageResults = checkImages(htmlString);

// Full audit
const audit = performSEOAudit(htmlString);
console.log(`Passed: ${audit.passed}`);
console.log(`Failed: ${audit.failed}`);
console.log(`Warnings: ${audit.warnings}`);
audit.results.forEach(r => console.log(r.message));
```

## 🎨 Available Components

### StructuredData

```typescript
import { StructuredData } from "@/components/seo/structured-data";

<StructuredData data={schemaObject} />
// or multiple schemas
<StructuredData data={[schema1, schema2]} />
```

### InternalLinks

```typescript
import { InternalLinks } from "@/components/seo/internal-links";

<InternalLinks 
  title="Related Content"
  links={[
    { title: "Link", href: "/url", description: "Description" }
  ]} 
/>
```

### InlineLinks

```typescript
import { InlineLinks } from "@/components/seo/internal-links";

<InlineLinks 
  links={[
    { title: "Link", href: "/url" }
  ]} 
/>
```

### Breadcrumb

```typescript
import { Breadcrumb } from "@/components/seo/internal-links";

<Breadcrumb 
  items={[
    { name: "Home", href: "/" },
    { name: "Current Page" }, // No href for current
  ]} 
/>
```

### FooterLinks

```typescript
import { FooterLinks } from "@/components/seo/footer-links";

<FooterLinks /> // Adds full footer navigation
```

## 📋 SEO Checklist for New Pages

### Required
- [ ] Add page to sitemap (automatic for dynamic routes)
- [ ] Generate unique metadata (title, description, keywords)
- [ ] Add canonical URL
- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags
- [ ] Add at least one structured data schema
- [ ] Include H1 heading
- [ ] Add alt text to all images
- [ ] Include internal links
- [ ] Add breadcrumb navigation

### Recommended
- [ ] Keep title under 60 characters
- [ ] Keep description under 160 characters
- [ ] Use descriptive URLs (kebab-case)
- [ ] Include related content section
- [ ] Add FAQ schema if applicable
- [ ] Add HowTo schema for tutorials
- [ ] Include call-to-action
- [ ] Optimize images (use Next/Image)
- [ ] Test mobile responsiveness
- [ ] Check Core Web Vitals

### Optional
- [ ] Add Article schema for blog posts
- [ ] Add Product schema for product pages
- [ ] Add video schema for video content
- [ ] Include table of contents for long content
- [ ] Add estimated reading time
- [ ] Include social sharing buttons

## 🎯 SEO Best Practices

### Titles
- **Format**: Primary Keyword - Secondary Keyword | Brand
- **Length**: 50-60 characters
- **Example**: "Build Next.js Apps with AI | Zapdev"

### Descriptions
- **Format**: Action-oriented, includes keywords, clear value prop
- **Length**: 150-160 characters
- **Example**: "Create Next.js applications with AI assistance. Build React Server Components, App Router pages, and full-stack apps through chat."

### URLs
- **Format**: /category/subcategory/page-name
- **Rules**: Lowercase, hyphens, descriptive
- **Example**: /frameworks/nextjs

### Headings
- **H1**: One per page, includes primary keyword
- **H2**: Section headings, includes related keywords
- **H3**: Subsection headings
- **Structure**: Hierarchical (H1 > H2 > H3)

### Keywords
- **Primary**: Main topic (high volume)
- **Secondary**: Related topics (medium volume)
- **Long-tail**: Specific phrases (low volume, high intent)
- **Density**: Natural, 1-2% of content

### Images
- **Alt text**: Descriptive, includes keywords when relevant
- **Format**: WebP, AVIF (Next.js auto-converts)
- **Size**: Optimized, lazy-loaded
- **CDN**: Use for faster delivery

### Links
- **Internal**: Link to related content
- **External**: Link to authoritative sources
- **Anchor text**: Descriptive, not "click here"
- **Follow/nofollow**: Follow internal, nofollow external

## 🔍 Testing & Validation

### Tools
1. **Google Search Console**: Submit sitemap, monitor indexing
2. **Schema Validator**: https://validator.schema.org/
3. **Rich Results Test**: https://search.google.com/test/rich-results
4. **PageSpeed Insights**: https://pagespeed.web.dev/
5. **Lighthouse**: Built into Chrome DevTools

### Commands
```bash
# Build and check for errors
npm run build

# Run in production mode
npm run start

# Check sitemap
curl http://localhost:3000/sitemap.xml

# Check robots.txt
curl http://localhost:3000/robots.txt
```

### Validation Steps
1. Validate structured data: https://validator.schema.org/
2. Test rich results: https://search.google.com/test/rich-results
3. Check mobile-friendliness: https://search.google.com/test/mobile-friendly
4. Test page speed: https://pagespeed.web.dev/
5. Audit with Lighthouse (SEO tab)

## 📊 Monitoring Metrics

### Key Metrics
- **Organic Traffic**: Sessions from search engines
- **Rankings**: Position for target keywords
- **CTR**: Click-through rate in SERPs
- **Impressions**: How often page appears in search
- **Core Web Vitals**: LCP, FID, CLS
- **Crawl Errors**: From Search Console
- **Index Coverage**: Pages indexed vs total

### Tools to Use
- Google Search Console (required)
- Google Analytics 4 (required)
- PageSpeed Insights (performance)
- Ahrefs/SEMrush (optional, for competitive analysis)

## 🐛 Common Issues & Solutions

### Issue: Pages not indexing
**Solution**: Check robots.txt, submit sitemap, verify no noindex tags

### Issue: Duplicate content
**Solution**: Add canonical URLs, use 301 redirects

### Issue: Slow page speed
**Solution**: Optimize images, enable compression, minimize JS/CSS

### Issue: Poor mobile experience
**Solution**: Use responsive design, test on devices, check touch targets

### Issue: Low CTR
**Solution**: Improve title/description, add rich snippets, match search intent

### Issue: High bounce rate
**Solution**: Improve page load speed, match content to keywords, add internal links

## 📞 Support

For questions or issues:
1. Check this guide
2. Review SEO_DOCUMENTATION.md
3. Check implementation examples in codebase
4. Contact development team

---

**Last Updated**: 2025-10-16
