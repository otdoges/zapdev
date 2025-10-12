import { withSentryConfig } from "@sentry/nextjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nullLoaderPath = path.join(__dirname, "loaders/null-loader.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.d\.ts$/,
      use: {
        loader: nullLoaderPath,
      },
    });

    return config;
  },
};

const configWithSentry = withSentryConfig(nextConfig, {
  org: "zapdev",
  project: "zapdev",
  silent: !process.env.CI,
  widenClientFileUpload:
    process.env.NODE_ENV === "production" || Boolean(process.env.CI),
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});

if (configWithSentry.experimental) {
  delete configWithSentry.experimental.instrumentationHook;
}

export default configWithSentry;
