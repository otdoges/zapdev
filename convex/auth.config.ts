function normalizeDomain(value?: string) {
  if (!value) return undefined;
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

const rawDomain =
  process.env.CLERK_FRONTEND_API_URL ||
  process.env.CLERK_JWT_ISSUER_DOMAIN ||
  process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ||
  process.env.NEXT_CLERK_FRONTEND_API_URL;

const domain = normalizeDomain(rawDomain);

if (!domain) {
  throw new Error(
    "Missing Clerk domain for Convex auth. Set CLERK_FRONTEND_API_URL or NEXT_PUBLIC_CLERK_FRONTEND_API",
  );
}

const authConfig = {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
