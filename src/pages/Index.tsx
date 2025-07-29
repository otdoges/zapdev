import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import Navigation from "@/components/Navigation";
import { FeaturesSection } from "@/components/features/FeaturesSection";
import { DynamicPricingSection } from "@/components/pricing/DynamicPricingSection";
import LogoCarousel from "@/components/LogoCarousel";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
const Index = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative container px-4 pt-40 pb-20"
      >
        {/* Background */}
        <div className="absolute inset-0 -z-10 bg-[#0A0A0A]" />
        
        {/* Gradient blur element */}
        <div 
          className="absolute left-0 top-0 w-full h-full rounded-full"
          style={{
            background: '#377AFB',
            opacity: 0.1,
            boxShadow: '300px 300px 300px',
            filter: 'blur(150px)',
            zIndex: 1
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
              AI-powered website builder for developers
            </span>
          </motion.div>
          
          <div className="max-w-4xl relative z-10">
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
              Generate full-stack web applications with AI.{" "}
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="text-white"
              >
                From idea to deployment in minutes, not hours.
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
                {isSignedIn ? (
                  <Button 
                    size="lg" 
                    className="button-gradient"
                    onClick={() => navigate('/pricing')}
                  >
                    View Pricing
                  </Button>
                ) : (
                  <SignInButton mode="modal" forceRedirectUrl="/pricing">
                    <Button size="lg" className="button-gradient">
                      Get Started
                    </Button>
                  </SignInButton>
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
                alt="WebBuilder Dashboard"
                className="w-full h-auto"
                src="/lovable-uploads/e5028882-3e9c-4315-b720-bae1fe817df8.png"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Logo Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <LogoCarousel />
      </motion.div>

      {/* Features Section */}
      <div id="features" className="bg-black">
        <FeaturesSection />
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-black">
        <DynamicPricingSection />
      </div>

      {/* Testimonials Section */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-black"
      >
        <TestimonialsSection />
      </motion.div>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full border-t border-white"
        style={{
          paddingLeft: '120px',
          paddingRight: '120px',
          paddingTop: '80px',
          paddingBottom: '80px',
          background: '#3E6FF3',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: '40px',
          display: 'inline-flex'
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
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
            Join thousands of founders who have already discovered the power of AI-driven web design.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSignedIn ? (
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-white/90"
                onClick={() => navigate('/pricing')}
              >
                View Pricing
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/pricing">
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
      </motion.section>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-black"
      >
        <Footer />
      </motion.div>
    </div>
  );
};

export default Index;
