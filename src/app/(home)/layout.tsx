import type { Metadata } from "next";
import { Navbar } from "@/modules/home/ui/components/navbar";
import { buildPageMetadata } from "@/lib/seo";

interface Props {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return ( 
    <main className="flex flex-col min-h-screen max-h-screen">
      <Navbar />
      <div className="absolute inset-0 -z-10 h-full w-full bg-background dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)] bg-[radial-gradient(#dadde2_1px,transparent_1px)] [background-size:16px_16px]" aria-hidden="true" />
      <div className="flex-1 flex flex-col px-4 pb-4">
        {children}
      </div>
    </main>
  );
};
 
export default Layout;

export const metadata: Metadata = buildPageMetadata({
  title: "Zapdev",
  description: "Create apps and websites by chatting with AI.",
  canonicalPath: "/",
  imagePath: "/api/og/home",
});
