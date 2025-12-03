# ZapDev SEO Audit - Action Items & Roadmap
**Date**: December 3, 2025
**Status**: Ready for Implementation

---

## 🔴 CRITICAL ISSUES (This Week)

### Issue #1: Missing OG Image Assets
**Priority**: CRITICAL
**Deadline**: This Week
**Owner**: Design + Frontend

**Tasks**:
- [ ] Create `/public/og-image.png` (1200x630px) - Main OG image
- [ ] Create `/public/og-images/` directory
- [ ] Design OG images for each framework (Next.js, React, Vue, Angular, Svelte)
- [ ] Design OG images for each solution
- [ ] Verify all paths reference correct image locations
- [ ] Test social media previews with Twitter/Facebook debuggers

**Files to Update**:
- `src/app/layout.tsx` - Confirm paths
- `src/app/frameworks/[slug]/page.tsx` - Confirm paths
- `src/app/solutions/[slug]/page.tsx` - Confirm paths

**Expected Result**: All social media shares show proper preview images

---

### Issue #2: Implement Sitemap XML Endpoint
**Priority**: CRITICAL
**Deadline**: This Week
**Owner**: Backend Developer

**Tasks**:
- [ ] Create `/src/app/sitemap.xml/route.ts`
- [ ] Export XML format from existing sitemap generator
- [ ] Set proper cache headers (s-maxage=3600)
- [ ] Test endpoint: `curl https://zapdev.link/sitemap.xml`
- [ ] Verify schema validation at schema.org
- [ ] Submit to Google Search Console
- [ ] Submit to Bing Webmaster Tools

**Implementation Reference**:
```typescript
// src/app/sitemap.xml/route.ts
import { MetadataRoute } from 'next';
import { sitemap } from '@/app/sitemap';

export async function GET() {
  const urls = await sitemap();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${url.changeFrequency}</changefreq>
    <priority>${url.priority}</priority>
  </url>
  `).join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
```

**Expected Result**: Search engines can crawl all pages via sitemap.xml

---

### Issue #3: Fix Broken Sign-up Link
**Priority**: CRITICAL
**Deadline**: This Week
**Owner**: Frontend Developer

**Task**:
- [ ] Identify correct sign-up/auth URL
- [ ] Update `src/app/solutions/page.tsx:110`
- [ ] Test link works
- [ ] Verify in all solutions pages

**Current**: `href="/home/sign-up"`
**Options**:
- [ ] Use existing auth route
- [ ] Use dashboard link
- [ ] Use external auth link

**Expected Result**: No 404 errors on click

---

### Issue #4: Complete Image Alt Text Audit
**Priority**: CRITICAL
**Deadline**: This Week
**Owner**: Content/Frontend Team

**Tasks**:
- [ ] Audit all image elements in codebase
- [ ] Create alt text standards document
- [ ] Add alt text to every image
- [ ] Verify with WAVE accessibility tool
- [ ] Add to component documentation

**Alt Text Guidelines**:
```
Format: "[Framework/Feature Name]: [Clear description of image content]"

Examples:
- "Next.js: Full-stack React application with server-side rendering"
- "React: Component library with Chakra UI styling"
- "Vue: Progressive web application with Vuetify components"
- "Figma: Design-to-code conversion interface"
```

**Files to Check**:
- All page.tsx files
- Component library files
- Dashboard components

**Expected Result**: All images have descriptive alt text

---

## 🟠 HIGH PRIORITY ISSUES (Next 2 Weeks)

### Issue #5: Add Dashboard Page Metadata
**Priority**: HIGH
**Deadline**: Week 2
**Owner**: Backend Developer

**Files to Update**:
1. `src/app/dashboard/10x-swe/page.tsx`
   ```typescript
   export const metadata: Metadata = {
     title: '10x SWE Dashboard',
     description: 'Your personal AI development assistant dashboard',
     robots: { index: false }  // Protect from indexing
   };
   ```

2. `src/app/dashboard/subscription/page.tsx`
   ```typescript
   export const metadata: Metadata = {
     title: 'Subscription Settings',
     description: 'Manage your Zapdev subscription and billing',
     robots: { index: false }
   };
   ```

**Verification**:
- [ ] Metadata shows in browser title
- [ ] Robots noindex respected

---

### Issue #6: Accessibility Improvements
**Priority**: HIGH
**Deadline**: Week 2-3
**Owner**: Frontend Developer

**Tasks**:
- [ ] Add `aria-label` to all navigation items
- [ ] Add `aria-current="page"` to active nav links
- [ ] Add `role` attributes to custom components
- [ ] Add `aria-label` to interactive buttons
- [ ] Test with Axe DevTools
- [ ] Run Lighthouse accessibility audit

**Code Pattern**:
```typescript
<nav aria-label="Main navigation">
  <Link
    href="/frameworks"
    aria-current={pathname === '/frameworks' ? 'page' : undefined}
  >
    Frameworks
  </Link>
