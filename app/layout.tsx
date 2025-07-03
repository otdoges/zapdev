import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

import { AuthProvider } from '@/providers/AuthProvider';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { SentryProvider } from '@/components/sentry-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { VersionCheck } from '@/components/version-check';
import { ChunkErrorHandler } from '@/components/chunk-error-handler';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { CookieConsentBanner } from '@/components/ui/cookie-consent-banner';
import { QueryProvider } from '@/lib/query-client';

export const viewport: Viewport = {
  themeColor: '#0D0D10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'ZapDev - Build Amazing Apps with AI',
  description:
    'The most powerful AI-driven development platform. Generate, preview, and deploy beautiful applications in seconds.',
  generator: 'ZapDev',
  applicationName: 'ZapDev',
  keywords: ['AI development', 'web apps', 'code generation', 'WebContainer', 'AI assistant'],
  authors: [{ name: 'ZapDev Team' }],
  metadataBase: new URL('https://zapdev-mu.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'ZapDev - Build Amazing Apps with AI',
    description:
      'The most powerful AI-driven development platform. Generate, preview, and deploy beautiful applications in seconds.',
    siteName: 'ZapDev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZapDev - Build Amazing Apps with AI',
    description:
      'The most powerful AI-driven development platform. Generate, preview, and deploy beautiful applications in seconds.',
  },
  icons: {
    shortcut: '/favicon.svg',
  },
  formatDetection: {
    telephone: false,
  },
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error?.status)) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        {/* Plausible Analytics */}
        <script 
          defer 
          data-domain="zapdev-mu.vercel.app" 
          src="https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`
          }}
        />
        {/* Umami Analytics */}
        <script 
          defer 
          src="https://cloud.umami.is/script.js" 
          data-website-id="ad8b9534-5d4b-4039-a361-c71d2a6accee"
        />
      </head>
      <body
        className="m-0 flex min-h-screen w-full flex-col overflow-x-hidden bg-[#0D0D10] p-0 text-[#EAEAEA]"
        suppressHydrationWarning
      >
        <ChunkErrorHandler />
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SentryProvider>
              <AuthProvider>
                <RealtimeProvider>
                  <QueryProvider>
                    <main className="w-full flex-1">{children}</main>
                    <VersionCheck />
                    <Toaster />
                    <CookieConsentBanner />
                    <Analytics />
                  </QueryProvider>
                </RealtimeProvider>
              </AuthProvider>
            </SentryProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
