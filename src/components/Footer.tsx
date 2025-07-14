
import { Github, Twitter } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  return (
    <footer className="w-full py-12 mt-20">
      <div className="container px-4">
        <div className="glass glass-hover rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">WebFluin</h3>
              <p className="text-sm text-muted-foreground">
                The fastest way for tech founders to get professionally designed websites with AI.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Github className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Templates
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Design Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    AI Prompts
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} WebFluin. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
