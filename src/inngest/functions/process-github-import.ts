import { inngest } from "@/inngest/client";
import { ConvexClient } from "convex/browser";
import { Buffer } from "buffer";
import { api } from "@/lib/convex-api";
import type { Id } from "@/convex/_generated/dataModel";

let convexClient: ConvexClient | null = null;
function getConvexClient() {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }
    convexClient = new ConvexClient(url);
  }
  return convexClient;
}

const convex = new Proxy({} as ConvexClient, {
  get(_target, prop) {
    return getConvexClient()[prop as keyof ConvexClient];
  }
});

interface RepositoryInfo {
  name: string;
  description: string | null;
  language: string;
  topics: string[];
  defaultBranch: string;
  isPrivate: boolean;
  files: Array<{
    name: string;
    path: string;
    size: number;
  }>;
  packageJson?: Record<string, unknown>;
  readme?: string;
}

interface GitHubImportEventData {
  importId: Id<"imports">;
  projectId: string;
  repoFullName: string;
  accessToken: string;
  importMode: "project" | "dashboard";
}

const getDependencyList = (
  pkg: Record<string, unknown> | undefined,
  field: "dependencies" | "devDependencies"
): string[] => {
  if (!pkg) {
    return [];
  }

  const value = pkg[field];
  if (typeof value !== "object" || value === null) {
    return [];
  }

  return Object.keys(value as Record<string, unknown>);
};

async function analyzeRepository(
  repoFullName: string,
  accessToken: string
): Promise<RepositoryInfo> {
  const repoResponse = await fetch(
    `https://api.github.com/repos/${repoFullName}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "ZapDev",
      },
    }
  );

  if (!repoResponse.ok) {
    throw new Error(`Failed to fetch repository: ${repoResponse.statusText}`);
  }

  const repoData = (await repoResponse.json()) as Record<string, unknown>;

  const topicsRaw = repoData.topics;
  const topics = Array.isArray(topicsRaw)
    ? topicsRaw.filter((topic): topic is string => typeof topic === "string")
    : [];

  const defaultBranch =
    typeof repoData.default_branch === "string" && repoData.default_branch.length > 0
      ? repoData.default_branch
      : "main";

  const language =
    typeof repoData.language === "string" && repoData.language.length > 0
      ? repoData.language
      : "Unknown";

  const description = typeof repoData.description === "string" ? repoData.description : null;

  const isPrivate = Boolean(repoData.private);

  const repoName =
    typeof repoData.name === "string"
      ? repoData.name
      : repoFullName.split("/").pop() ?? repoFullName;

  const treeResponse = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/trees/${defaultBranch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "ZapDev",
      },
    }
  );

  let files: RepositoryInfo["files"] = [];
  if (treeResponse.ok) {
    const treeData = (await treeResponse.json()) as Record<string, unknown>;
    const nodes = Array.isArray(treeData.tree) ? treeData.tree : [];

    files = nodes
      .slice(0, 100)
      .map((node) => {
        if (typeof node !== "object" || node === null) {
          return null;
        }

        const path = "path" in node && typeof node.path === "string" ? node.path : "";
        if (!path) {
          return null;
        }

        const size = "size" in node && typeof node.size === "number" ? node.size : 0;

        return {
          name: path.split("/").pop() ?? path,
          path,
          size,
        } satisfies RepositoryInfo["files"][number];
      })
      .filter((entry): entry is RepositoryInfo["files"][number] => entry !== null);
  }

  let packageJson: Record<string, unknown> | undefined;
  try {
    const pkgResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/package.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "ZapDev",
        },
      }
    );

    if (pkgResponse.ok) {
      const pkgData = (await pkgResponse.json()) as Record<string, unknown>;
      const encodedContent =
        typeof pkgData.content === "string" ? pkgData.content.replace(/\n/g, "") : undefined;

      if (encodedContent) {
        const content = Buffer.from(encodedContent, "base64").toString();
        const parsed = JSON.parse(content) as unknown;
        if (parsed && typeof parsed === "object") {
          packageJson = parsed as Record<string, unknown>;
        }
      }
    }
  } catch {
    // package.json not found or parse error
  }

  let readme: string | undefined;
  try {
    const readmeResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/readme`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "ZapDev",
          Accept: "application/vnd.github.v3.raw",
        },
      }
    );

    if (readmeResponse.ok) {
      readme = await readmeResponse.text();
    }
  } catch {
    // README not found
  }

  return {
    name: repoName,
    description,
    language,
    topics,
    defaultBranch,
    isPrivate,
    files,
    packageJson,
    readme,
  };
}