</nav>
```

**Expected Result**: Accessibility score 90+

---

### Issue #7: Add Image Priority Hints
**Priority**: HIGH
**Deadline**: Week 2
**Owner**: Frontend Developer

**Files to Update**:
- `src/app/(home)/page.tsx` - Hero section images
- `src/app/frameworks/page.tsx` - Framework cards above fold
- `src/app/solutions/page.tsx` - Solution cards above fold

**Implementation**:
```typescript
<OptimizedImage
  src="/hero-logo.svg"
  alt="ZapDev Logo"
  priority={true}  // ✅ Add this for above-the-fold images
  width={100}
  height={100}
/>
```

**Expected Result**: LCP scores improve by 5-10%

---

### Issue #8: Add Footer with Internal Links
**Priority**: HIGH
**Deadline**: Week 2
**Owner**: Frontend Developer

**Structure**:
```
Footer
├── Product Links
│   ├── Frameworks
│   ├── Solutions
│   ├── Showcase
│   └── Pricing
├── Company Links
│   ├── About
│   ├── Blog
│   ├── Careers
│   └── Contact
├── Legal Links
│   ├── Privacy Policy
│   ├── Terms of Service
│   └── AI Safety
└── Social Links
    ├── Twitter
    ├── GitHub
    └── LinkedIn
```

**SEO Benefit**: Improves internal link equity distribution

---

### Issue #9: Add Related Solutions Section
**Priority**: HIGH
**Deadline**: Week 2-3
**Owner**: Frontend Developer

**Implementation** (similar to framework detail):
```typescript
// In src/app/solutions/[slug]/page.tsx
const relatedSolutions = solutions
  .filter(s => s.id !== solution.id && s.category === solution.category)
  .slice(0, 3);

return (
  <>
    <SolutionContent solution={solution} />
    <RelatedSolutions solutions={relatedSolutions} />
  </>
);
```

**Expected Result**: Deeper site engagement, lower bounce rate

---

## 🟡 MEDIUM PRIORITY ISSUES (Next 4 Weeks)

### Issue #10: Resource Hints for External APIs
**Priority**: MEDIUM
**Deadline**: Week 3-4
**Owner**: DevOps/Frontend

**Update** `src/app/layout.tsx`:
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Existing head content */}
        <link rel="preconnect" href="https://ai-gateway.vercel.sh" />
        <link rel="preconnect" href="https://api.convex.dev" />
        <link rel="dns-prefetch" href="https://vercel.com" />
      </head>
      {/* ... */}
    </html>
  );
}
```

**APIs to Add**:
- [ ] `https://ai-gateway.vercel.sh`
- [ ] `https://api.convex.dev`
- [ ] `https://sandbox.e2b.dev` (if applicable)
- [ ] `https://clerk.com` (if used)

**Expected Result**: Faster API response times

---

### Issue #11: Fix Title Length Optimization
**Priority**: MEDIUM
**Deadline**: Week 3-4
**Owner**: Content/Frontend

**Current Issues**:
- "Zapdev - AI-Powered Development Platform | Build Apps 10x Faster" (67 chars)

**Optimization**:
- Aim for 55-60 characters for mobile
- Prioritize primary keywords first
- Monitor in Google Search Console

**Updated Titles**:
- [ ] Home: "AI-Powered Web App Development | Zapdev" (43 chars)
- [ ] Frameworks: "Multi-Framework Support | Build with Zapdev" (43 chars)
- [ ] Solutions: "AI Development Solutions | Zapdev" (34 chars)

---

### Issue #12: Heading Hierarchy Standardization
**Priority**: MEDIUM
**Deadline**: Week 4
**Owner**: Frontend Developer

**Audit All Pages**:
- [ ] `src/app/(home)/page.tsx`
- [ ] `src/app/frameworks/page.tsx`
- [ ] `src/app/solutions/page.tsx`
- [ ] `src/app/showcase/page.tsx`
- [ ] `src/app/ai-info/page.tsx`

**Ensure**:
- [ ] One H1 per page
- [ ] H2 for major sections
- [ ] H3 for subsections
- [ ] No skipped levels (H1 → H3 is bad)
- [ ] Semantic tags, not divs

---

### Issue #13: Implement Internal Link Generator
**Priority**: MEDIUM
**Deadline**: Week 4
**Owner**: Frontend Developer

**Location**: `src/lib/seo.ts:224-234` (currently unused)

**Usage Places**:
1. Footer navigation
2. Sidebar (if applicable)
3. Related content sections
4. Breadcrumb alternatives

**Implementation**:
```typescript
// In footer component
const internalLinks = generateInternalLinks(pathname);

return (
  <footer>
    <nav>
      {internalLinks.map(link => (
        <Link key={link.href} href={link.href}>
          {link.text}
        </Link>
      ))}
    </nav>
  </footer>
);
```

