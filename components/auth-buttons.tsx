'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import { CrossBrowserButton } from '@/components/ui/cross-browser-button';

export function AuthButtons() {
  const router = useRouter();
  const { user, loading } = useSupabase();

  const goToPricingPage = () => {
    router.push('/pricing');
  };

  const goToAuth = () => {
    router.push('/auth');
  };

  const goToChat = () => {
    router.push('/chat');
  };

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
        <CrossBrowserButton
          onClick={goToChat}
          className="cross-browser-button gradient-button-primary rounded-lg px-4 py-2 text-sm font-medium"
          motionProps={{
            initial: { opacity: 0, y: -10 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3, delay: 0.1 },
            whileHover: { scale: 1.05, y: -2 },
            whileTap: { scale: 0.95 },
          }}
        >
          Chat
        </CrossBrowserButton>
        <CrossBrowserButton
          onClick={goToPricingPage}
          className="cross-browser-button gradient-button-secondary rounded-lg px-4 py-2 text-sm font-medium"
          motionProps={{
            initial: { opacity: 0, y: -10 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3, delay: 0.2 },
            whileHover: { scale: 1.05, y: -2 },
            whileTap: { scale: 0.95 },
          }}
        >
          Subscribe
        </CrossBrowserButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <CrossBrowserButton
        onClick={goToAuth}
        className="cross-browser-button gradient-button-primary rounded-lg px-4 py-2 text-sm font-medium"
        motionProps={{
          initial: { opacity: 0, y: -10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, delay: 0.1 },
          whileHover: { scale: 1.05, y: -2 },
          whileTap: { scale: 0.95 },
        }}
      >
        Sign In
      </CrossBrowserButton>
      <CrossBrowserButton
        onClick={goToAuth}
        className="cross-browser-button gradient-button-secondary rounded-lg px-4 py-2 text-sm font-medium"
        motionProps={{
          initial: { opacity: 0, y: -10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, delay: 0.2 },
          whileHover: { scale: 1.05, y: -2 },
          whileTap: { scale: 0.95 },
        }}
      >
        Sign Up
      </CrossBrowserButton>
    </div>
  );
}
