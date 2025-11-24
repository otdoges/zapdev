import { NextResponse } from "next/server";
import { getUser, getConvexClientWithAuth } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { runCodeAgent } from "@/agents/ai-sdk/code-agent";
import { getSandbox } from "@/agents/e2b-utils";
import { captureTelemetry } from "@/lib/telemetry/posthog";

type FixErrorsRequestBody = {
  fragmentId: string;
};

const runValidation = async (sandboxId: string) => {
  const sandbox = await getSandbox(sandboxId);
  const buffers: { stdout: string; stderr: string } = { stdout: "", stderr: "" };

  const runCmd = async (cmd: string, timeoutMs = 120000) => {
    buffers.stdout = "";
    buffers.stderr = "";
    const result = await sandbox.commands.run(cmd, {
      timeoutMs,
      onStdout: (d) => { buffers.stdout += d; },
      onStderr: (d) => { buffers.stderr += d; },
    });
    const output = `${buffers.stdout}${buffers.stderr}`;
    return result.exitCode === 0 ? null : output;
  };

  const lintErrors = await runCmd("bun run lint");
  const buildErrors = await runCmd("bun run build");
  return [lintErrors, buildErrors].filter(Boolean).join("\n\n");
};

function isFixErrorsRequestBody(value: unknown): value is FixErrorsRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { fragmentId?: unknown }).fragmentId === "string"
  );
}

export async function POST(request: Request) {
  try {
    const stackUser = await getUser();
    if (!stackUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convexClient = await getConvexClientWithAuth();
    const body = await request.json();

    if (!isFixErrorsRequestBody(body)) {
      return NextResponse.json(
        { error: "Fragment ID is required" },
        { status: 400 },
      );
    }

    const fragmentData = await convexClient.query(
      api.messages.getFragmentByIdAuth,
      { fragmentId: body.fragmentId as Id<"fragments"> },
    );

    const fragment = fragmentData.fragment;
    const message = fragmentData.message;

    if (!fragment?.sandboxId) {
      return NextResponse.json(
        { error: "Fragment has no active sandbox" },
        { status: 400 },
      );
    }
    const framework =
      (fragment.framework?.toLowerCase() as any) || "nextjs";

    await captureTelemetry("error_fix_start", {
      projectId: message.projectId,
      fragmentId: fragment._id,
      sandboxId: fragment.sandboxId,
      framework,
    });

    const errors = await runValidation(fragment.sandboxId);
    const value = `Fix the existing project. Current errors:\n${errors || "No errors captured; rerun lint/build to ensure correctness."}`;

    await runCodeAgent({
      projectId: message.projectId as Id<"projects">,
      messageId: message._id as Id<"messages">,
      value,
      model: (fragment.metadata as any)?.model || "anthropic/claude-haiku-4.5",
      frameworkOverride: framework,
      sandboxId: fragment.sandboxId,
    });

    await captureTelemetry("error_fix_complete", {
      projectId: message.projectId,
      fragmentId: fragment._id,
      sandboxId: fragment.sandboxId,
      framework,
    });

    return NextResponse.json({
      success: true,
      message: "Error fix completed",
    });
  } catch (error) {
    await captureTelemetry("error_fix_error", {
      error: error instanceof Error ? error.message : String(error),
    });
    console.error("[ERROR] Failed to run error fix:", error);
    return NextResponse.json(
      { error: "Failed to fix errors" },
      { status: 500 },
    );
  }
}
