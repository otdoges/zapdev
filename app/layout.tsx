import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { PostHogProvider } from '@/components/PostHogProvider';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { AutumnWrapper } from './components/AutumnWrapper';
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zapdev",
  description: "Chat with AI to build React apps instantly with advanced features inspired by scout.new.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#3b82f6',
        },
      }}
    >
      <ConvexClientProvider>
        <AutumnWrapper>
          <PostHogProvider>
            <html lang="en">
              <body className={inter.className}>
                {children}
                <SpeedInsights />
              </body>
            </html>
          </PostHogProvider>
        </AutumnWrapper>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
