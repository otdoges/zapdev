import {withSentryConfig} from "@sentry/nextjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nullLoaderPath = path.join(__dirname, "loaders/null-loader.js");

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
    // Enable aggressive image optimization
    formats: ["image/avif", "image/webp"],
  },
  // Experimental performance optimizations
  experimental: {
    // optimizeCss requires 'critters' dependency - disable if not installed
  },
  // Reduce bundle size by excluding unnecessary files
  webpack: (config) => {
    config.module.rules.push({
      test: /\.d\.ts$/,
      use: {
        loader: nullLoaderPath,
      },
    });

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      // Enable tree-shaking for all dependencies
      usedExports: true,
    };

    return config;
  },
  // Compress responses
  compress: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "zapdev",

  project: "zapdev",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  // Only enable in production/CI to speed up local development builds
  widenClientFileUpload: process.env.NODE_ENV === "production" || !!process.env.CI,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true
});
