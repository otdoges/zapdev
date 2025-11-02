import { inngest } from "@/inngest/client";
import { ConvexClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface RepositoryInfo {
  name: string;
  description: string;
  language: string;
  topics: string[];
  defaultBranch: string;
  isPrivate: boolean;
  files: Array<{
    name: string;
    path: string;
    size: number;
  }>;
  packageJson?: any;
  readme?: string;
}

async function analyzeRepository(
  repoFullName: string,
  accessToken: string
): Promise<RepositoryInfo> {
  const [owner, repo] = repoFullName.split("/");

  // Fetch repository metadata
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

  const repoData = await repoResponse.json();

  // Fetch directory structure
  const treeResponse = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/trees/${repoData.default_branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "ZapDev",
      },
    }
  );

  const files = treeResponse.ok
    ? (await treeResponse.json()).tree.slice(0, 100).map((f: any) => ({
        name: f.path.split("/").pop(),
        path: f.path,
        size: f.size || 0,
      }))
    : [];

  // Fetch package.json if exists
  let packageJson = null;
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
      const pkgData = await pkgResponse.json();
      const content = Buffer.from(pkgData.content, "base64").toString();
      packageJson = JSON.parse(content);
    }
  } catch (e) {
    // package.json not found or parse error
  }

  // Fetch README if exists
  let readme = null;
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
  } catch (e) {
    // README not found
  }

  return {
    name: repoData.name,
    description: repoData.description,
    language: repoData.language || "Unknown",
    topics: repoData.topics || [],
    defaultBranch: repoData.default_branch,
    isPrivate: repoData.private,
    files: files,
    packageJson,
    readme,
  };
}

function generateAnalysisPrompt(repoInfo: RepositoryInfo): string {
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
${
  repoInfo.packageJson
    ? `
- **Runtime**: ${Object.keys(repoInfo.packageJson.dependencies || {})
        .slice(0, 10)
        .join(", ")}
- **Dev**: ${Object.keys(repoInfo.packageJson.devDependencies || {})
        .slice(0, 5)
        .join(", ")}
`
    : "No package.json found"
}

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
      event.data as any;

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
          return await convex.mutation(api.messages.createWithAttachments, {
            value: `Import and analyze GitHub repository ${repoFullName}:\n\n${analysisPrompt}`,
            projectId,
            attachments: [
              {
                url: `https://github.com/${repoFullName}`,
                size: 0,
                type: "GITHUB_REPO",
                importId,
                sourceMetadata: {
                  repoName: repoInfo.name,
                  language: repoInfo.language,
                  fileCount: repoInfo.files.length,
                  hasDependencies: !!repoInfo.packageJson,
                },
              },
            ],
          });
        });

        // Update import status
        await step.run("mark-complete", async () => {
          return await convex.mutation(api.imports.markComplete, {
            importId,
            metadata: {
              messageId: message._id,
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
