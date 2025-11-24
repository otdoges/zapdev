import { NextRequest, NextResponse } from "next/server";
import { runCodeAgent } from "@/agents/ai-sdk/code-agent";
import { generateText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import {
  FRAMEWORK_SELECTOR_PROMPT,
  SPEC_MODE_PROMPT,
  NEXTJS_PROMPT,
  ANGULAR_PROMPT,
  REACT_PROMPT,
  VUE_PROMPT,
  SVELTE_PROMPT,
} from "@/prompt";
import { captureTelemetry } from "@/lib/telemetry/posthog";

if (!process.env.AI_GATEWAY_API_KEY) {
  throw new Error("AI_GATEWAY_API_KEY environment variable is required");
}

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL:
    process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1/ai",
});

const getFrameworkPrompt = (framework: string) => {
  switch (framework) {
    case "nextjs":
      return NEXTJS_PROMPT;
    case "angular":
      return ANGULAR_PROMPT;
    case "react":
      return REACT_PROMPT;
    case "vue":
      return VUE_PROMPT;
    case "svelte":
      return SVELTE_PROMPT;
    default:
      return NEXTJS_PROMPT;
  }
};

const extractSpecContent = (value: string): string => {
  const match = /<spec>([\s\S]*?)<\/spec>/i.exec(value);
  if (match && typeof match[1] === "string") {
    return match[1].trim();
  }
  return value.trim();
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      value,
      model,
      messageId,
      specMode,
      isSpecRevision,
      isFromApprovedSpec,
      specContent,
    } = body;

    console.log("[Agent Trigger] Received request:", {
      projectId,
      valueLength: value?.length || 0,
      model,
      timestamp: new Date().toISOString(),
    });

    if (!projectId || !value) {
      console.error("[Agent Trigger] Missing required fields:", {
        hasProjectId: !!projectId,
        hasValue: !!value,
      });
      return NextResponse.json(
        { error: "Missing required fields: projectId and value" },
        { status: 400 }
      );
    }

    // Spec planning flow (no code generation yet)
    const planningRequested = specMode || isSpecRevision;

    if (planningRequested && !isFromApprovedSpec) {
      // Validate messageId is present and non-empty for spec planning flows
      if (!messageId || typeof messageId !== "string" || messageId.trim() === "") {
        console.error("[Agent Trigger] Missing or invalid messageId for spec planning:", {
          hasMessageId: !!messageId,
          messageIdType: typeof messageId,
          specMode,
          isSpecRevision,
        });
        return NextResponse.json(
          { error: "messageId is required for spec planning operations" },
          { status: 400 }
        );
      }

      await captureTelemetry("spec_planning_start", {
        projectId,
        messageId,
        model: model || "auto",
      });

      await fetchMutation(api.specs.updateSpec, {
        messageId,
        specContent: "",
        status: "PLANNING",
      });

      const detected = await generateText({
        model: gateway("google/gemini-2.5-flash-lite"),
        system: FRAMEWORK_SELECTOR_PROMPT,
        prompt: value,
        temperature: 0.3,
      });

      const framework =
        (detected.text || "").trim().toLowerCase() || "nextjs";

      const specPrompt = `${SPEC_MODE_PROMPT}\n\n## Framework Context\nYou are creating a specification for a ${framework.toUpperCase()} application.\n\n${getFrameworkPrompt(framework)}\n\nRemember to wrap your complete specification in <spec>...</spec> tags.`;

      const specResult = await generateText({
        model: gateway("openai/gpt-5.1-codex"),
        system: specPrompt,
        prompt: value,
        temperature: 0.7,
      });

      const specText = extractSpecContent(specResult.text || "");

      // Revalidate messageId before second spec update (defensive check)
      if (!messageId || typeof messageId !== "string" || messageId.trim() === "") {
        console.error("[Agent Trigger] messageId lost before spec update:", {
          hasMessageId: !!messageId,
          messageIdType: typeof messageId,
        });
        return NextResponse.json(
          { error: "messageId is required for spec update operations" },
          { status: 400 }
        );
      }

      await fetchMutation(api.specs.updateSpec, {
        messageId,
        specContent: specText,
        status: "AWAITING_APPROVAL",
      });

      await captureTelemetry("spec_planning_complete", {
        projectId,
        messageId,
        model: model || "auto",
        framework,
        specLength: specText.length,
      });

      return NextResponse.json({
        success: true,
        specContent: specText,
        specMode: "AWAITING_APPROVAL",
      });
    }

    // Normal code generation (or from approved spec)
    await runCodeAgent({
      projectId,
      messageId,
      value,
      model: model || "auto",
      specContent: specContent || (isFromApprovedSpec ? value : undefined),
    });

    await captureTelemetry("agent_request_complete", {
      projectId,
      messageId,
      model: model || "auto",
      specMode: Boolean(specContent || isFromApprovedSpec),
    });

    console.log("[Agent Trigger] Request processed successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    await captureTelemetry("agent_request_error", {
      error: error instanceof Error ? error.message : String(error),
    });
    console.error("[Agent Trigger] Failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { 
        error: "Failed to run agent",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
