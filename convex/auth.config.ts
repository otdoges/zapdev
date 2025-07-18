export default {
  providers: [
    {
      domain: process.env.WORKOS_DOMAIN, // Your WorkOS domain
      applicationID: process.env.WORKOS_CLIENT_ID, // Your WorkOS client ID
    },
  ],
}; 