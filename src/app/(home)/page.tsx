import Image from "next/image";
import type { Metadata } from "next";

import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/projects-list";
import { StructuredData } from "@/components/seo/structured-data";
import { 
  generateOrganizationSchema, 
  generateWebsiteSchema, 
  generateSoftwareApplicationSchema 
} from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Zapdev - Build Apps with AI | AI-Powered Development Platform",
  description: "Build apps and websites by chatting with AI. Support for Next.js, React, Vue, Angular, and Svelte. Transform your ideas into production-ready code instantly.",
  keywords: ["ai development", "code generation", "web development", "ai builder", "nextjs", "react", "vue"],
  openGraph: {
    type: "website",
    images: [{ url: "/og-home.png", width: 1200, height: 630 }],
  },
};

const Page = () => {
  return (
    <>
      <StructuredData 
        data={[
          generateOrganizationSchema(),
          generateWebsiteSchema(),
          generateSoftwareApplicationSchema(),
        ]} 
      />
      <div className="flex flex-col max-w-5xl mx-auto w-full">
        <section className="space-y-6 py-[16vh] 2xl:py-48">
          <div className="flex flex-col items-center">
            <Image
              src="/logo.svg"
              alt="ZapDev - AI-Powered Development Platform"
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
    </>
  );
};
 
export default Page;
