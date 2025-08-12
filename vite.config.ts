import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
let componentTagger: (() => any) | null = null;
try {
  // @ts-ignore - optional dev-only dependency
  componentTagger = require("lovable-tagger").componentTagger;
} catch (_err) {
  componentTagger = null;
}
import { VitePWA } from "vite-plugin-pwa";

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
      },
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger ? componentTagger() : null,
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/api\//, /^\/convex\//, /^\/_/],
          runtimeCaching: [{
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' }
          }]
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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id || !id.includes('node_modules')) return;
            const normalized = id.replace(/\\/g, '/');
            const lastIndex = normalized.lastIndexOf('node_modules');
            if (lastIndex === -1) return;

            let start = lastIndex + 'node_modules'.length;
            if (normalized[start] === '/') start += 1;

            const after = normalized.slice(start);
            if (!after) return;

            const segments = after.split('/');
            if (segments.length === 0 || !segments[0]) return;

            const isScoped = segments[0].startsWith('@');
            let pkg = '';
            if (isScoped && segments.length > 1) {
              pkg = `${segments[0]}/${segments[1]}`;
            } else if (!isScoped) {
              pkg = segments[0];
            }

            if (!pkg) return;

            const safe = pkg.replace(/@/g, '').replace(/\//g, '-');
            if (!safe) return;

            return `vendor-${safe}`;
          },
        },
      },
      chunkSizeWarningLimit: 1600,
    },
  };
});
