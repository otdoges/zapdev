import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { FeaturesSection } from "@/components/features/FeaturesSection";
import { PricingSection } from "@/components/pricing/PricingSection";
import LogoCarousel from "@/components/LogoCarousel";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
          <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.2
          }} className="inline-block mb-4 px-4 py-1.5 rounded-full glass">
            <span className="text-sm font-medium">
              <Sparkles className="w-4 h-4 inline-block mr-2" />
              AI-powered website builder for founders
            </span>
          </motion.div>
          
          <div className="max-w-4xl relative z-10">
            {/* Heading and Description */}
            <motion.h1 initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.3
            }} className="text-5xl md:text-7xl font-normal mb-4 tracking-tight">
              <span className="text-white font-medium">
                The website builder
              </span>
              <br />
              <span className="text-gradient font-medium">
                for AI founders.
              </span>
            </motion.h1>
            
            <motion.p initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.4
            }} className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              We give you the templates and prompts; Lovable's AI does the rest.{" "}
              <span className="text-white">Launch your startup's website in minutes, not weeks.</span>
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center"
            >
              <Button size="lg" className="button-gradient">
                Start Building Now
              </Button>
              <Button size="lg" variant="link" className="text-white">
                View Templates <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative mx-auto max-w-5xl mt-20"
          >
            <div className="overflow-hidden w-screen relative left-1/2 -translate-x-1/2">
              <img
                alt="WebFluin Dashboard"
                className="w-full h-auto"
                src="/lovable-uploads/e5028882-3e9c-4315-b720-bae1fe817df8.png"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Logo Carousel */}
      <LogoCarousel />

      {/* Features Section */}
      <div id="features" className="bg-black">
        <FeaturesSection />
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-black">
        <PricingSection />
      </div>

      {/* Testimonials Section */}
      <div className="bg-black">
        <TestimonialsSection />
      </div>

      {/* CTA Section */}
      <section 
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
          initial={{
            opacity: 0,
            y: 20
          }} 
          animate={{
            opacity: 1,
            y: 0
          }} 
          transition={{
            duration: 0.5
          }} 
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to launch your website?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of founders who have already discovered the power of AI-driven web design.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90">
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <div className="bg-black">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
