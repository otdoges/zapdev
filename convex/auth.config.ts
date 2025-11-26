
const clientId = process.env.WORKOS_CLIENT_ID;

if (!clientId) {
  throw new Error("WORKOS_CLIENT_ID env var is required for Convex auth");
}

export default {
  providers: [
    {
      // AuthKit access/ID tokens (iss: https://api.workos.com/)
      type: "customJwt",
      issuer: process.env.WORKOS_ISSUER_URL || "https://api.workos.com/",
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      algorithm: "RS256",
      applicationID: clientId,
    },
    {
      // WorkOS user management tokens (iss: https://api.workos.com/user_management/{clientId})
      type: "customJwt",
      issuer: `https://api.workos.com/user_management/${clientId}`,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      algorithm: "RS256",
      applicationID: clientId,
    },
  ],
};
