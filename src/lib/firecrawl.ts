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

export interface ScrapedContent {
  url: string;
  content: string;
}

export const scrapeUrl = async (targetUrl: string): Promise<ScrapedContent | null> => {
  const client = getFirecrawlClient();

  if (!client) {
    console.warn("[firecrawl] FIRECRAWL_API_KEY is missing; skipping scrape");
    return null;
  }

  if (!isValidHttpUrl(targetUrl)) {
    return null;
  }

  try {
    const document = await client.scrape(targetUrl, {
      formats: ["markdown"],
      onlyMainContent: true,
    });

    const content = document.markdown ?? document.html ?? "";

    if (!content) {
      console.warn("[firecrawl] Empty scrape content", { targetUrl });
      return null;
    }

    return {
      url: document.metadata?.url ?? targetUrl,
      content: truncateContent(content.trim()),
    };
  } catch (error) {
    console.error("[firecrawl] Unexpected scrape error", { targetUrl, error });
    return null;
  }
};
