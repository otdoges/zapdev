import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
