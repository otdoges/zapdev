
export default {
  providers: [
    {
      domain: `https://api.stack-auth.com/api/v1/projects/${process.env.NEXT_PUBLIC_STACK_PROJECT_ID}`,
      applicationID: "convex",
    },
  ],
};
