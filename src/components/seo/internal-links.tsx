import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RelatedLink } from "@/lib/seo/internal-linking";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InternalLinksProps {
  title?: string;
  links: RelatedLink[];
  className?: string;
}

export function InternalLinks({ title = "Related Resources", links, className = "" }: InternalLinksProps) {
  if (links.length === 0) return null;

  return (
    <section className={`py-8 ${className}`}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {links.map((link) => (
          <Card key={link.href} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{link.title}</CardTitle>
              {link.description && (
                <CardDescription>{link.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full group">
                <Link href={link.href}>
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

interface InlineLinksProps {
  links: RelatedLink[];
  className?: string;
}

export function InlineLinks({ links, className = "" }: InlineLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          {link.title}
          <ArrowRight className="w-3 h-3" />
        </Link>
      ))}
    </div>
  );
}

interface BreadcrumbProps {
  items: Array<{ name: string; href?: string }>;
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm text-muted-foreground ${className}`}>
      {items.map((item, index) => (
        <div key={item.name} className="flex items-center">
          {index > 0 && <span className="mx-2">/</span>}
          {item.href && index < items.length - 1 ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.name}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.name}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
