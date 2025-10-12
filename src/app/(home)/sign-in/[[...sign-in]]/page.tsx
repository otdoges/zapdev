import type { Metadata } from "next";

import { SignInContent } from "@/modules/home/ui/components/sign-in-content";

export const metadata: Metadata = {
  title: "Sign In | Zapdev",
  description: "Access your Zapdev workspace to continue building with AI-powered development tools.",
  alternates: {
    canonical: "/sign-in",
  },
  robots: {
    index: false,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Zapdev Sign In",
  url: "https://zapdev.link/sign-in",
  applicationCategory: "DeveloperApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const Page = () => {
  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SignInContent />
    </div>
   );
}
 
export default Page;
