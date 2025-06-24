"use client"

import { useRouter } from "next/navigation"
import { motion, useScroll } from "framer-motion";
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";
import Hero from "@/components/hero";
import FinalCTA from "@/components/final-cta"; 
import Pricing from "@/components/pricing";
import { useIsAuthenticated } from "@/lib/actions";
import { useSupabase } from "@/components/SupabaseProvider";

const FeaturesShowcase = dynamic(() => import('@/components/features-showcase'), { 
  loading: () => <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-pulse text-white/50">Loading features...</div>
  </div> 
});

const VisualShowcase = dynamic(() => import('@/components/visual-showcase'), { 
  loading: () => <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-pulse text-white/50">Loading showcase...</div>
  </div> 
});

const VibeToReality = dynamic(() => import('@/components/vibe-to-reality'), { 
  loading: () => <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-pulse text-white/50">Loading content...</div>
  </div> 
});

const Audience = dynamic(() => import('@/components/audience'), { 
  loading: () => <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-pulse text-white/50">Loading audience...</div>
  </div> 
});

const Testimonials = dynamic(() => import('@/components/testimonials'), { 
  loading: () => <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-pulse text-white/50">Loading testimonials...</div>
  </div> 
});

export default function Home() {
  const router = useRouter();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const { isAuthenticated, isLoading } = useIsAuthenticated();
  const { signOut } = useSupabase();
  
  // Check if Supabase is configured
  const isSupabaseConfigured = typeof window !== 'undefined' && 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key';
  
  // Ensure component is mounted before complex interactions
  useEffect(() => {
    setMounted(true);
  }, []);

  const goToPricingPage = () => {
    router.push('/pricing');
  };

  const goToAuth = () => {
    router.push('/auth');
  };

  const goToChat = () => {
    router.push('/chat');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still redirect even if sign out fails
      router.push('/');
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
    const unsubscribe = scrollY.on("change", (y) => {
      // Show floating CTA after scrolling down 500px
      if (y > 500 && !showFloatingCTA) {
        setShowFloatingCTA(true);
      } else if (y <= 500 && showFloatingCTA) {
        setShowFloatingCTA(false);
      }
    });

    return () => unsubscribe();
  }, [scrollY, showFloatingCTA, mounted]);

  // Simplified auth buttons that always render
  const AuthButtons = () => {
    // If Supabase is not configured, show different buttons
    if (!isSupabaseConfigured) {
      return (
        <div className="flex items-center gap-4">
          <motion.button
            onClick={goToChat}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] transition-all text-sm font-medium text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Demo
          </motion.button>
          <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs">
            Demo Mode
          </div>
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <div className="flex items-center gap-4">
          <motion.button
            onClick={goToPricingPage}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#A0527C] to-[#6C52A0] hover:from-[#B0627C] hover:to-[#7C62B0] transition-all text-sm font-medium text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Subscribe
          </motion.button>
          <motion.button
            onClick={goToChat}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] transition-all text-sm font-medium text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go to Chat
          </motion.button>
          <motion.button
            onClick={handleSignOut}
            className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white text-sm font-medium">U</span>
          </motion.button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <motion.button
          onClick={goToPricingPage}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#A0527C] to-[#6C52A0] hover:from-[#B0627C] hover:to-[#7C62B0] transition-all text-sm font-medium text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Subscribe
        </motion.button>
        <motion.button
          onClick={goToAuth}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-all text-sm font-medium text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign In
        </motion.button>
        <motion.button
          onClick={goToAuth}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] transition-all text-sm font-medium text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign Up
        </motion.button>
      </div>
    );
  };

  // Simplified floating CTA
  const FloatingCTA = () => {
    const buttonText = !isSupabaseConfigured ? 'Try Demo' : (isAuthenticated ? 'Try ZapDev Now' : 'Start Building with AI');
    const targetRoute = !isSupabaseConfigured ? '/chat' : (isAuthenticated ? '/chat' : '/auth');

    return (
      <motion.button
        onClick={() => router.push(targetRoute)}
        className="px-6 py-3 rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] shadow-lg shadow-purple-900/20 flex items-center gap-2 text-white font-medium"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>{buttonText}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.33337 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.66663 4L12.6666 8L8.66663 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.button>
    );
  };

  // Don't render complex interactions until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0D0D10] text-white flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading ZapDev...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0D0D10] text-white">
      {/* Development Notice */}
      {!isSupabaseConfigured && (
        <motion.div
          className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-2 text-amber-200 text-sm backdrop-blur-sm">
            🚀 Demo Mode - Try ZapDev without authentication!
          </div>
        </motion.div>
      )}

      {/* Auth buttons */}
      <motion.div 
        className="fixed top-4 right-4 flex gap-4 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AuthButtons />
      </motion.div>
      
      {/* Main CTA button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <FloatingCTA />
      </motion.div>

      {/* Floating CTA for subscribing */}
      {showFloatingCTA && (
        <motion.div
          className="fixed bottom-8 left-8 z-50"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={goToPricingPage}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A0527C] to-[#6C52A0] hover:from-[#B0627C] hover:to-[#7C62B0] shadow-lg shadow-purple-900/20 flex items-center gap-2 text-white font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Subscribe</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </motion.button>
        </motion.div>
      )}

      {/* Main content */}
      <main>
        <Hero />
        <FeaturesShowcase />
        <VisualShowcase />
        <VibeToReality />
        <Audience />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
    </div>
  );
}
