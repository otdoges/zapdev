export default {
  providers: [
    {
      domain: process.env.WORKOS_API_URL || "https://api.workos.com",
      applicationID: "convex",
    },
  ],
};
