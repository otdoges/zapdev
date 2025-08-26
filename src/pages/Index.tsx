import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import { FeaturesSection } from "@/components/features/FeaturesSection";
import { DynamicPricingSection } from "@/components/pricing/DynamicPricingSection";
import Footer from "@/components/Footer";
const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Handle Stripe success redirect - using secure session-based user identification
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname === '/success') {
      try {
        const convexUserId = user?._id; // Only use session-based user ID for security
        if (convexUserId) {
          fetch('/api/success', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: convexUserId })
          })
            .catch((error) => {
              console.error('Failed to handle success redirect:', error);
              // Optionally show user notification about partial failure
              // but don't prevent the success page from showing
            });
        }
      } catch (error) {
        console.error('Success redirect processing failed:', error);
        // Log error for debugging but don't disrupt user flow
        // Could optionally report to error tracking service
      }
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, [user?._id]);

  return (
    <div className="relative min-h-screen bg-black text-foreground">
      <Navigation />

      {/* Global background layer */}
      <div className="absolute inset-0 -z-10 bg-[#0A0A0A]" />
      
      {/* Enhanced Hero Section with open-lovable inspired design */}
      <HeroSection />


      {/* Features Section */}
      <div id="features">
        <FeaturesSection />
      </div>

      {/* Pricing Section */}
      <div id="pricing">
        <DynamicPricingSection />
      </div>


      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full border-t border-white py-20 px-4 md:px-8 lg:px-32"
        style={{
          background: '#3E6FF3'
        }}
      >
        <div className="flex flex-col items-center justify-center w-full">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center max-w-4xl mx-auto"
          >
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-4 text-white"
          >
            Ready to launch your website?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-lg text-white/80 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of developers who have already discovered the power of zap dev AI-driven development.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAuthenticated ? (
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-white/90"
                onClick={() => navigate('/chat')}
              >
                Open Chat
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <SignInButton mode="redirect" forceRedirectUrl="/chat">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-white/90"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </SignInButton>
            )}
          </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className=""
      >
        <Footer />
      </motion.div>
    </div>
  );
};

export default Index;
