import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

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
  metadataBase: new URL('https://zapdev.link'),
  title: {
    default: 'ZapDev: AI-Powered Development Platform to Build and Deploy Web Apps',
    template: '%s | ZapDev',
  },
  description:
    'ZapDev is an innovative AI-driven platform that empowers you to generate, preview, and deploy stunning web applications in seconds. Turn your ideas into reality with our cutting-edge AI assistant and WebContainer technology.',
  generator: 'ZapDev',
  applicationName: 'ZapDev',
  keywords: [
    'AI development',
    'web apps',
    'code generation',
    'WebContainer',
    'AI assistant',
    'AI developer tools',
    'no-code',
    'low-code',
    'application builder',
    'deploy web apps',
    'AI website builder',
  ],
  authors: [{ name: 'ZapDev Team', url: 'https://zapdev.link' }],
  creator: 'ZapDev',
  publisher: 'ZapDev',
  openGraph: {
    title: 'ZapDev: AI-Powered Development Platform',
    description:
      'Generate, preview, and deploy stunning web applications in seconds with our AI-driven development platform.',
    url: 'https://zapdev.link',
    siteName: 'ZapDev',
    images: [
      {
        url: 'https://zapdev.link/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ZapDev AI-Powered Development Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZapDev: AI-Powered Development Platform',
    description:
      'Generate, preview, and deploy stunning web applications in seconds with our AI-driven development platform.',
    creator: '@zapdev',
    images: ['https://zapdev.link/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'ZapDev',
              url: 'https://zapdev.link',
              logo: 'https://zapdev.link/logo.png',
              sameAs: [
                'https://twitter.com/zapdev',
              ],
            }),
          }}
        />
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
