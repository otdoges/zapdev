"use client";

import Image from "next/image";
import CustomPricingTable from "@/components/autumn/custom-pricing-table";

export function PricingPageContent() {
  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
      <section className="space-y-12 pt-[16vh] 2xl:pt-48 pb-24">
        <div className="flex flex-col items-center space-y-6">
          <Image
            src="/logo.svg"
            alt="ZapDev - AI Development Platform"
            width={60}
            height={60}
            className="hidden md:block"
          />
          <div className="text-center space-y-4 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              Choose the perfect plan for your development needs. Upgrade or downgrade at any time.
            </p>
          </div>
        </div>
        <CustomPricingTable />
      </section>
    </div>
   );
}