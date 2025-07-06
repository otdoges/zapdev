import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import '@/lib/browser-polyfills';

import { AuthProvider } from '@/providers/AuthProvider';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { SentryProvider } from '@/components/sentry-provider';
import { VersionCheck } from '@/components/version-check';
import { ChunkErrorHandler } from '@/components/chunk-error-handler';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { CookieConsentBanner } from '@/components/ui/cookie-consent-banner';
import { QueryProvider } from '@/lib/query-client';
import { AnalyticsScripts } from '@/components/analytics-scripts';

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



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body
        className="m-0 flex min-h-screen w-full flex-col overflow-x-hidden bg-[#0D0D10] p-0 text-[#EAEAEA]"
        suppressHydrationWarning
      >
        <ChunkErrorHandler />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SentryProvider>
              <AuthProvider>
                <RealtimeProvider>
                  <main className="w-full flex-1">{children}</main>
                  <VersionCheck />
                  <Toaster />
                  <CookieConsentBanner />
                  <Analytics />
                  <AnalyticsScripts />
                </RealtimeProvider>
              </AuthProvider>
            </SentryProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
