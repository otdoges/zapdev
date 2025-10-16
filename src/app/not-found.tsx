import type { Metadata } from "next";
import Link from "next/link";
import { Home, ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for could not be found. Explore our frameworks and use cases to build amazing applications with AI.",
  robots: { index: false, follow: true },
};

const popularLinks = [
  { title: "Frameworks", href: "/frameworks", description: "Explore supported frameworks" },
  { title: "Use Cases", href: "/use-cases", description: "See what you can build" },
  { title: "Pricing", href: "/pricing", description: "View pricing plans" },
];

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <div className="flex gap-4 mb-12">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/frameworks">
            <Search className="w-4 h-4 mr-2" />
            Explore
          </Link>
        </Button>
      </div>

      <div className="max-w-4xl w-full">
        <h3 className="text-xl font-semibold mb-4 text-center">Popular Pages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {popularLinks.map((link) => (
            <Card key={link.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="w-full">
                  <Link href={link.href}>
                    Visit Page
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

