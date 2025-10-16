import { MetadataRoute } from "next";

export function generateRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/_next/",
          "/private/",
          "/*.json$",
          "/*?*utm_*",
          "/search?*",
          "/404",
          "/500",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "Google-Extended",
        disallow: "/",
      },
      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
      {
        userAgent: "ClaudeBot",
        disallow: "/",
      },
      {
        userAgent: "Omgilibot",
        disallow: "/",
      },
      {
        userAgent: "FacebookBot",
        disallow: "/",
      },
    ],
    sitemap: "https://zapdev.link/sitemap.xml",
  };
}

export function generateRobotsTxtContent(options?: {
  allowGoogleAI?: boolean;
  allowOpenAI?: boolean;
  allowAnthropicAI?: boolean;
  additionalDisallow?: string[];
  crawlDelay?: number;
}): string {
  const {
    allowGoogleAI = false,
    allowOpenAI = false,
    allowAnthropicAI = false,
    additionalDisallow = [],
    crawlDelay,
  } = options || {};

  let content = "# Robots.txt for Zapdev\n\n";
  
  content += "User-agent: *\n";
  content += "Allow: /\n";
  content += "Disallow: /api/\n";
  content += "Disallow: /admin/\n";
  content += "Disallow: /_next/\n";
  content += "Disallow: /private/\n";
  content += "Disallow: /*.json$\n";
  content += "Disallow: /*?*utm_*\n";
  content += "Disallow: /search?*\n";
  
  additionalDisallow.forEach((path) => {
    content += `Disallow: ${path}\n`;
  });

  if (crawlDelay) {
    content += `Crawl-delay: ${crawlDelay}\n`;
  }

  if (!allowGoogleAI) {
    content += "\nUser-agent: Google-Extended\n";
    content += "Disallow: /\n";
  }

  if (!allowOpenAI) {
    content += "\nUser-agent: GPTBot\n";
    content += "Disallow: /\n";
    content += "\nUser-agent: ChatGPT-User\n";
    content += "Disallow: /\n";
  }

  if (!allowAnthropicAI) {
    content += "\nUser-agent: anthropic-ai\n";
    content += "Disallow: /\n";
    content += "\nUser-agent: ClaudeBot\n";
    content += "Disallow: /\n";
  }

  content += "\nUser-agent: CCBot\n";
  content += "Disallow: /\n";

  content += "\nUser-agent: Omgilibot\n";
  content += "Disallow: /\n";

  content += "\nUser-agent: FacebookBot\n";
  content += "Disallow: /\n";

  content += "\n# Sitemap\n";
  content += "Sitemap: https://zapdev.link/sitemap.xml\n";

  return content;
}
