import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider';
import { ClerkProvider } from '@clerk/nextjs';
import { PostHogProvider } from '@/components/PostHogProvider'
import ConvexClientProvider from '@/components/ConvexClientProvider';
import Navbar from '@/components/navbar';
import './globals.css'

export const metadata: Metadata = {
  title: 'ZapDev - Design with Feeling. Build with Speed.',
  description: 'Transform your vibe into stunning, responsive websites in Svelte, Astro, and more.',
  generator: 'ZapDev',
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-[#0D0D10] text-[#EAEAEA]">
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          afterSignInUrl="/chat"
          afterSignUpUrl="/chat"
        >
          <ConvexClientProvider>
            <PostHogProvider>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <Navbar />
                <main className="flex-1">
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