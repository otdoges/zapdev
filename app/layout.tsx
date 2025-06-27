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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta httpEquiv="Cache-Control" content="public, max-age=3600, must-revalidate" />
      </head>
      <body
        className="m-0 flex min-h-screen w-full flex-col overflow-x-hidden bg-[#0D0D10] p-0 text-[#EAEAEA]"
        suppressHydrationWarning
      >
        <ChunkErrorHandler />
        <SupabaseProvider>
          <PostHogProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <main className="w-full flex-1">{children}</main>
              <VersionCheck />
              <Toaster />
              <CookieConsentBanner />
            </ThemeProvider>
          </PostHogProvider>
        </SupabaseProvider>
        <Analytics />
      </body>
    </html>
  );
}
