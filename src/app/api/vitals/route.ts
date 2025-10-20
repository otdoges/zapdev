import { NextRequest, NextResponse } from "next/server";
import { PostHog } from "posthog-node";

interface WebVitalMetric {
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  id: string;
  navigationType: string;
}

// Initialize PostHog for server-side tracking
const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("Web Vital:", metric);
    }

    // Get user identifier (you can customize this based on your auth setup)
    const distinctId =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    // Send Web Vitals to PostHog
    posthog.capture({
      distinctId,
      event: "web_vital",
      properties: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating,
        metric_id: metric.id,
        navigation_type: metric.navigationType,
        // Add additional context
        user_agent: request.headers.get("user-agent"),
        url: request.headers.get("referer"),
      },
    });

    // Also send as a specific metric for easier dashboard creation
    if (["CLS", "FCP", "LCP", "INP", "TTFB"].includes(metric.name)) {
      posthog.capture({
        distinctId,
        event: `web_vital_${metric.name.toLowerCase()}`,
        properties: {
          value: metric.value,
          rating: metric.rating,
          navigation_type: metric.navigationType,
        },
      });

      console.log(
        `Critical metric ${metric.name}: ${metric.value} (${metric.rating})`,
      );
    }

    // Ensure events are flushed to PostHog
    await posthog.flush();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing web vital:", error);
    return NextResponse.json(
      { error: "Failed to process web vital" },
      { status: 500 },
    );
  }
}

// Cleanup on module unload
export const runtime = "nodejs";