---

### Issue #14: Robots.txt Cleanup (Optional)
**Priority**: MEDIUM
**Deadline**: Week 4
**Owner**: DevOps

**Action**: Consider consolidating redundant rules for clarity
- Either remove Allow rules (if using default Allow: /)
- Or add explicit bot declarations for Googlebot, Bingbot

---

## 🟢 LOW PRIORITY ISSUES (Month 2+)

### Issue #15: Performance Dashboard
**Priority**: LOW
**Deadline**: Month 2
**Owner**: DevOps/Analytics

**Tasks**:
- [ ] Query historical Web Vitals data
- [ ] Create `/vitals` analytics page
- [ ] Display trends over time
- [ ] Add performance benchmarks

**Benefits**: Transparency, trust, continuous monitoring

---

### Issue #16: Add OG Image Attributes
**Priority**: LOW
**Deadline**: Month 2
**Owner**: Frontend

**Add to OpenGraph**:
```typescript
og:image:width: 1200
og:image:height: 630
og:image:type: "image/png"
```

---

### Issue #17: API Documentation for AI Bots
**Priority**: LOW
**Deadline**: Month 2
**Owner**: Backend/Content

**Enhance** `/ai-info` page with:
- [ ] Machine-readable API endpoints
- [ ] Rate limiting info
- [ ] Authentication methods
- [ ] Response schemas

---

### Issue #18: LinkedIn-Specific Optimization
**Priority**: LOW
**Deadline**: Month 2
**Owner**: Content

**Add**:
- [ ] LinkedIn Open Graph tags
- [ ] Sharing-optimized descriptions
- [ ] Professional imagery

---

## TRACKING & VERIFICATION

### Quality Assurance Checklist
- [ ] All links tested (broken link checker)
- [ ] Social previews validated (Twitter/Facebook tools)
- [ ] Structured data validated (schema.org validator)
- [ ] Accessibility audit (Axe DevTools, WAVE)
- [ ] Performance audit (Lighthouse)
- [ ] Core Web Vitals monitored (Web Vitals dashboard)

### Search Engine Submission
- [ ] Google Search Console - Sitemap submitted
- [ ] Bing Webmaster Tools - Sitemap submitted
- [ ] XML sitemap verified
- [ ] robots.txt verified
- [ ] Canonical tags verified

### Monitoring Tools
- [ ] Google Search Console - Query performance
- [ ] Google Analytics 4 - User behavior
- [ ] Vercel Analytics - Performance metrics
- [ ] Sentry - Error tracking
- [ ] OpenTelemetry - Distributed tracing

---

## IMPLEMENTATION TIMELINE SUMMARY

```
Week 1 (Immediate)
├── Create OG image assets
├── Implement sitemap.xml endpoint
├── Fix broken links
└── Complete alt text audit

Week 2-3 (High Priority)
├── Add accessibility improvements
├── Implement priority hints
├── Create footer links
├── Add dashboard metadata
└── Add related solutions

Week 4 (Medium Priority)
├── Resource hints setup
├── Title optimization
├── Heading hierarchy fixes
├── Internal link generator
└── Robots.txt review

Month 2+ (Low Priority)
├── Performance dashboard
├── OG image attributes
├── AI bot documentation
└── LinkedIn optimization
```

---

## RESPONSIBLE TEAMS

| Area | Owner | Deadline |
|------|-------|----------|
| Design (OG Images) | Design Team | Week 1 |
| Backend (Sitemap) | Backend Dev | Week 1 |
| Frontend (Links, Alt Text, Images) | Frontend Dev | Week 1-2 |
| Accessibility | Frontend Dev | Week 2-3 |
| Content | Content Team | Week 2-4 |
| DevOps (Headers, Hints) | DevOps | Week 3 |
| Analytics | Data Team | Month 2 |

---

## SUCCESS METRICS

After implementation, target these improvements:

| Metric | Current | Target | Tool |
|--------|---------|--------|------|
| SEO Score | 7.8/10 | 9.0/10 | Lighthouse |
| Accessibility | Unknown | 90+ | Axe/WAVE |
| LCP | Unknown | <2.5s | Web Vitals |
| Core Web Vitals | Good | All Green | Search Console |
| Internal Links | 8/10 | 9.5/10 | SEMrush |
| Sitemap Coverage | Missing | 100% | Search Console |
| Social Shares | No previews | Full previews | Twitter/FB |

---

## NOTES

- **Frontend Stability**: Per instructions, NO changes to frontend UI/UX - only SEO optimizations
- **Audit Folder**: All findings documented in `/audit/` directory
- **Next Review**: 2026-01-03
- **Contact**: Caleb Goodnite & Jackson Wheeler (Slack notification sent)

---

**Audit Completed**: 2025-12-03
**Status**: Ready for Team Implementation
