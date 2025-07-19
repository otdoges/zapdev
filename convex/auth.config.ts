export default {
  providers: [
    {
      domain: "https://api.workos.com", // WorkOS issuer domain
      applicationID: process.env.WORKOS_CLIENT_ID, // Your WorkOS client ID
    },
  ],
}; 