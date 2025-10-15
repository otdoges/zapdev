import { FirecrawlClient } from "firecrawl";

const MAX_CONTENT_LENGTH = 8000;

let cachedClient: FirecrawlClient | null = null;

const getFirecrawlClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return null;
  }

  cachedClient = new FirecrawlClient({ apiKey });
  return cachedClient;
};

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    console.warn("[firecrawl] Invalid URL provided", { value, error });
    return false;
  }
};

const truncateContent = (value: string) => {
  if (value.length <= MAX_CONTENT_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_CONTENT_LENGTH)}...`;
};

export interface CrawledContent {
  url: string;
  content: string;
  screenshots?: string[];
}

export const crawlUrl = async (targetUrl: string): Promise<CrawledContent | null> => {
  const client = getFirecrawlClient();

  if (!client) {
    console.warn("[firecrawl] FIRECRAWL_API_KEY is missing; skipping crawl");
    return null;
  }

  if (!isValidHttpUrl(targetUrl)) {
    return null;
  }

  try {
    const crawlResult = await client.crawl(targetUrl, {
      limit: 1,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
      },
    });

    if (crawlResult.status !== "completed") {
      console.warn("[firecrawl] Crawl did not complete", {
        targetUrl,
        status: crawlResult.status,
      });
      return null;
    }

    const [document] = crawlResult.data ?? [];

    if (!document) {
      console.warn("[firecrawl] Crawl returned no documents", { targetUrl });
      return null;
    }

    const content = document.markdown ?? document.html ?? "";

    if (!content) {
      console.warn("[firecrawl] Empty crawl content", { targetUrl });
      return null;
    }

    const screenshots = [
      document.metadata?.ogImage,
    ].filter((value): value is string => typeof value === "string" && value.length > 0);

    return {
      url: document.metadata?.url ?? targetUrl,
      content: truncateContent(content.trim()),
      ...(screenshots.length > 0 ? { screenshots } : {}),
    };
  } catch (error) {
    console.error("[firecrawl] Unexpected crawl error", { targetUrl, error });
    return null;
  }
};
