
export default {
  providers: [
    {
      type: "customJwt",
      issuer: process.env.WORKOS_ISSUER_URL || "https://api.workos.com/sso",
      jwks: `https://api.workos.com/sso/jwks/${process.env.WORKOS_CLIENT_ID}`,
      algorithm: "RS256",
    },
  ],
};
