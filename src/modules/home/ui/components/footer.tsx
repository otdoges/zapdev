import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="ZapDev" width={24} height={24} />
              <span className="font-semibold text-lg">ZapDev</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered development platform for building web applications.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
                  Projects
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="mailto:support@zapdev.link" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  support@zapdev.link
                </a>
              </li>
              <li>
                <a 
                  href="https://zapdev.link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  zapdev.link
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} ZapDev. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
