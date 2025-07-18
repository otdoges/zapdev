
import { useState, useEffect } from "react";
import { Sparkles, Menu, User } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { redirectToWorkOS } from "@/lib/workos";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'testimonials') {
      const testimonialSection = document.querySelector('.animate-marquee');
      if (testimonialSection) {
        const yOffset = -100; // Offset to account for the fixed header
        const y = testimonialSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else if (sectionId === 'cta') {
      const ctaSection = document.querySelector('.button-gradient');
      if (ctaSection) {
        const yOffset = -100;
        const y = ctaSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navItems = [
    { name: "Features", href: "#features", onClick: () => scrollToSection('features') },
    { name: "Pricing", href: "#pricing", onClick: () => scrollToSection('pricing') },
    { name: "Templates", href: "#testimonials", onClick: () => scrollToSection('testimonials') },
    { name: "AI Builder", href: "/chat", isLink: true },
  ];

  return (
    <header
      className={`fixed top-3.5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 rounded-full ${
        isScrolled 
          ? "h-14 bg-[#1B1B1B]/40 backdrop-blur-xl border border-white/10 scale-95 w-[90%] max-w-2xl" 
          : "h-14 bg-[#1B1B1B] w-[95%] max-w-3xl"
      }`}
    >
      <div className="mx-auto h-full px-6">
        <nav className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-base">zapdev</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              item.isLink ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.onClick) {
                      item.onClick();
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300"
                >
                  {item.name}
                </a>
              )
            ))}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => navigate('/settings')}
                  size="sm"
                  variant="outline"
                  className="border-gray-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  onClick={logout}
                  size="sm"
                  variant="outline"
                  className="border-gray-700"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => redirectToWorkOS()}
                size="sm"
                className="button-gradient"
              >
                Get Started
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="glass">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-[#1B1B1B]">
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    item.isLink ? (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <a
                        key={item.name}
                        href={item.href}
                        className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsMobileMenuOpen(false);
                          if (item.onClick) {
                            item.onClick();
                          }
                        }}
                      >
                        {item.name}
                      </a>
                    )
                  ))}
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-2 mt-4">
                      <Button 
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate('/settings');
                        }}
                        variant="outline"
                        className="border-gray-700"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        variant="outline"
                        className="border-gray-700"
                      >
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        redirectToWorkOS();
                      }}
                      className="button-gradient mt-4"
                    >
                      Get Started
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
