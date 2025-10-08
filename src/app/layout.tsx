import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Databuddy } from "@databuddy/sdk";

import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zapdev - Build Fast, Scale Smart",
    template: "%s | Zapdev"
  },
  description: "Zapdev is a leading software development company specializing in building scalable web applications, mobile apps, and enterprise solutions. Transform your ideas into reality with our expert development team.",
  keywords: ["software development", "web development", "mobile apps", "enterprise solutions", "Zapdev", "app development", "custom software"],
  authors: [{ name: "Zapdev" }],
  creator: "Zapdev",
  publisher: "Zapdev",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://zapdev.link"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zapdev.link",
    title: "Zapdev - Build Fast, Scale Smart",
    description: "Zapdev is a leading software development company specializing in building scalable web applications, mobile apps, and enterprise solutions.",
    siteName: "Zapdev",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zapdev - Build Fast, Scale Smart",
    description: "Zapdev is a leading software development company specializing in building scalable web applications, mobile apps, and enterprise solutions.",
    creator: "@zapdev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#C96342",
        },
      }}
    >
      <TRPCReactProvider>
        <html lang="en" suppressHydrationWarning>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Zapdev",
                url: "https://zapdev.link",
                logo: "https://zapdev.link/logo.png",
                description: "Zapdev is a leading software development company specializing in building scalable web applications, mobile apps, and enterprise solutions.",
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "sales",
                  availableLanguage: "English"
                },
                sameAs: [
                  "https://twitter.com/zapdev",
                  "https://linkedin.com/company/zapdev"
                ]
              }),
            }}
          />
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
                clientId="idyqxiu_d_-8iTANsiprw"
                trackAttributes={true}
                trackOutgoingLinks={true}
                trackInteractions={true}
                trackEngagement={true}
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
    </ClerkProvider>
  );
};
