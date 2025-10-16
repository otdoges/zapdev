export interface SEOCheckResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export function checkMetaTags(html: string): SEOCheckResult[] {
  const results: SEOCheckResult[] = [];

  if (!html.includes('<title>')) {
    results.push({
      passed: false,
      message: 'Missing title tag',
      severity: 'error',
    });
  }

  if (!html.includes('name="description"')) {
    results.push({
      passed: false,
      message: 'Missing meta description',
      severity: 'error',
    });
  }

  if (!html.includes('property="og:')) {
    results.push({
      passed: false,
      message: 'Missing Open Graph tags',
      severity: 'warning',
    });
  }

  if (!html.includes('name="twitter:')) {
    results.push({
      passed: false,
      message: 'Missing Twitter Card tags',
      severity: 'warning',
    });
  }

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch && titleMatch[1].length > 60) {
    results.push({
      passed: false,
      message: 'Title tag is too long (over 60 characters)',
      severity: 'warning',
    });
  }

  const descriptionMatch = html.match(/name="description" content="(.*?)"/);
  if (descriptionMatch && descriptionMatch[1].length > 160) {
    results.push({
      passed: false,
      message: 'Meta description is too long (over 160 characters)',
      severity: 'warning',
    });
  }

  return results;
}

export function checkStructuredData(html: string): SEOCheckResult[] {
  const results: SEOCheckResult[] = [];

  if (!html.includes('application/ld+json')) {
    results.push({
      passed: false,
      message: 'No structured data found',
      severity: 'warning',
    });
  }

  const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
  if (jsonLdMatches) {
    jsonLdMatches.forEach((match, index) => {
      try {
        const jsonContent = match.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
        if (jsonContent) {
          JSON.parse(jsonContent);
          results.push({
            passed: true,
            message: `Valid structured data block ${index + 1}`,
            severity: 'info',
          });
        }
      } catch {
        results.push({
          passed: false,
          message: `Invalid JSON-LD syntax in block ${index + 1}`,
          severity: 'error',
        });
      }
    });
  }

  return results;
}

export function checkInternalLinks(html: string): SEOCheckResult[] {
  const results: SEOCheckResult[] = [];

  const internalLinks = (html.match(/<a[^>]*href="\/[^"]*"/g) || []).length;
  const externalLinks = (html.match(/<a[^>]*href="https?:\/\/[^"]*"/g) || []).length;

  if (internalLinks === 0) {
    results.push({
      passed: false,
      message: 'No internal links found',
      severity: 'warning',
    });
  } else {
    results.push({
      passed: true,
      message: `Found ${internalLinks} internal links`,
      severity: 'info',
    });
  }

  if (internalLinks > 0 && externalLinks > 0) {
    const ratio = internalLinks / (internalLinks + externalLinks);
    if (ratio < 0.5) {
      results.push({
        passed: false,
        message: 'More external links than internal links',
        severity: 'warning',
      });
    }
  }

  return results;
}

export function checkHeadings(html: string): SEOCheckResult[] {
  const results: SEOCheckResult[] = [];

  const h1Count = (html.match(/<h1[^>]*>/g) || []).length;

  if (h1Count === 0) {
    results.push({
      passed: false,
      message: 'No H1 heading found',
      severity: 'error',
    });
  } else if (h1Count > 1) {
    results.push({
      passed: false,
      message: 'Multiple H1 headings found (should be only one)',
      severity: 'warning',
    });
  } else {
    results.push({
      passed: true,
      message: 'Single H1 heading found',
      severity: 'info',
    });
  }

  const h2Count = (html.match(/<h2[^>]*>/g) || []).length;
  if (h2Count === 0) {
    results.push({
      passed: false,
      message: 'No H2 headings found',
      severity: 'warning',
    });
  }

  return results;
}

export function checkImages(html: string): SEOCheckResult[] {
  const results: SEOCheckResult[] = [];

  const images = html.match(/<img[^>]*>/g) || [];
  const imagesWithoutAlt = images.filter(img => !img.includes('alt=')).length;

  if (imagesWithoutAlt > 0) {
    results.push({
      passed: false,
      message: `${imagesWithoutAlt} images missing alt text`,
      severity: 'error',
    });
  }

  const nextImages = (html.match(/<Image[^>]*>/g) || []).length;
  if (nextImages > 0) {
    results.push({
      passed: true,
      message: `Using Next.js Image component for ${nextImages} images`,
      severity: 'info',
    });
  }

  return results;
}

export function performSEOAudit(html: string): {
  passed: number;
  failed: number;
  warnings: number;
  results: SEOCheckResult[];
} {
  const allResults = [
    ...checkMetaTags(html),
    ...checkStructuredData(html),
    ...checkInternalLinks(html),
    ...checkHeadings(html),
    ...checkImages(html),
  ];

  const passed = allResults.filter(r => r.passed && r.severity === 'info').length;
  const failed = allResults.filter(r => !r.passed && r.severity === 'error').length;
  const warnings = allResults.filter(r => !r.passed && r.severity === 'warning').length;

  return {
    passed,
    failed,
    warnings,
    results: allResults,
  };
}
