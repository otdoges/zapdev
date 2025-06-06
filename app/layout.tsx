import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider';
import { ClerkProvider } from '@clerk/nextjs';
import { PostHogProvider } from '@/components/PostHogProvider'
import ConvexClientProvider from '@/components/ConvexClientProvider';
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#0D0D10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'ZapDev - Design with Feeling. Build with Speed.',
  description: 'Transform your vibe into stunning, responsive websites in Svelte, Astro, and more.',
  generator: 'ZapDev',
  applicationName: 'ZapDev Studio',
  keywords: ['web design', 'AI coding', 'UI generation', 'web development'],
  authors: [{ name: 'ZapDev Team' }],
  metadataBase: new URL('https://zapdev.ai'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'ZapDev - Design with Feeling. Build with Speed.',
    description: 'Transform your vibe into stunning, responsive websites in Svelte, Astro, and more.',
    siteName: 'ZapDev Studio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZapDev - Design with Feeling. Build with Speed.',
    description: 'Transform your vibe into stunning, responsive websites in Svelte, Astro, and more.',
  },
  formatDetection: {
    telephone: false,
  },
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta httpEquiv="Cache-Control" content="public, max-age=3600, must-revalidate" />
      </head>
      <body className="min-h-screen w-full flex flex-col bg-[#0D0D10] text-[#EAEAEA] overflow-x-hidden m-0 p-0">
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          afterSignInUrl="/chat"
          afterSignUpUrl="/chat"
        >
          <ConvexClientProvider>
            <PostHogProvider>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <main className="flex-1 w-full">
                  {children}
                </main>
              </ThemeProvider>
            </PostHogProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}