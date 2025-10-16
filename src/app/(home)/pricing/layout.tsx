import type { Metadata } from "next";
import { generateMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Pricing Plans - Affordable AI Development",
  description: "Choose the perfect Zapdev pricing plan for your needs. Free tier available. Build unlimited projects with our AI-powered development platform.",
  keywords: [
    "zapdev pricing",
    "ai development pricing",
    "subscription plans",
    "free tier",
    "developer pricing",
  ],
  canonical: "/pricing",
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
