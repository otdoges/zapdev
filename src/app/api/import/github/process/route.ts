import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { runCodeAgent } from "@/agents/ai-sdk/code-agent";
import type { Id } from "@/convex/_generated/dataModel";
import { captureTelemetry } from "@/lib/telemetry/posthog";

export async function POST(request: Request) {
  const stackUser = await getUser();
  if (!stackUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stackUser.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { repoId, repoName, repoFullName, repoUrl, projectId } = body;

    if (!repoId || !projectId || !repoName || !repoFullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get OAuth connection
    const connection = await fetchQuery((api as any).oauth.getConnection, {
      provider: "github",
    });

    if (!connection) {
      return NextResponse.json(
        { error: "GitHub not connected" },
        { status: 401 }
      );
    }

    // Fetch repository details
    const repoResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}`,
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          "User-Agent": "ZapDev",
        },
      }
    );

    if (!repoResponse.ok) {
      throw new Error("Failed to fetch GitHub repository details");
    }

    const repoData = await repoResponse.json();

    // Create import record in Convex
    const importRecord = await fetchMutation((api as any).imports.createImport, {
      projectId,
      source: "GITHUB",
      sourceId: repoId.toString(),
      sourceName: repoName,
      sourceUrl: repoUrl || repoData.html_url,
      metadata: {
        githubRepoData: {
          fullName: repoData.full_name,
          description: repoData.description,
          language: repoData.language,
          defaultBranch: repoData.default_branch,
          topics: repoData.topics || [],
          isPrivate: repoData.private,
        },
      },
    });

    const repoSummary = [
      `Repository: ${repoData.full_name}`,
      `Description: ${repoData.description || "N/A"}`,
      `Language: ${repoData.language || "Unknown"}`,
      `Default Branch: ${repoData.default_branch || "main"}`,
      `Private: ${repoData.private ? "Yes" : "No"}`,
      `Topics: ${(repoData.topics || []).join(", ") || "None"}`,
    ].join("\n");

    await captureTelemetry("github_import_start", {
      projectId,
      repoFullName,
      repoId,
    });

    // Create a message to kick off import context
    const message = await fetchMutation(api.messages.createWithAttachments, {
      value: `Analyze this GitHub repository and prepare a plan:\n\n${repoSummary}`,
      projectId,
      attachments: [
        {
          url: repoUrl || repoData.html_url,
          size: 0,
          type: "GITHUB_REPO",
          sourceMetadata: {
            repoId,
            repoFullName,
            repoUrl: repoUrl || repoData.html_url,
          },
        },
      ],
    });

    // Trigger code agent with repo context (non-blocking)
    runCodeAgent({
      projectId: projectId as Id<"projects">,
      messageId: message.messageId as Id<"messages">,
      value: `Generate code based on the GitHub repo ${repoFullName}. Use the repository URL as reference: ${repoUrl || repoData.html_url}`,
      model: "anthropic/claude-haiku-4.5",
    }).catch(error => console.error("Code agent error:", error));

    await captureTelemetry("github_import_complete", {
      projectId,
      repoFullName,
      messageId: message.messageId,
    });

    return NextResponse.json({
      success: true,
      importId: importRecord,
      message: "GitHub repository import processed",
    });
  } catch (error) {
    console.error("Error processing GitHub import:", error);
    return NextResponse.json(
      { error: "Failed to process GitHub import" },
      { status: 500 }
    );
  }
}
