import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from '@clerk/nextjs';
import { ConvexClientProvider } from '@/lib/ConvexClientProvider';
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "ZapDev",
  description: "Re-imagine any website in seconds with AI-powered website builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en" suppressHydrationWarning>
          <body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} font-sans`}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange={false}
            >
              {children}
            </ThemeProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