function generateAnalysisPrompt(repoInfo: RepositoryInfo): string {
  const runtimeDependencies = getDependencyList(repoInfo.packageJson, "dependencies");
  const devDependencies = getDependencyList(repoInfo.packageJson, "devDependencies");
  const dependenciesSection = repoInfo.packageJson
    ? `
- **Runtime**: ${runtimeDependencies.slice(0, 10).join(", ") || "None"}
- **Dev**: ${devDependencies.slice(0, 5).join(", ") || "None"}
`
    : "No package.json found";

  return `
Analyze this GitHub repository for code quality, architecture, and improvement opportunities:

## Repository Information
- **Name**: ${repoInfo.name}
- **Language**: ${repoInfo.language}
- **Private**: ${repoInfo.isPrivate}
- **Topics**: ${repoInfo.topics.join(", ") || "None"}
- **Default Branch**: ${repoInfo.defaultBranch}

## Description
${repoInfo.description || "No description provided"}

## Key Files (first 100)
${repoInfo.files
  .slice(0, 20)
  .map((f) => `- ${f.path}`)
  .join("\n")}

## Dependencies
${dependenciesSection}

Please provide:
1. **Architecture Overview**: Describe the overall structure and design patterns
2. **Code Quality Assessment**: Identify strengths and areas for improvement
3. **Security Considerations**: Any potential security concerns
4. **Performance Opportunities**: Suggestions for optimization
5. **Refactoring Recommendations**: Key areas that would benefit from refactoring
6. **Testing Strategy**: Assessment of test coverage and recommendations
7. **Documentation Gaps**: Areas where documentation is needed
`;
}

export const processGitHubImport = inngest.createFunction(
  { id: "process-github-import" },
  { event: "code-agent/process-github-import" },
  async ({ event, step }) => {
    const { importId, projectId, repoFullName, accessToken, importMode } =
      event.data as GitHubImportEventData;

    try {
      // Mark import as processing
      await step.run("mark-processing", async () => {
        return await convex.mutation(api.imports.markProcessing, { importId });
      });

      // Analyze repository
      const repoInfo = await step.run("analyze-repository", async () => {
        return await analyzeRepository(repoFullName, accessToken);
      });

      // Generate analysis prompt
      const analysisPrompt = await step.run("generate-analysis", async () => {
        return generateAnalysisPrompt(repoInfo);
      });

      if (importMode === "project") {
        // Create message with repository context for code generation
        const message = await step.run("create-message", async () => {
          return await convex.action(api.messages.createWithAttachments, {
            value: `Import and analyze GitHub repository ${repoFullName}:\n\n${analysisPrompt}`,
            projectId,
            attachments: [
              {
                url: `https://github.com/${repoFullName}`,
                size: 0,
                importId,
                sourceMetadata: {
                  repoName: repoInfo.name,
                  language: repoInfo.language,
                  fileCount: repoInfo.files.length,
                  hasDependencies: !!repoInfo.packageJson,
                },
                type: "GITHUB_REPO",
              },
            ],
          });
        });

        // Update import status
        await step.run("mark-complete", async () => {
          return await convex.mutation(api.imports.markComplete, {
            importId,
            metadata: {
              messageId: message.messageId,
              repoInfo: {
                name: repoInfo.name,
                language: repoInfo.language,
                fileCount: repoInfo.files.length,
                topics: repoInfo.topics,
              },
            },
          });
        });

        return {
          success: true,
          importId,
          mode: "project",
          repoInfo,
        };
      } else {
        // Dashboard mode - store analysis for dashboard display
        await step.run("mark-complete", async () => {
          return await convex.mutation(api.imports.markComplete, {
            importId,
            metadata: {
              analysisPrompt,
              repoInfo: {
                name: repoInfo.name,
                language: repoInfo.language,
                description: repoInfo.description,
                fileCount: repoInfo.files.length,
                topics: repoInfo.topics,
                readme: repoInfo.readme?.slice(0, 500),
              },
            },
          });
        });

        return {
          success: true,
          importId,
          mode: "dashboard",
          repoInfo,
        };
      }
    } catch (error) {
      // Mark import as failed
      await step.run("mark-failed", async () => {
        return await convex.mutation(api.imports.markFailed, {
          importId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

      throw error;
    }
  }
);
