import type { Metadata } from "next";
import Image from "next/image";

import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/projects-list";

export const metadata: Metadata = {
  title: "AI Development Platform | Zapdev",
  description: "Launch production-ready apps faster with Zapdev's AI-assisted development workspace for modern teams.",
  keywords: [
    "AI development",
    "app builder",
    "Zapdev platform",
    "software automation",
    "web app generator",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Build with Zapdev's AI Development Platform",
    description: "Prototype, iterate, and ship modern applications with collaborative AI workflows.",
    url: "https://zapdev.link/",
    siteName: "Zapdev",
    images: [
      {
        url: "https://zapdev.link/logo.svg",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Development Platform | Zapdev",
    description: "Build production-ready apps faster with Zapdev's collaborative AI development environment.",
    images: ["https://zapdev.link/logo.svg"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Zapdev",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: "https://zapdev.link/",
  image: "https://zapdev.link/logo.svg",
  description:
    "Zapdev is an AI-powered development environment that helps teams design, build, and launch software faster.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    category: "FreeTrial",
    availability: "https://schema.org/InStock",
  },
  potentialAction: {
    "@type": "CreateAction",
    target: "https://zapdev.link/",
    name: "Start a new Zapdev project",
  },
};

const Page = () => {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="ZapDev"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>
        <h1 className="text-2xl md:text-5xl font-bold text-center">
          Build something with ZapDev
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground text-center">
          Create apps and websites by chatting with AI
        </p>
        <div className="max-w-3xl mx-auto w-full">
          <ProjectForm />
        </div>
      </section>
      <ProjectsList />
    </div>
  );
};
 
export default Page;
