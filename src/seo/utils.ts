import { SEO_CONFIG } from "./config";

export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
}

export function getAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return getCanonicalUrl(path);
}

export function generateImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
}

export function truncateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3).trim() + "...";
}

export function generateKeywords(baseKeywords: string[], additionalKeywords: string[] = []): string[] {
  const allKeywords = [...SEO_CONFIG.defaultKeywords, ...baseKeywords, ...additionalKeywords];
  return [...new Set(allKeywords)];
}

export function formatISO8601Duration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `PT${hours}H${mins}M`;
  } else if (hours > 0) {
    return `PT${hours}H`;
  } else {
    return `PT${mins}M`;
  }
}

export function formatDateForSchema(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString();
}

export function generateRobotsTxt(options?: {
  disallowedPaths?: string[];
  allowedPaths?: string[];
  crawlDelay?: number;
}): string {
  const {
    disallowedPaths = ["/api/", "/admin/", "/_next/", "/private/"],
    allowedPaths = [],
    crawlDelay,
  } = options || {};

  let robotsTxt = "User-agent: *\n";

  allowedPaths.forEach((path) => {
    robotsTxt += `Allow: ${path}\n`;
  });

  disallowedPaths.forEach((path) => {
    robotsTxt += `Disallow: ${path}\n`;
  });

  if (crawlDelay) {
    robotsTxt += `Crawl-delay: ${crawlDelay}\n`;
  }

  robotsTxt += `\nSitemap: ${SEO_CONFIG.siteUrl}/sitemap.xml\n`;

  return robotsTxt;
}

export function sanitizeForSEO(text: string): string {
  return text
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function calculateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function extractFirstImageUrl(htmlContent: string): string | null {
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = htmlContent.match(imgRegex);
  return match ? match[1] : null;
}

export function generateAlternateLanguageLinks(path: string) {
  return SEO_CONFIG.locales.map((locale) => {
    const langCode = locale.split("_")[0].toLowerCase();
    return {
      hrefLang: locale.replace("_", "-"),
      href: `${SEO_CONFIG.siteUrl}/${langCode}${path}`,
    };
  });
}

export function isIndexable(path: string): boolean {
  const noIndexPaths = [
    "/api/",
    "/admin/",
    "/private/",
    "/_next/",
    "/sign-in",
    "/sign-up",
    "/404",
    "/500",
    "/error",
  ];

  return !noIndexPaths.some((noIndexPath) => path.startsWith(noIndexPath));
}

export function generateMetaRobots(options: {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  noimageindex?: boolean;
}): string {
  const {
    index = true,
    follow = true,
    noarchive = false,
    nosnippet = false,
    noimageindex = false,
  } = options;

  const directives: string[] = [];

  if (!index) directives.push("noindex");
  if (!follow) directives.push("nofollow");
  if (noarchive) directives.push("noarchive");
  if (nosnippet) directives.push("nosnippet");
  if (noimageindex) directives.push("noimageindex");

  if (directives.length === 0 && index && follow) {
    return "index, follow";
  }

  return directives.join(", ");
}

export function generateSocialShareUrls(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=${SEO_CONFIG.social.twitter.replace("@", "")}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };
}
