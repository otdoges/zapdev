import { SEO_CONFIG } from "./config";

export interface OpenGraphConfig {
  title: string;
  description: string;
  url?: string;
  type?: "website" | "article" | "product" | "profile" | "video.movie" | "video.episode" | "video.tv_show" | "video.other";
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
    alt?: string;
    type?: string;
  }>;
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    expirationTime?: string;
    authors?: string[];
    section?: string;
    tags?: string[];
  };
  video?: {
    url: string;
    secureUrl?: string;
    type?: string;
    width?: number;
    height?: number;
    duration?: number;
    releaseDate?: string;
    tags?: string[];
  };
  audio?: {
    url: string;
    secureUrl?: string;
    type?: string;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    gender?: string;
  };
  book?: {
    isbn?: string;
    releaseDate?: string;
    authors?: string[];
    tags?: string[];
  };
}

export function generateOpenGraphTags(config: OpenGraphConfig): Record<string, string> {
  const tags: Record<string, string> = {
    "og:title": config.title,
    "og:description": config.description,
    "og:type": config.type || "website",
    "og:site_name": config.siteName || SEO_CONFIG.siteName,
    "og:locale": config.locale || SEO_CONFIG.locale,
    "og:url": config.url || SEO_CONFIG.siteUrl,
  };

  if (config.alternateLocales) {
    config.alternateLocales.forEach((locale, index) => {
      tags[`og:locale:alternate:${index}`] = locale;
    });
  }

  if (config.images && config.images.length > 0) {
    config.images.forEach((image, index) => {
      const prefix = index === 0 ? "og:image" : `og:image:${index}`;
      tags[prefix] = image.url;
      if (image.width) tags[`${prefix}:width`] = image.width.toString();
      if (image.height) tags[`${prefix}:height`] = image.height.toString();
      if (image.alt) tags[`${prefix}:alt`] = image.alt;
      if (image.type) tags[`${prefix}:type`] = image.type;
    });
  } else {
    tags["og:image"] = `${SEO_CONFIG.siteUrl}${SEO_CONFIG.ogImage.url}`;
    tags["og:image:width"] = SEO_CONFIG.ogImage.width.toString();
    tags["og:image:height"] = SEO_CONFIG.ogImage.height.toString();
    tags["og:image:alt"] = SEO_CONFIG.ogImage.alt;
  }

  if (config.article) {
    if (config.article.publishedTime) {
      tags["article:published_time"] = config.article.publishedTime;
    }
    if (config.article.modifiedTime) {
      tags["article:modified_time"] = config.article.modifiedTime;
    }
    if (config.article.expirationTime) {
      tags["article:expiration_time"] = config.article.expirationTime;
    }
    if (config.article.authors) {
      config.article.authors.forEach((author, index) => {
        tags[`article:author:${index}`] = author;
      });
    }
    if (config.article.section) {
      tags["article:section"] = config.article.section;
    }
    if (config.article.tags) {
      config.article.tags.forEach((tag, index) => {
        tags[`article:tag:${index}`] = tag;
      });
    }
  }

  if (config.video) {
    tags["og:video"] = config.video.url;
    if (config.video.secureUrl) tags["og:video:secure_url"] = config.video.secureUrl;
    if (config.video.type) tags["og:video:type"] = config.video.type;
    if (config.video.width) tags["og:video:width"] = config.video.width.toString();
    if (config.video.height) tags["og:video:height"] = config.video.height.toString();
    if (config.video.duration) tags["video:duration"] = config.video.duration.toString();
    if (config.video.releaseDate) tags["video:release_date"] = config.video.releaseDate;
    if (config.video.tags) {
      config.video.tags.forEach((tag, index) => {
        tags[`video:tag:${index}`] = tag;
      });
    }
  }

  if (config.audio) {
    tags["og:audio"] = config.audio.url;
    if (config.audio.secureUrl) tags["og:audio:secure_url"] = config.audio.secureUrl;
    if (config.audio.type) tags["og:audio:type"] = config.audio.type;
  }

  if (config.profile) {
    if (config.profile.firstName) tags["profile:first_name"] = config.profile.firstName;
    if (config.profile.lastName) tags["profile:last_name"] = config.profile.lastName;
    if (config.profile.username) tags["profile:username"] = config.profile.username;
    if (config.profile.gender) tags["profile:gender"] = config.profile.gender;
  }

  if (config.book) {
    if (config.book.isbn) tags["book:isbn"] = config.book.isbn;
    if (config.book.releaseDate) tags["book:release_date"] = config.book.releaseDate;
    if (config.book.authors) {
      config.book.authors.forEach((author, index) => {
        tags[`book:author:${index}`] = author;
      });
    }
    if (config.book.tags) {
      config.book.tags.forEach((tag, index) => {
        tags[`book:tag:${index}`] = tag;
      });
    }
  }

  return tags;
}

export function generateArticleOG(options: {
  title: string;
  description: string;
  image: string;
  publishedTime: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}): Record<string, string> {
  return generateOpenGraphTags({
    title: options.title,
    description: options.description,
    type: "article",
    images: [{ url: options.image }],
    article: {
      publishedTime: options.publishedTime,
      modifiedTime: options.modifiedTime,
      authors: options.authors,
      section: options.section,
      tags: options.tags,
    },
  });
}

export function generateProductOG(options: {
  title: string;
  description: string;
  images: string[];
  price?: string;
  currency?: string;
}): Record<string, string> {
  return generateOpenGraphTags({
    title: options.title,
    description: options.description,
    type: "product",
    images: options.images.map((url) => ({ url })),
  });
}

export function generateVideoOG(options: {
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration?: number;
  width?: number;
  height?: number;
}): Record<string, string> {
  return generateOpenGraphTags({
    title: options.title,
    description: options.description,
    type: "video.other",
    images: [{ url: options.thumbnail }],
    video: {
      url: options.videoUrl,
      width: options.width,
      height: options.height,
      duration: options.duration,
    },
  });
}

export function generateProfileOG(options: {
  title: string;
  description: string;
  image: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}): Record<string, string> {
  return generateOpenGraphTags({
    title: options.title,
    description: options.description,
    type: "profile",
    images: [{ url: options.image }],
    profile: {
      firstName: options.firstName,
      lastName: options.lastName,
      username: options.username,
    },
  });
}
