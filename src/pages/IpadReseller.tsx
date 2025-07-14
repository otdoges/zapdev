import { motion } from "framer-motion";
import { ArrowRight, Tablet, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import LogoCarousel from "@/components/LogoCarousel";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";

const IpadReseller = () => {
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
              <Tablet className="w-4 h-4 inline-block mr-2" />
              Premium iPad marketplace in Ukraine
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
                Premium iPads
              </span>
              <br />
              <span className="text-gradient font-medium">
                for Ukraine.
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
              The most trusted iPad reseller in Ukraine.{" "}
              <span className="text-white">Certified refurbished devices with warranty and fast delivery.</span>
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center"
            >
              <Button size="lg" className="button-gradient">
                Shop iPads Now
              </Button>
              <Button size="lg" variant="link" className="text-white">
                Check Warranty <ArrowRight className="ml-2 w-4 h-4" />
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
                alt="iPad Collection"
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
      <section className="container px-4 py-24 relative">
        {/* Gradient blur element */}
        <div 
          className="absolute bottom-0 left-0 w-full h-full rounded-full"
          style={{
            background: '#377AFB',
            opacity: 0.1,
            boxShadow: '300px 300px 300px',
            filter: 'blur(150px)',
            zIndex: 1
          }}
        />
        
        {/* Header Section */}
        <div className="max-w-2xl mb-20 relative z-10">
          <h2 className="text-5xl md:text-6xl font-normal mb-6 tracking-tight text-left">
            Why Choose
            <br />
            <span className="text-gradient font-medium">Our iPads</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 text-left">
            Experience premium quality with certified refurbished iPads, comprehensive warranty, and fast delivery across Ukraine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {/* Feature 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <Shield className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-white">Certified Quality</h3>
            <p className="text-gray-400">
              Every iPad undergoes rigorous testing and certification to ensure premium quality and performance.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <Clock className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-white">Fast Delivery</h3>
            <p className="text-gray-400">
              Quick delivery across Ukraine with secure packaging and tracking for your peace of mind.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <Tablet className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-white">Latest Models</h3>
            <p className="text-gray-400">
              From iPad Air to iPad Pro, we stock the latest models with competitive pricing and warranty coverage.
            </p>
          </motion.div>
        </div>
      </section>

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
            Ready to get your iPad?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their iPad purchases in Ukraine.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90">
            Browse iPads
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

export default IpadReseller;