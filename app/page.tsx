'use client';

import { useRouter } from 'next/navigation';
import { motion, useScroll } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Hero from '@/components/hero';
import FinalCTA from '@/components/final-cta';
import Pricing from '@/components/pricing';
import { AuthButtons } from '@/components/auth-buttons';
import { CrossBrowserButton } from '@/components/ui/cross-browser-button';

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

  // Don't render complex interactions until mounted
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D10] text-white">
        <div className="animate-pulse text-white/50">Loading ZapDev...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0D0D10] text-[#EAEAEA]">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: -20 } }}
        transition={{ duration: 0.5 }}
        className="fixed right-4 top-4 z-50 flex gap-4"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4"
        >
          <AuthButtons />
        </motion.div>
      </motion.header>

      {/* Floating CTA */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: showFloatingCTA ? 0 : 100, opacity: showFloatingCTA ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
      >
        <FloatingCTA />
      </motion.div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Hero />
        <FeaturesShowcase />
        <VisualShowcase />
        <VibeToReality />
        <Audience />
        <Pricing />
        <Testimonials />
      </main>
      <FinalCTA />
    </div>
  );
}

// Simplified floating CTA
const FloatingCTA = () => {
  const router = useRouter();
  const { user } = useSupabase();
  const buttonText = user ? 'Go to Chat' : 'Sign In';
  const targetRoute = user ? '/chat' : '/auth';

  return (
    <CrossBrowserButton
      onClick={() => router.push(targetRoute)}
      className="cross-browser-button gradient-button-primary flex items-center gap-2 rounded-full px-6 py-3 font-medium text-white shadow-lg shadow-purple-900/20"
      motionProps={{
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      }}
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
    </CrossBrowserButton>
  );
};
