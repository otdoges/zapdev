"use client";

import Image from "next/image";
import { dark } from "@clerk/themes";
import { PricingTable } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { useCurrentTheme } from "@/hooks/use-current-theme";

const Page = () => {
  const currentTheme = useCurrentTheme();
  const [clerkAvailable, setClerkAvailable] = useState(false);
  useEffect(() => {
    setClerkAvailable(!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  }, []);

  return ( 
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <section className="space-y-6 pt-[16vh] 2xl:pt-48">
        <div className="flex flex-col items-center">
          <Image 
            src="/logo.svg"
            alt="ZapDev"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>
        <h1 className="text-xl md:text-3xl font-bold text-center">Pricing</h1>
        <p className="text-muted-foreground text-center text-sm md:text-base">
          Choose the plan that fits your needs
        </p>
        {clerkAvailable ? (
          <PricingTable
            appearance={{
              baseTheme: currentTheme === "dark" ? dark : undefined,
              elements: {
                pricingTableCard: "border! shadow-none! rounded-lg!"
              }
            }}
          />
        ) : (
          <p className="text-muted-foreground text-center text-sm md:text-base">
            Sign up is currently unavailable.
          </p>
        )}
      </section>
    </div>
   );
}
 
export default Page;