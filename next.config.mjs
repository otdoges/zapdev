import bundleAnalyzer from '@next/bundle-analyzer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { withSentryConfig } from '@sentry/nextjs';

// Import package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf8')
);

/** @type {import('next').NextConfig} */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  // Add output configuration for better static generation
  output: 'standalone',
  
  // Improve chunk loading reliability
  webpack: (config, { isServer, webpack }) => {
    // Monaco Editor worker files configuration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }

    // Ensure proper alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    }

    // The custom optimization below is causing issues with module formats.
    // Commenting it out to revert to Next.js's default chunking.
    // config.optimization = {
    //   ...config.optimization,
    //   splitChunks: {
    //     ...config.optimization.splitChunks,
    //     cacheGroups: {
    //       ...config.optimization.splitChunks?.cacheGroups,
    //       vendor: {
    //         test: /[\\/]node_modules[\\/]/,
    //         name: 'vendors',
    //         chunks: 'all',
    //         priority: 10,
    //       },
    //       common: {
    //         name: 'common',
    //         minChunks: 2,
    //         priority: 5,
    //         chunks: 'all',
    //         reuseExistingChunk: true,
    //       },
    //     },
    //   },
    // }

    // config.optimization.runtimeChunk = {
    //   name: 'runtime'
    // }

    return config
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    // More permissive CSP for development, strict for production
    const csp = isDev 
      ? [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' *",
          "connect-src 'self' * ws: wss:",
          "img-src 'self' data: blob: *",
          "style-src 'self' 'unsafe-inline' *",
          "frame-src 'self' *",
          "font-src 'self' data: *",
          "worker-src 'self' blob:",
          "child-src 'self' blob:",
        ].join('; ')
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://funky-humpback-59.clerk.accounts.dev https://js.clerk.com https://clerk.accounts.dev https://cdn.jsdelivr.net https://plausible.io https://cloud.umami.is https://cdn.databuddy.cc",
          "connect-src 'self' http://localhost:* https://api.github.com https://funky-humpback-59.clerk.accounts.dev https://cdn.jsdelivr.net wss://original-meerkat-657.convex.cloud https://fonts.googleapis.com https://fonts.gstatic.com https://*.supabase.co https://*.supabase.com wss://*.supabase.co wss://*.supabase.com https://plausible.io https://cloud.umami.is https://cdn.databuddy.cc",
          "img-src 'self' data: blob:",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "frame-src 'self' https://clerk.accounts.dev",
          "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com",
          "worker-src 'self' blob:",
          "child-src 'self' blob:",
        ].join('; ');

    return [
      // Only apply CSP in production or when explicitly enabled
      ...(isDev ? [] : [{
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      }]),
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev ? 'no-cache' : 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/:path*.(jpg|jpeg|png|webp|avif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev ? 'no-cache' : 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/:path*.(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev ? 'no-cache' : 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/:path*.(html|json)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          }
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
      {
        source: '/ingest/decide/',
        destination: 'https://us.i.posthog.com/decide/',
      },
      {
        source: '/ingest/e',
        destination: 'https://us.i.posthog.com/e',
      },
      {
        source: '/ingest/e/',
        destination: 'https://us.i.posthog.com/e/',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  publicRuntimeConfig: {
    APP_VERSION: packageJson.version,
  },
};

// Make sure the version is included in the build output
console.log(`Building ZapDev version ${packageJson.version}`);

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload source maps during build step
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  automaticVercelMonitors: true,
};

// Apply Sentry configuration only if DSN is provided
const finalConfig = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(withBundleAnalyzer(nextConfig), sentryWebpackPluginOptions)
  : withBundleAnalyzer(nextConfig);

export default finalConfig;