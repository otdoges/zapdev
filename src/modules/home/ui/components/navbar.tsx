"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const frameworks = [
  { name: "React", href: "/frameworks/react", icon: "⚛️" },
  { name: "Vue.js", href: "/frameworks/vue", icon: "🟢" },
  { name: "Angular", href: "/frameworks/angular", icon: "🅰️" },
  { name: "Svelte", href: "/frameworks/svelte", icon: "🔥" },
  { name: "Next.js", href: "/frameworks/nextjs", icon: "▲" },
];

export const Navbar = () => {
  const isScrolled = useScroll();
  const pathname = usePathname();

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
                <NavigationMenuTrigger>Frameworks</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    {frameworks.map((framework) => (
                      <li key={framework.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={framework.href}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                              pathname === framework.href && "bg-accent"
                            )}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium leading-none">
                              <span>{framework.icon}</span>
                              {framework.name}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Build {framework.name} apps with AI assistance
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                    <li className="col-span-2">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/frameworks"
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">
                            All Frameworks
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Compare all supported frameworks and choose the best for your project
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link href="/showcase" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Showcase
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link href="/home/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <SignedOut>
          <div className="flex gap-2">
            <SignUpButton>
              <Button variant="outline" size="sm">
                Sign up
              </Button>
            </SignUpButton>
            <SignInButton>
              <Button size="sm">
                Sign in
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
        <SignedIn>
          <UserControl showName />
        </SignedIn>
      </div>
    </nav>
  );
};
