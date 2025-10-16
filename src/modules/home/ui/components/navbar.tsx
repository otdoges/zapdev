"use client";

import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const isScrolled = useScroll();

  return (
    <nav
      className={cn(
        "p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b border-transparent",
        isScrolled && "bg-background border-border"
      )}
    >
      <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="ZapDev" width={24} height={24} />
          <span className="font-semibold text-lg">ZapDev</span>
        </Link>
        <div className="flex gap-2">
          <Link href="/home/sign-up">
            <Button variant="outline" size="sm">
              Sign up
            </Button>
          </Link>
          <Link href="/home/sign-in">
            <Button size="sm">Sign in</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
