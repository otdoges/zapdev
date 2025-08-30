import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { PostHogProvider } from '@/components/PostHogProvider';
import { ReactScanProvider } from '@/components/ReactScanProvider';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <PostHogProvider>
          <ReactScanProvider>
            <html lang="en">
              <body className={inter.className}>
                {children}
              </body>
            </html>
          </ReactScanProvider>
        </PostHogProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
