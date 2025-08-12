import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Star, ArrowRight, ChevronDown, ChevronUp, Zap, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DynamicPricingSection } from "@/components/pricing/DynamicPricingSection";
import { PricingTestimonials } from "@/components/pricing/PricingTestimonials";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

import { useAuth } from "@/hooks/useAuth";
import React, { useEffect } from "react"; // Added missing import for React
import * as Sentry from "@sentry/react";

const HeroSection = () => {
  const { isAuthenticated, isSignedIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Better authentication check for UI display
  const isUserSignedIn = isSignedIn && !authLoading;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Navigation />
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[#0A0A0A]" />
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
      
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative pt-32 pb-20 px-4 z-10"
      >
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Badge variant="outline" className="mb-4 border-blue-500/50 text-blue-300">
              <Star className="w-3 h-3 mr-1" />
              Choose Your Perfect Plan
            </Badge>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-white"
          >
            Simple,{" "}
            <span className="text-gradient">
              Transparent
            </span>{" "}
            Pricing
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Start building with AI-powered tools today. Choose the plan that fits your needs and scale as you grow. No hidden fees, no surprises.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {!isUserSignedIn && (
              <Button 
                size="lg" 
                className="button-gradient px-8 py-3"
                onClick={() => navigate('/chat')}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            <Button 
              size="lg" 
              variant="outline" 
              className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10 px-8 py-3"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Pricing
            </Button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

const FeatureComparisonTable = () => {
  const features = [
    {
      category: "AI Generation",
      items: [
        { name: "AI-generated websites", starter: "5", professional: "Unlimited", enterprise: "Unlimited" },
        { name: "Premium templates", starter: false, professional: true, enterprise: true },
        { name: "Advanced AI prompts", starter: false, professional: true, enterprise: true },
        { name: "Custom AI training", starter: false, professional: false, enterprise: true },
      ]
    },
    {
      category: "Hosting & Domains",
      items: [
        { name: "Standard hosting", starter: true, professional: true, enterprise: true },
        { name: "Custom domain support", starter: false, professional: true, enterprise: true },
        { name: "CDN acceleration", starter: false, professional: true, enterprise: true },
        { name: "Advanced security", starter: false, professional: false, enterprise: true },
      ]
    },
    {
      category: "Support & Analytics",
      items: [
        { name: "Email support", starter: true, professional: true, enterprise: true },
        { name: "Priority support", starter: false, professional: true, enterprise: true },
        { name: "Analytics dashboard", starter: false, professional: true, enterprise: true },
        { name: "Dedicated support team", starter: false, professional: false, enterprise: true },
      ]
    },
    {
      category: "Advanced Features",
      items: [
        { name: "White-label solution", starter: false, professional: false, enterprise: true },
        { name: "Custom integrations", starter: false, professional: false, enterprise: true },
        { name: "SLA guarantee", starter: false, professional: false, enterprise: true },
        { name: "API access", starter: false, professional: true, enterprise: true },
      ]
    }
  ];

  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <span className="text-gray-400 text-sm">—</span>
      );
    }
    return <span className="text-sm font-medium">{value}</span>;
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-black"
    >
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Compare Plans & Features
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            See exactly what's included in each plan to make the best choice for your needs
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-[#0A0A0A] rounded-lg overflow-hidden border border-gray-800">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-6 text-gray-400 font-medium">Features</th>
                <th className="text-center p-6 text-white font-medium">Starter</th>
                <th className="text-center p-6 text-white font-medium relative">
                  Professional
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#3E6FF3] text-white text-xs">
                    Popular
                  </Badge>
                </th>
                <th className="text-center p-6 text-white font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {features.map((category, categoryIndex) => (
                <React.Fragment key={category.category}>
                  <tr className="bg-gray-800/20">
                    <td colSpan={4} className="p-4 font-semibold text-blue-300 text-sm uppercase tracking-wider">
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item, itemIndex) => (
                    <tr key={`${categoryIndex}-${itemIndex}`} className="border-b border-gray-800 hover:bg-blue-500/5 transition-colors">
                      <td className="p-4 text-gray-300">{item.name}</td>
                      <td className="p-4 text-center">{renderFeatureValue(item.starter)}</td>
                      <td className="p-4 text-center bg-blue-500/5">{renderFeatureValue(item.professional)}</td>
                      <td className="p-4 text-center">{renderFeatureValue(item.enterprise)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
};

const FAQSection = () => {
  const [openItem, setOpenItem] = useState<number | null>(null);

  const faqs = [
    {
      question: "Can I change my plan at any time?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments."
    },
    {
      question: "What happens to my websites if I downgrade?",
      answer: "Your existing websites will remain active, but you may lose access to premium features. If you exceed your plan limits, you'll need to upgrade or archive some projects."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes! Our Starter plan is completely free forever with 5 AI-generated websites. You can also try Professional features with a 14-day free trial."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay via bank transfer."
    },
    {
      question: "Can I use my own domain?",
      answer: "Custom domains are available on Professional and Enterprise plans. You can connect unlimited domains and we'll provide SSL certificates automatically."
    },
    {
      question: "What kind of support do you provide?",
      answer: "All plans include email support. Professional plans get priority support with faster response times. Enterprise customers get dedicated account management and phone support."
    },
    {
      question: "Are there any setup fees or hidden costs?",
      answer: "No hidden fees! The price you see is exactly what you pay. No setup fees, no transaction fees, no surprises."
    }
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-black"
    >
      <div className="container px-4 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-lg">
            Got questions? We've got answers. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Collapsible
                open={openItem === index}
                onOpenChange={() => setOpenItem(openItem === index ? null : index)}
              >
                <CollapsibleTrigger asChild>
                  <Card className="bg-[#0A0A0A] border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                      <h3 className="text-lg font-medium text-white">{faq.question}</h3>
                      {openItem === index ? (
                        <ChevronUp className="w-5 h-5 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </CardHeader>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-4">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

const CTASection = () => {
  const { isAuthenticated, isSignedIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Better authentication check for UI display
  const isUserSignedIn = isSignedIn && !authLoading;

  return (
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
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-white/90"
            onClick={() => navigate('/chat')}
          >
            {isUserSignedIn ? 'Open Chat' : 'Get Started'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

const Pricing = () => {
  // Trigger KV sync after successful checkout redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'success') {
      const id = localStorage.getItem('convexUserId');
      if (id) {
        fetch(`/api/success?userId=${encodeURIComponent(id)}`, { method: 'POST' })
          .catch((error) => {
            console.error('Failed to sync billing success:', error);
            Sentry.captureException(error, {
              tags: { feature: 'pricing', action: 'billing_success_sync' },
              extra: { userId: id }
            });
          });
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection />
      
      {/* Main Pricing Section */}
      <div id="pricing" className="bg-black">
        <DynamicPricingSection />
      </div>
      
      <FeatureComparisonTable />
      <PricingTestimonials />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Sentry.withErrorBoundary(Pricing, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-400 mb-4">We're sorry, but there was an error loading the pricing page.</p>
        <Button onClick={resetError} className="button-gradient">
          Try Again
        </Button>
      </div>
    </div>
  ),
}); 