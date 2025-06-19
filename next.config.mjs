import bundleAnalyzer from '@next/bundle-analyzer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

    // Improve chunk loading
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'all',
            reuseExistingChunk: true,
          },
        },
      },
    }

    // Add runtime chunk configuration
    config.optimization.runtimeChunk = {
      name: 'runtime'
    }

    return config
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://funky-humpback-59.clerk.accounts.dev https://cdn.jsdelivr.net",
      "connect-src 'self' http://localhost:* https://api.github.com https://funky-humpback-59.clerk.accounts.dev https://cdn.jsdelivr.net wss://original-meerkat-657.convex.cloud",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "frame-src 'self' https://clerk.accounts.dev",
      "font-src 'self' data: https://cdn.jsdelivr.net",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/:path*.(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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

export default withBundleAnalyzer(nextConfig);