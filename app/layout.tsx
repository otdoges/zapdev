import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { PostHogProvider } from '@/components/PostHogProvider'
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
      <body className="min-h-screen bg-[#0D0D10] text-[#EAEAEA]">
        <ClerkProvider>
          <PostHogProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <header style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <SignedOut>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <SignInButton />
                    <SignUpButton />
                  </div>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </header>
              {children}
            </ThemeProvider>
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}