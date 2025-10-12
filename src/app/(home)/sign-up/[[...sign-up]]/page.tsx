import type { Metadata } from "next";

import { SignUpContent } from "@/modules/home/ui/components/sign-up-content";

export const metadata: Metadata = {
  title: "Sign Up | Zapdev",
  description: "Create a Zapdev account and start building AI-assisted applications in minutes.",
  alternates: {
    canonical: "/sign-up",
  },
  robots: {
    index: false,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "RegisterAction",
  name: "Zapdev Sign Up",
  target: "https://zapdev.link/sign-up",
  result: {
    "@type": "Person",
    description: "Zapdev user account",
  },
};

const Page = () => {
  return ( 
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SignUpContent />
    </div>
   );
}
 
export default Page;
