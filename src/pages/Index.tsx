import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SignInButton } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
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
          fetch(`/api/success?userId=${encodeURIComponent(convexUserId)}`, { method: 'POST' })
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
      
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative container mx-auto px-4 py-24 min-h-[calc(100svh-80px)] flex items-center justify-center"
      >
        {/* Centered background glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 35%, rgba(55, 122, 251, 0.25) 0%, rgba(55, 122, 251, 0) 70%)'
          }}
        />
        
        <div className="flex flex-col items-center text-center relative z-10">
          {/* Badge Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
            className="inline-block mb-4 px-4 py-1.5 rounded-full glass"
          >
            <span className="text-sm font-medium">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ delay: 0.8, duration: 2, ease: "easeInOut" }}
                className="inline-block"
              >
                <Sparkles className="w-4 h-4 inline-block mr-2" />
              </motion.div>
              ZapDev - The ultimate zap dev platform
            </span>
          </motion.div>
          
          <div className="max-w-4xl mx-auto relative z-10">
            {/* Heading and Description */}
            <motion.h1 
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 80 }}
              className="text-5xl md:text-7xl font-normal mb-4 tracking-tight"
            >
              <motion.span 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-white font-medium block"
              >
                Build with AI.
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-gradient font-medium block"
              >
                Ship faster.
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.7, type: "spring", stiffness: 90 }}
              className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
            >
              The fastest zap dev platform for building full-stack web applications with AI.{" "}
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="text-white"
              >
                Zap development from idea to deployment in minutes, not hours.
              </motion.span>
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.6, type: "spring", stiffness: 100 }}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center"
            >
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isAuthenticated ? (
                  <Button 
                    size="lg" 
                    className="button-gradient"
                    onClick={() => navigate('/chat')}
                  >
                    Open Chat
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="button-gradient"
                    onClick={() => navigate('/pricing')}
                  >
                    Get Started
                  </Button>
                )}
              </motion.div>
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.9, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button size="lg" variant="link" className="text-white">
                  View Examples <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 2.1, duration: 0.8, type: "spring", stiffness: 70 }}
            className="relative mx-auto max-w-5xl mt-20"
          >
            <motion.div 
              initial={{ rotateX: 15, rotateY: -10 }}
              animate={{ rotateX: 0, rotateY: 0 }}
              transition={{ delay: 2.5, duration: 1.2, ease: "easeOut" }}
              className="overflow-hidden w-full max-w-full"
            >
              <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2.8, duration: 0.8 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                alt="ZapDev - Zap Dev AI Platform Dashboard for Fast Development"
                className="w-full h-auto"
                src="/lovable-uploads/e5028882-3e9c-4315-b720-bae1fe817df8.png"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>


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
