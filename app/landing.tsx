"use client";

// useState not currently used but kept for future interactivity
import Link from "next/link";

// Import shared components
import { HeaderProvider } from "@/components/shared/header/HeaderContext";
// import HeaderBrandKit from "@/components/shared/header/BrandKit/BrandKit"; // Not used in current implementation
import HeaderWrapper from "@/components/shared/header/Wrapper/Wrapper";
import HeaderDropdownWrapper from "@/components/shared/header/Dropdown/Wrapper/Wrapper";
import ButtonUI from "@/components/ui/shadcn/button";
import { SignInButton } from "@clerk/nextjs";

// Import hero section components
import HomeHeroBackground from "@/components/app/(home)/sections/hero/Background/Background";
import { BackgroundOuterPiece } from "@/components/app/(home)/sections/hero/Background/BackgroundOuterPiece";
import HomeHeroBadge from "@/components/app/(home)/sections/hero/Badge/Badge";
import HomeHeroPixi from "@/components/app/(home)/sections/hero/Pixi/Pixi";
import HomeHeroTitle from "@/components/app/(home)/sections/hero/Title/Title";
import HeroInput from "@/components/app/(home)/sections/hero-input/HeroInput";
import { Connector } from "@/components/shared/layout/curvy-rect";
import HeroFlame from "@/components/shared/effects/flame/hero-flame";
import ZapDevIcon from "@/components/ZapDevIcon";
import ZapDevLogo from "@/components/ZapDevLogo";

export default function LandingPage() {
  return (
    <HeaderProvider>
      <div className="min-h-screen bg-background-base">
        {/* Header/Navigation Section */}
        <HeaderDropdownWrapper />

        <div className="sticky top-0 left-0 w-full z-[101] bg-background-base header">
          <div className="absolute top-0 cmw-container border-x border-border-faint h-full pointer-events-none" />
          <div className="h-1 bg-border-faint w-full left-0 -bottom-1 absolute" />
          
          <div className="cmw-container absolute h-full pointer-events-none top-0">
            <Connector className="absolute -left-[10.5px] -bottom-11" />
            <Connector className="absolute -right-[10.5px] -bottom-11" />
          </div>

          <HeaderWrapper>
            <div className="max-w-[900px] mx-auto w-full flex justify-between items-center">
              <div className="flex gap-24 items-center">
                <Link href="/" className="flex items-center gap-2">
                  <ZapDevIcon className="w-7 h-7 text-accent-black" />
                  <ZapDevLogo className="w-[88px] h-[24px]" />
                </Link>
              </div>

              <div className="flex gap-8">
                <SignInButton>
                  <ButtonUI variant="tertiary">
                    Sign In
                  </ButtonUI>
                </SignInButton>
              </div>
            </div>
          </HeaderWrapper>
        </div>

        {/* Hero Section */}
        <section className="overflow-x-clip" id="home-hero">
          <div className="pt-28 lg:pt-254 lg:-mt-100 pb-115 relative" id="hero-content">
            <HomeHeroPixi />
            <HeroFlame />
            <BackgroundOuterPiece />
            <HomeHeroBackground />

            <div className="relative container px-16">
              <HomeHeroBadge />
              <HomeHeroTitle />
              
              {/* Hero Input */}
              <div className="mt-24">
                <HeroInput />
              </div>
            </div>
          </div>
        </section>
      </div>
    </HeaderProvider>
  );
}
