import { authMiddleware } from "@clerk/nextjs";

const publicRoutes = [
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/terms",
  "/privacy",
  "/api/sentry-example-api",
  "/api/test-inngest",
  "/api/transfer-sandbox",
  "/api/trpc(.*)",
  "/sitemap.xml",
  "/robots.txt",
];

export default authMiddleware({
  publicRoutes,
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/",
  ],
};
