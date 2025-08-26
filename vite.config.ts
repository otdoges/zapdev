import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import type { PreRenderedAsset } from 'rollup';

let componentTagger: (() => unknown) | null = null;
try {
  // Use synchronous require for optional dev-only dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  componentTagger = require("lovable-tagger").componentTagger as (() => unknown);
} catch {
  componentTagger = null;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/hono/trpc': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/hono\/trpc/, '/api/hono-trpc/trpc'),
        },
        '/hono': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/hono/, '/api/hono-polar'),
        },
      },
    },
    plugins: [
      react({
        // Enable Fast Refresh optimizations
        devTarget: 'es2020',
      }),
      mode === 'development' && componentTagger ? componentTagger() : null,
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        strategies: mode === 'production' ? 'generateSW' : 'injectManifest',
        srcDir: 'public',
        filename: mode === 'production' ? 'sw.js' : 'sw-custom.js',
        workbox: {
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // Reduced to 3MB
          navigateFallbackDenylist: [/^\/api\//, /^\/hono\//, /^\/convex\//, /^\/_/],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              // Only cache specific public API endpoints, not all api.* domains
              urlPattern: ({ url }) => {
                const publicEndpoints = [
                  '/api/health',
                  '/hono/health',
                ];
                return publicEndpoints.some(endpoint => url.pathname === endpoint);
              },
              method: 'GET',
              handler: 'NetworkFirst',
              options: { 
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 5 * 60, // 5 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200],


                  headers: {
                    'Cache-Control': /^(?!.*no-store).*/,
                  },

                },
                plugins: [
                  {
                    cacheWillUpdate: async ({ request, response }) => {
                      // Never cache authenticated requests or responses with sensitive headers
                      if (request.headers.get('Authorization') ||
                          request.headers.get('Cookie') ||
                          response.headers.get('Cache-Control')?.includes('no-store') ||
                          response.headers.get('Set-Cookie')) {
                        return null;
                      }
                      return response;
                    },
                  },
                ],
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
              handler: 'StaleWhileRevalidate',
              options: { 
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } // 1 year
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
              handler: 'CacheFirst',
              options: { 
                cacheName: 'google-fonts-webfonts',
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } // 1 year
              }
            }
          ]
        },
        devOptions: {
          enabled: mode === 'development',
        },
        manifest: {
          name: 'ZapDev',
          short_name: 'ZapDev',
          description: 'ZapDev - Build full-stack web applications with AI in minutes.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#0b0f17',
          theme_color: '#0ea5e9',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Ensure environment variables are properly exposed (client-safe only)
    define: {
      'process.env': Object.fromEntries(
        Object.entries(env).filter(([key]) => key.startsWith('VITE_'))
      ),
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@headlessui/react', 'lucide-react', 'framer-motion'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'query-vendor': ['@tanstack/react-query', 'convex'],
            'ai-vendor': ['@ai-sdk/groq', 'groq-sdk', '@e2b/code-interpreter'],
            // Keep heavy libraries separate
            'chart-vendor': ['recharts'],
            'auth-vendor': ['@clerk/clerk-react', '@clerk/backend'],
          },
          // Optimize asset handling
          assetFileNames: (assetInfo: PreRenderedAsset) => {
            const safeName = assetInfo.name ?? 'unknown';
            const info = safeName.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(safeName)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(safeName)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/${ext}/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
      chunkSizeWarningLimit: 1000,
      // Enable source maps only in development
      sourcemap: mode === 'development',
      // Optimize CSS
      cssCodeSplit: true,
    },
  };
});
