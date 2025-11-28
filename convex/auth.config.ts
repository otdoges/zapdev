const workosApiUrl = process.env.WORKOS_API_URL || "https://api.workos.com";
const workosClientId = process.env.WORKOS_CLIENT_ID;

if (!workosClientId) {
  throw new Error("WORKOS_CLIENT_ID is not set in the environment");
}

export default {
  providers: [
    {
      type: "customJwt",
      issuer: `${workosApiUrl}/sso`,
      jwks: `${workosApiUrl}/sso/jwks`,
      algorithm: "RS256",
      applicationID: workosClientId,
    },
    {
      type: "customJwt",
      issuer: `${workosApiUrl}/user_management`,
      jwks: `${workosApiUrl}/user_management/jwks`,
      algorithm: "RS256",
      applicationID: workosClientId,
    },
  ],
};
