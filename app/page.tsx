'use client';

import { useRouter } from 'next/navigation';
import { motion, useScroll } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Hero from '@/components/hero';
import FinalCTA from '@/components/final-cta';
import Pricing from '@/components/pricing';
import { useSupabase } from '@/components/SupabaseProvider';

const FeaturesShowcase = dynamic(() => import('@/components/features-showcase'), {
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="animate-pulse text-white/50">Loading features...</div>
    </div>
  ),
});

const VisualShowcase = dynamic(() => import('@/components/visual-showcase'), {
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="animate-pulse text-white/50">Loading showcase...</div>
    </div>
  ),
});

const VibeToReality = dynamic(() => import('@/components/vibe-to-reality'), {
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="animate-pulse text-white/50">Loading content...</div>
    </div>
  ),
});

const Audience = dynamic(() => import('@/components/audience'), {
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="animate-pulse text-white/50">Loading audience...</div>
    </div>
  ),
});

const Testimonials = dynamic(() => import('@/components/testimonials'), {
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="animate-pulse text-white/50">Loading testimonials...</div>
    </div>
  ),
});

export default function Home() {
  const router = useRouter();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const { user, loading } = useSupabase();

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

  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = scrollY.on('change', (y) => {
      // Show floating CTA after scrolling down 500px
      if (y > 500 && !showFloatingCTA) {
        setShowFloatingCTA(true);
      } else if (y <= 500 && showFloatingCTA) {
        setShowFloatingCTA(false);
      }
    });

    return () => unsubscribe();
  }, [scrollY, showFloatingCTA, mounted]);

  // Simple auth buttons that don't cause re-renders
  const AuthButtons = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-4">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-white/10 px-4 py-2"></div>
          <div className="h-8 w-16 animate-pulse rounded-lg bg-white/10 px-4 py-2"></div>
        </div>
      );
    }

    if (user) {
      return (
        <div className="flex items-center gap-4">
          <motion.button
            onClick={goToChat}
            className="rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] px-4 py-2 text-sm font-medium text-white transition-all hover:from-[#7C62B0] hover:to-[#B0627C]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Chat
          </motion.button>
          <motion.button
            onClick={goToPricingPage}
            className="rounded-lg bg-gradient-to-r from-[#A0527C] to-[#6C52A0] px-4 py-2 text-sm font-medium text-white transition-all hover:from-[#B0627C] hover:to-[#7C62B0]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Subscribe
          </motion.button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <motion.button
          onClick={goToAuth}
          className="rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] px-4 py-2 text-sm font-medium text-white transition-all hover:from-[#7C62B0] hover:to-[#B0627C]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign In
        </motion.button>
        <motion.button
          onClick={goToAuth}
          className="rounded-lg bg-gradient-to-r from-[#A0527C] to-[#6C52A0] px-4 py-2 text-sm font-medium text-white transition-all hover:from-[#B0627C] hover:to-[#7C62B0]"
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
    const buttonText = user ? 'Go to Chat' : 'Sign In';
    const targetRoute = user ? '/chat' : '/auth';

    return (
      <motion.button
        onClick={() => router.push(targetRoute)}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] px-6 py-3 font-medium text-white shadow-lg shadow-purple-900/20 hover:from-[#7C62B0] hover:to-[#B0627C]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>{buttonText}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.33337 8H12.6667"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.66663 4L12.6666 8L8.66663 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    );
  };

  // Don't render complex interactions until mounted
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D10] text-white">
        <div className="animate-pulse text-white/50">Loading ZapDev...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D10] text-white">
      {/* Auth buttons */}
      <motion.div
        className="fixed right-4 top-4 z-50 flex gap-4"
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
            onClick={user ? goToPricingPage : goToAuth}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#A0527C] to-[#6C52A0] px-6 py-3 font-medium text-white shadow-lg shadow-purple-900/20 hover:from-[#B0627C] hover:to-[#7C62B0]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{user ? 'Subscribe' : 'Sign Up'}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
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
