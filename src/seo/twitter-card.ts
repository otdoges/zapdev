import { SEO_CONFIG } from "./config";

export type TwitterCardType = "summary" | "summary_large_image" | "app" | "player";

export interface TwitterCardConfig {
  card: TwitterCardType;
  site?: string;
  creator?: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  app?: {
    id: {
      iphone?: string;
      ipad?: string;
      googleplay?: string;
    };
    url?: {
      iphone?: string;
      ipad?: string;
      googleplay?: string;
    };
    name?: {
      iphone?: string;
      ipad?: string;
      googleplay?: string;
    };
  };
  player?: {
    url: string;
    width: number;
    height: number;
    stream?: string;
  };
}

export function generateTwitterCardTags(config: TwitterCardConfig): Record<string, string> {
  const tags: Record<string, string> = {
    "twitter:card": config.card,
    "twitter:site": config.site || SEO_CONFIG.social.twitter,
    "twitter:creator": config.creator || SEO_CONFIG.social.twitter,
    "twitter:title": config.title,
    "twitter:description": config.description,
  };

  if (config.image) {
    tags["twitter:image"] = config.image;
    if (config.imageAlt) {
      tags["twitter:image:alt"] = config.imageAlt;
    }
  } else {
    tags["twitter:image"] = `${SEO_CONFIG.siteUrl}${SEO_CONFIG.ogImage.url}`;
    tags["twitter:image:alt"] = SEO_CONFIG.ogImage.alt;
  }

  if (config.app) {
    if (config.app.id.iphone) {
      tags["twitter:app:id:iphone"] = config.app.id.iphone;
    }
    if (config.app.id.ipad) {
      tags["twitter:app:id:ipad"] = config.app.id.ipad;
    }
    if (config.app.id.googleplay) {
      tags["twitter:app:id:googleplay"] = config.app.id.googleplay;
    }
    if (config.app.url?.iphone) {
      tags["twitter:app:url:iphone"] = config.app.url.iphone;
    }
    if (config.app.url?.ipad) {
      tags["twitter:app:url:ipad"] = config.app.url.ipad;
    }
    if (config.app.url?.googleplay) {
      tags["twitter:app:url:googleplay"] = config.app.url.googleplay;
    }
    if (config.app.name?.iphone) {
      tags["twitter:app:name:iphone"] = config.app.name.iphone;
    }
    if (config.app.name?.ipad) {
      tags["twitter:app:name:ipad"] = config.app.name.ipad;
    }
    if (config.app.name?.googleplay) {
      tags["twitter:app:name:googleplay"] = config.app.name.googleplay;
    }
  }

  if (config.player) {
    tags["twitter:player"] = config.player.url;
    tags["twitter:player:width"] = config.player.width.toString();
    tags["twitter:player:height"] = config.player.height.toString();
    if (config.player.stream) {
      tags["twitter:player:stream"] = config.player.stream;
    }
  }

  return tags;
}

export function generateSummaryCard(options: {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
}): Record<string, string> {
  return generateTwitterCardTags({
    card: "summary",
    title: options.title,
    description: options.description,
    image: options.image,
    imageAlt: options.imageAlt,
  });
}

export function generateSummaryLargeImageCard(options: {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
}): Record<string, string> {
  return generateTwitterCardTags({
    card: "summary_large_image",
    title: options.title,
    description: options.description,
    image: options.image,
    imageAlt: options.imageAlt,
  });
}

export function generateAppCard(options: {
  title: string;
  description: string;
  image?: string;
  iphoneAppId?: string;
  ipadAppId?: string;
  googlePlayAppId?: string;
  iphoneUrl?: string;
  ipadUrl?: string;
  googlePlayUrl?: string;
}): Record<string, string> {
  return generateTwitterCardTags({
    card: "app",
    title: options.title,
    description: options.description,
    image: options.image,
    app: {
      id: {
        iphone: options.iphoneAppId,
        ipad: options.ipadAppId,
        googleplay: options.googlePlayAppId,
      },
      url: {
        iphone: options.iphoneUrl,
        ipad: options.ipadUrl,
        googleplay: options.googlePlayUrl,
      },
      name: {
        iphone: SEO_CONFIG.siteName,
        ipad: SEO_CONFIG.siteName,
        googleplay: SEO_CONFIG.siteName,
      },
    },
  });
}

export function generatePlayerCard(options: {
  title: string;
  description: string;
  playerUrl: string;
  width: number;
  height: number;
  image?: string;
  streamUrl?: string;
}): Record<string, string> {
  return generateTwitterCardTags({
    card: "player",
    title: options.title,
    description: options.description,
    image: options.image,
    player: {
      url: options.playerUrl,
      width: options.width,
      height: options.height,
      stream: options.streamUrl,
    },
  });
}
