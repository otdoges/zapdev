import crypto from "node:crypto";

type GitHubRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Record<string, unknown> | string | null;
  headers?: Record<string, string>;
  searchParams?: Record<string, string | number | undefined>;
};

type PullRequestInput = {
  repoFullName: string;
  title: string;
  head: string;
  base: string;
  body?: string;
  draft?: boolean;
};

const DEFAULT_BASE_URL = "https://api.github.com";

export class GitHubClient {
  private readonly token: string;
  private readonly baseUrl: string;

  constructor(token: string, options?: { baseUrl?: string }) {
    if (!token) {
      throw new Error("GitHub access token is required");
    }
    this.token = token;
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  }

  private buildHeaders(extra?: Record<string, string>) {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "ZapDev-Autonomous-Agent",
      ...(extra ?? {}),
    };
  }

  private buildUrl(path: string, searchParams?: GitHubRequestOptions["searchParams"]) {
    const url = path.startsWith("http") ? new URL(path) : new URL(`${this.baseUrl}${path}`);
    if (searchParams) {
      for (const [key, value] of Object.entries(searchParams)) {
        if (value === undefined) continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url;
  }

  async request<T = unknown>(path: string, init?: GitHubRequestOptions): Promise<T> {
    const url = this.buildUrl(path, init?.searchParams);
    const response = await fetch(url, {
      method: init?.method ?? "GET",
      headers: this.buildHeaders(init?.headers),
      body:
        typeof init?.body === "string"
          ? init.body
          : init?.body
          ? JSON.stringify(init.body)
          : undefined,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`GitHub request failed (${response.status}): ${message}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async getIssue(repoFullName: string, issueNumber: number) {
    return this.request(`/repos/${repoFullName}/issues/${issueNumber}`);
  }

  async createComment(repoFullName: string, issueNumber: number, body: string) {
    return this.request(`/repos/${repoFullName}/issues/${issueNumber}/comments`, {
      method: "POST",
      body: { body },
    });
  }

  async createPullRequest(input: PullRequestInput) {
    return this.request(`/repos/${input.repoFullName}/pulls`, {
      method: "POST",
      body: {
        title: input.title,
        head: input.head,
        base: input.base,
        body: input.body,
        draft: input.draft ?? false,
      },
    });
  }

  async listPullRequests(repoFullName: string, params?: { state?: "open" | "closed" | "all" }) {
    return this.request(`/repos/${repoFullName}/pulls`, {
      searchParams: {
        state: params?.state ?? "open",
      },
    });
  }
}

export const verifyGitHubSignature = (
  rawBody: string | Buffer,
  signatureHeader: string | null,
  secret: string
) => {
  if (!signatureHeader) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"));
  const digest = `sha256=${hmac.digest("hex")}`;

  const sigBuffer = Buffer.from(signatureHeader);
  const digestBuffer = Buffer.from(digest);

  if (sigBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, digestBuffer);
};

export const buildAuthenticatedGitUrl = (repoFullName: string, token: string) => {
  const safeToken = encodeURIComponent(token);
  return `https://x-access-token:${safeToken}@github.com/${repoFullName}.git`;
};
