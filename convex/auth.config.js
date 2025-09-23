export default {
  providers: [
    {
      domain: process.env.WORKOS_DOMAIN || "api.workos.com",
      applicationID: process.env.WORKOS_CLIENT_ID,
    },
  ],
};