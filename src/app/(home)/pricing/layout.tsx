import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description: "Choose the Zapdev plan that fits your needs.",
  canonicalPath: "/pricing",
  imagePath: "/api/og/home",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
