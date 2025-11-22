
const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID ?? process.env.NEXT_WORKOS_CLIENT_ID;
const WORKOS_ISSUER_URL = process.env.WORKOS_ISSUER_URL || "https://api.workos.com";

if (!WORKOS_CLIENT_ID) {
  throw new Error(
    "WORKOS_CLIENT_ID is not set in Convex environment (fallbacks to NEXT_WORKOS_CLIENT_ID). " +
    "Set it via `npx convex env set WORKOS_CLIENT_ID ...` so JWT validation can succeed."
  );
}

export default {
  providers: [
    {
      type: "customJwt",
      // WorkOS access tokens use issuer https://api.workos.com
      issuer: WORKOS_ISSUER_URL,
      jwks: `https://api.workos.com/sso/jwks/${WORKOS_CLIENT_ID}`,
      algorithm: "RS256",
      audience: WORKOS_CLIENT_ID,
    },
  ],
};
