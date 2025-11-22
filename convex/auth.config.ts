
export default {
  providers: [
    {
      type: "customJwt",
      // WorkOS access tokens use issuer https://api.workos.com
      issuer: process.env.WORKOS_ISSUER_URL || "https://api.workos.com",
      jwks: `https://api.workos.com/sso/jwks/${process.env.WORKOS_CLIENT_ID}`,
      algorithm: "RS256",
      audience: process.env.WORKOS_CLIENT_ID,
    },
  ],
};
