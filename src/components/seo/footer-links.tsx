import Link from "next/link";

export function FooterLinks() {
  const footerLinks = {
    product: [
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Frameworks", href: "/frameworks" },
      { name: "Use Cases", href: "/use-cases" },
    ],
    frameworks: [
      { name: "Next.js", href: "/frameworks/nextjs" },
      { name: "React", href: "/frameworks/react" },
      { name: "Vue.js", href: "/frameworks/vue" },
      { name: "Angular", href: "/frameworks/angular" },
      { name: "Svelte", href: "/frameworks/svelte" },
    ],
    useCases: [
      { name: "Landing Pages", href: "/use-cases/landing-pages" },
      { name: "E-commerce", href: "/use-cases/ecommerce" },
      { name: "Dashboards", href: "/use-cases/dashboards" },
      { name: "SaaS Apps", href: "/use-cases/saas" },
    ],
    company: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Contact", href: "/contact" },
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
  };

  return (
    <footer className="border-t mt-16">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Frameworks</h3>
            <ul className="space-y-2">
              {footerLinks.frameworks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Use Cases</h3>
            <ul className="space-y-2">
              {footerLinks.useCases.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Zapdev. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
