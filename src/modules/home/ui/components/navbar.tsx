"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";


export const Navbar = () => {
  const isScrolled = useScroll();
  const { data: session, isPending } = useSession();

  const authContent = isPending ? (
    <div
      className="h-9 w-28 rounded-full bg-muted/60 animate-pulse"
      aria-label="Loading account"
      aria-live="polite"
      aria-busy="true"
    />
  ) : session ? (
    <UserControl showName />
  ) : (
    <div className="flex gap-2">
      <Link href="/sign-up">
        <Button variant="outline" size="sm">
          Sign up
        </Button>
      </Link>
      <Link href="/sign-in">
        <Button size="sm">
          Sign in
        </Button>
      </Link>
    </div>
  );

  return (
    <nav
      className={cn(
        "p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b border-transparent",
        isScrolled && "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border"
      )}
    >
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="ZapDev - AI-Powered Development Platform" width={24} height={24} />
            <span className="font-semibold text-lg">ZapDev</span>
          </Link>
          
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        {authContent}
      </div>
    </nav>
  );
};
