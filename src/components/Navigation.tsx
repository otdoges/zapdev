
import { useState, useEffect } from "react";
import { Sparkles, Menu, User, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SignInButton, useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { signOut } = useClerk();

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
    { name: "Pricing", href: "/pricing", isLink: true },
    ...(isAuthenticated ? [
      { name: "AI Chat", href: "/chat", isLink: true }
    ] : []),
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-3.5 left-1/2 -translate-x-1/2 z-50 transition-smooth rounded-full ${
        isScrolled 
          ? "h-14 glass-elevated scale-95 w-[90%] max-w-2xl" 
          : "h-14 glass w-[95%] max-w-3xl"
      }`}
    >
      {/* Enhanced glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-full blur opacity-20 animate-pulse-glow" />
      
      <div className="relative mx-auto h-full px-6">
        <nav className="flex items-center justify-between h-full">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-30" />
              <div className="relative glass-elevated w-8 h-8 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-gradient" />
              </div>
            </motion.div>
            <span className="font-bold text-lg text-gradient-static tracking-tight">ZapDev</span>
          </motion.div>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                {item.isLink ? (
                  <Link
                    to={item.href}
                    className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth rounded-lg glass-hover group"
                  >
                    <span className="relative z-10">{item.name}</span>
                    {item.isNew && (
                      <motion.span 
                        className="absolute -top-1 -right-1 text-xs button-gradient text-white px-2 py-0.5 rounded-full"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        New
                      </motion.span>
                    )}
                    {/* Hover indicator */}
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      layoutId="navHover"
                    />
                  </Link>
                ) : (
                  <motion.a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.onClick) {
                        item.onClick();
                      }
                    }}
                    className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth rounded-lg glass-hover group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10">{item.name}</span>
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      layoutId="navHover"
                    />
                  </motion.a>
                )}
              </motion.div>
            ))}
            <motion.div 
              className="flex items-center gap-3 ml-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => navigate('/settings')}
                      size="sm"
                      variant="outline"
                      className="glass-hover border-white/20 hover:border-white/40 transition-smooth"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {user?.fullName?.split(' ')[0] || 'Profile'}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => signOut()}
                      size="sm"
                      variant="outline"
                      className="glass-hover border-white/20 hover:border-red-400/40 hover:text-red-400 transition-smooth"
                    >
                      Sign Out
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <SignInButton mode="redirect" forceRedirectUrl="/chat">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <div className="absolute -inset-0.5 button-gradient rounded-lg blur opacity-50 animate-pulse-glow" />
                    <Button 
                      size="sm"
                      className="relative button-gradient px-6 py-2 font-semibold"
                    >
                      Get Started
                    </Button>
                  </motion.div>
                </SignInButton>
              )}
            </motion.div>
          </div>

          {/* Enhanced Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="icon" className="glass-hover border-white/20">
                    <motion.div
                      animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </SheetTrigger>
              <SheetContent className="glass border-white/20 backdrop-blur-xl">
                <motion.div 
                  className="flex flex-col gap-6 mt-8"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.1 }}
                      className="glass-hover rounded-lg p-3 transition-smooth"
                    >
                      {item.isLink ? (
                        <Link
                          to={item.href}
                          className="text-lg font-medium text-foreground hover:text-gradient-static transition-smooth flex items-center gap-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="w-2 h-2 bg-primary rounded-full" />
                          <span className="flex items-center gap-2">
                            {item.name}
                            {item.isNew && (
                              <span className="text-xs button-gradient text-white px-2 py-0.5 rounded-full">New</span>
                            )}
                          </span>
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className="text-lg font-medium text-foreground hover:text-gradient-static transition-smooth flex items-center gap-3"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                            if (item.onClick) {
                              item.onClick();
                            }
                          }}
                        >
                          <span className="w-2 h-2 bg-primary rounded-full" />
                          {item.name}
                        </a>
                      )}
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 pt-6 border-t border-white/10"
                  >
                    {isAuthenticated ? (
                      <div className="flex flex-col gap-3">
                        <Button 
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            navigate('/settings');
                          }}
                          variant="outline"
                          className="glass-hover border-white/20 justify-start text-left"
                        >
                          <User className="w-4 h-4 mr-3" />
                          {user?.fullName?.split(' ')[0] || 'Profile'}
                        </Button>
                        <Button 
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            signOut();
                          }}
                          variant="outline"
                          className="glass-hover border-white/20 hover:border-red-400/40 hover:text-red-400 justify-start text-left transition-smooth"
                        >
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <SignInButton mode="redirect" forceRedirectUrl="/chat">
                        <Button 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="button-gradient w-full py-3 font-semibold text-base"
                        >
                          Get Started
                        </Button>
                      </SignInButton>
                    )}
                  </motion.div>
                </motion.div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

export default Navigation;
