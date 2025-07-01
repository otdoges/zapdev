import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { PostHogProvider } from '@/components/PostHogProvider';
import SupabaseProvider from '@/components/SupabaseProvider';
import { VersionCheck } from '@/components/version-check';
import { ChunkErrorHandler } from '@/components/chunk-error-handler';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { CookieConsentBanner } from '@/components/ui/cookie-consent-banner';
import { QueryProvider } from '@/lib/query-client';
import { SentryProvider } from '@/components/sentry-provider';
import { PerformanceOptimizer } from '@/components/performance-optimizer';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0D10' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'ZapDev - Build Amazing Apps with AI',
    template: '%s | ZapDev',
  },
  description:
    'The most powerful AI-driven development platform. Generate, preview, and deploy beautiful applications in seconds with advanced reasoning models like DeepSeek R1 and Qwen QwQ.',
  generator: 'ZapDev',
  applicationName: 'ZapDev',
  keywords: [
    'AI development',
    'web apps',
    'code generation',
    'WebContainer',
    'AI assistant',
    'DeepSeek R1',
    'Qwen QwQ',
    'reasoning models',
    'app builder',
    'no-code',
    'low-code',
  ],
  authors: [{ name: 'ZapDev Team', url: 'https://zapdev-mu.vercel.app' }],
  creator: 'ZapDev Team',
  publisher: 'ZapDev',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL 
      ? (process.env.NEXT_PUBLIC_APP_URL.startsWith('http') 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : `https://${process.env.NEXT_PUBLIC_APP_URL}`)
      : 'https://zapdev-mu.vercel.app'
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'ZapDev - Build Amazing Apps with AI',
    description:
      'The most powerful AI-driven development platform. Generate, preview, and deploy beautiful applications in seconds.',
    siteName: 'ZapDev',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ZapDev - AI-Powered Development Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZapDev - Build Amazing Apps with AI',
    description:
      'The most powerful AI-driven development platform. Generate, preview, and deploy beautiful applications in seconds.',
    images: ['/og-image.png'],
    creator: '@zapdev',
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
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  category: 'technology',
  classification: 'AI Development Platform',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'ZapDev',
  },
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false, // Prevent layout shift
});

// Inline critical CSS to prevent FOUC
const criticalCSS = `
  html { 
    color-scheme: dark; 
    background-color: #0d0d10; 
    height: 100%; 
  }
  html.light { 
    color-scheme: light; 
    background-color: #ffffff; 
  }
  body { 
    margin: 0; 
    padding: 0; 
    min-height: 100vh; 
    transition: background-color 0.15s ease, color 0.15s ease;
    font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
  }
  .theme-loading {
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .theme-loaded {
    opacity: 1;
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} font-sans theme-loading`} 
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0D0D10" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//api.groq.com" />
        <link rel="dns-prefetch" href="//openrouter.ai" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'ZapDev',
              description:
                'AI-powered development platform for building applications with advanced reasoning models',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              creator: {
                '@type': 'Organization',
                name: 'ZapDev Team',
              },
            }),
          }}
        />
      </head>
      <body
        className="m-0 flex min-h-screen w-full flex-col overflow-x-hidden p-0"
        suppressHydrationWarning
      >
        <PerformanceOptimizer />
        <ChunkErrorHandler />
        <SupabaseProvider>
          <QueryProvider>
            <SentryProvider>
              <PostHogProvider>
                <ThemeProvider 
                  attribute="class" 
                  defaultTheme="dark" 
                  enableSystem
                  disableTransitionOnChange={false}
                  storageKey="zapdev-theme"
                >
                  <main className="w-full flex-1" role="main">{children}</main>
                  <VersionCheck />
                  <Toaster />
                  <CookieConsentBanner />
                </ThemeProvider>
              </PostHogProvider>
            </SentryProvider>
          </QueryProvider>
        </SupabaseProvider>
        <Analytics />
        {/* Theme loading script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const html = document.documentElement;
                const theme = localStorage.getItem('zapdev-theme') || 'dark';
                if (theme === 'light') {
                  html.classList.add('light');
                }
                // Remove loading class after theme is applied
                setTimeout(() => {
                  html.classList.remove('theme-loading');
                  html.classList.add('theme-loaded');
                }, 100);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
