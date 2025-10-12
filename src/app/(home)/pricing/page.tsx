import type { Metadata } from "next";

import { PricingContent } from "@/modules/home/ui/components/pricing-content";

export const metadata: Metadata = {
  title: "Pricing | Zapdev",
  description: "Compare Zapdev pricing plans and choose the level of AI-assisted development that fits your team.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Zapdev Pricing",
    description: "Flexible plans for teams who want to build faster with AI-powered workflows.",
    url: "https://zapdev.link/pricing",
    siteName: "Zapdev",
  },
  twitter: {
    card: "summary",
    title: "Zapdev Pricing",
    description: "Flexible plans for AI-assisted development workflows.",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Zapdev Subscription",
  description: "AI-driven development platform offering collaborative project spaces and automation tooling.",
  brand: {
    "@type": "Brand",
    name: "Zapdev",
  },
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "FreeTrial",
      url: "https://zapdev.link/pricing",
      availability: "https://schema.org/InStock",
    },
  ],
};

const Page = () => {
  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PricingContent />
    </div>
   );
}
 
export default Page;