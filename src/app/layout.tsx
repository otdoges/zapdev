import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import { Databuddy } from "@databuddy/sdk";

import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";
import { defaultMetadata } from "@/seo/metadata";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/seo/jsonld";
import { AppProviders } from "./providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppProviders>
      <TRPCReactProvider>
        <html lang="en" suppressHydrationWarning>
          <head>
            <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster />
              {children}
              <Databuddy
                clientId={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID!}
                trackHashChanges={true}
                trackAttributes={true}
                trackOutgoingLinks={true}
                trackInteractions={true}
                trackEngagement={true}
                trackScrollDepth={true}
                trackExitIntent={true}
                trackBounceRate={true}
                trackWebVitals={true}
                trackErrors={true}
                enableBatching={true}
              />
            </ThemeProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </AppProviders>
  );
};
