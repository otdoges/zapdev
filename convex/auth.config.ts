
const DEFAULT_WORKOS_ISSUER = "https://api.workos.com/";
const ALLOWED_WORKOS_ISSUERS = new Set<string>([
  DEFAULT_WORKOS_ISSUER,
  "https://auth.workos.com/",
]);

type NormalizedIssuerResult = {
  normalized: string;
  warning?: string;
};

function normalizeWorkosIssuer(rawValue?: string | null): NormalizedIssuerResult {
  if (!rawValue) {
    return { normalized: DEFAULT_WORKOS_ISSUER };
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { normalized: DEFAULT_WORKOS_ISSUER };
  }

  const withoutSsoSuffix = trimmed.replace(/\/sso\/?$/i, "");
  const candidate = withoutSsoSuffix || DEFAULT_WORKOS_ISSUER;

  let normalized: string;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:") {
      throw new Error("WORKOS_ISSUER_URL must use https://");
    }
    normalized = `${parsed.origin}/`;
  } catch {
    throw new Error(
      `WORKOS_ISSUER_URL must be a valid absolute URL (e.g., https://api.workos.com). Received "${trimmed}".`,
    );
  }

  const warning = /\/sso\/?$/i.test(trimmed)
    ? "WORKOS_ISSUER_URL should not include the '/sso' suffix. Update the environment variable to match the WorkOS issuer."
    : undefined;

  return { normalized, warning };
}

const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID ?? process.env.NEXT_WORKOS_CLIENT_ID;
const { normalized: WORKOS_ISSUER_URL, warning: issuerWarning } = normalizeWorkosIssuer(
  process.env.WORKOS_ISSUER_URL,
);
const isDev = process.env.NODE_ENV !== "production";

if (issuerWarning && isDev) {
  console.warn("[workos] issuer normalization:", {
    message: issuerWarning,
    provided: process.env.WORKOS_ISSUER_URL,
    normalized: WORKOS_ISSUER_URL,
  });
}

if (!ALLOWED_WORKOS_ISSUERS.has(WORKOS_ISSUER_URL)) {
  throw new Error(
    `WORKOS_ISSUER_URL must match the WorkOS issuer claim. Expected one of ${Array.from(ALLOWED_WORKOS_ISSUERS).join(
      ", ",
    )}, received "${WORKOS_ISSUER_URL}".`,
  );
}
const WORKOS_JWKS_URL = `${WORKOS_ISSUER_URL}sso/jwks/${WORKOS_CLIENT_ID}`;

if (!WORKOS_CLIENT_ID) {
  // Log the environment to help debug why it might be missing
  console.error("Auth Config Error: WORKOS_CLIENT_ID is missing. Env:", {
    WORKOS_CLIENT_ID: !!process.env.WORKOS_CLIENT_ID,
    NEXT_WORKOS_CLIENT_ID: !!process.env.NEXT_WORKOS_CLIENT_ID
  });
  throw new Error(
    "WORKOS_CLIENT_ID is not set in Convex environment (fallbacks to NEXT_WORKOS_CLIENT_ID). " +
    "Set it via `npx convex env set WORKOS_CLIENT_ID ...` so JWT validation can succeed."
  );
}

// Log configuration on startup (this will show in logs when function cold starts)
console.log("Auth Config Loaded:", {
  issuer: WORKOS_ISSUER_URL,
  jwks: WORKOS_JWKS_URL,
  audience: WORKOS_CLIENT_ID,
  configType: "customJwt"
});

export default {
  providers: [
    {
      // Use customJwt for explicit control over issuer and JWKS
      type: "customJwt",
      issuer: WORKOS_ISSUER_URL,
      jwks: WORKOS_JWKS_URL,
      algorithm: "RS256",
      audience: WORKOS_CLIENT_ID,
      applicationID: WORKOS_CLIENT_ID,
    },
  ],
};
