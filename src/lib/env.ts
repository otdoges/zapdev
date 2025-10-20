const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "AI_GATEWAY_API_KEY",
  "E2B_API_KEY",
  "INNGEST_EVENT_KEY",
  "FIRECRAWL_API_KEY",
] as const;

export const validateEnv = () => {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const errorMessage = [
      "❌ Missing required environment variables:",
      missing.map((v) => `  - ${v}`).join("\n"),
      "\nPlease add these variables to your .env.local file.",
    ].join("\n");

    console.error(errorMessage);
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  console.log("✅ All required environment variables are configured");
};

export const getEnv = () => ({
  DATABASE_URL: process.env.DATABASE_URL!,
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY!,
  E2B_API_KEY: process.env.E2B_API_KEY!,
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY!,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  INNGEST_REALTIME_KEY: process.env.INNGEST_REALTIME_KEY || process.env.INNGEST_EVENT_KEY!,
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY!,
});
