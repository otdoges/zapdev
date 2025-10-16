import Image from "next/image";
import type { Metadata } from "next";
import { createPageMetadata } from "@/seo/metadata";

import { ProjectForm } from "@/modules/home/ui/components/project-form";
// ProjectsList uses Clerk client hooks; render only on client via wrapper
import { Suspense } from "react";
const ProjectsList = () => null;

const Page = () => {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
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
      <Suspense>
        <ProjectsList />
      </Suspense>
    </div>
  );
};
 
export default Page;

export const metadata: Metadata = createPageMetadata({
  title: "ZapDev – AI App Builder",
  description: "Create apps and websites by chatting with AI.",
  path: "/home",
  keywords: [
    "AI app builder",
    "AI website builder",
    "generate apps with AI",
  ],
});
