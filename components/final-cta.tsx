'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from './ui/button';
import { CrossBrowserButton } from './ui/cross-browser-button';

interface FinalCtaProps {
  onGetStarted?: () => void;
}

export default function FinalCta({ onGetStarted }: FinalCtaProps) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px 0px' });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const sectionElement = sectionRef.current as HTMLElement | null;
      if (sectionElement) {
        const rect = sectionElement.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-[#0D0D10] to-[#0A0A0E] px-4 py-32 md:py-40"
    >
      {/* Interactive gradient background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle 800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(122, 63, 109, 0.15), transparent 40%)`,
        }}
      />

      {/* Fixed position decorative elements */}
      <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-[#4F3A75] opacity-10 blur-[100px]"></div>
      <div className="absolute -bottom-20 -left-40 h-80 w-80 rounded-full bg-[#7A3F6D] opacity-10 blur-[100px]"></div>

      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="mb-6 text-3xl font-bold md:text-6xl md:leading-tight">
            Your Next Masterpiece <span className="text-gradient">Awaits</span>
          </h2>
          <p className="mx-auto mb-10 max-w-3xl text-xl text-[#EAEAEA]/80 md:mb-14 md:text-2xl">
            Join the revolution in web creation. Sign up for ZapDev today and start building
            websites that truly resonate.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12 flex flex-col justify-center gap-4 sm:flex-row md:gap-6"
          >
            <CrossBrowserButton
              className="cross-browser-button gradient-button-primary rounded-full px-10 py-7 text-lg text-white"
              onClick={onGetStarted}
              motionProps={{
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 }
              }}
            >
              Get Started with ZapDev Free
            </CrossBrowserButton>
            <CrossBrowserButton
              className="cross-browser-button rounded-full border border-[#4F3A75] bg-transparent px-10 py-7 text-lg text-white hover:border-[#7A3F6D] hover:bg-[#0D0D10]/50"
              onClick={() => window.open('/pricing', '_self')}
              motionProps={{
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 }
              }}
            >
              View Pricing
            </CrossBrowserButton>
          </motion.div>

          {/* Secondary links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isInView ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex justify-center gap-6 text-sm md:gap-10 md:text-base"
          >
            <a href="/auth" className="text-[#EAEAEA]/70 transition-colors hover:text-[#EAEAEA]">
              Sign Up Free
            </a>
            <span className="text-[#EAEAEA]/30">|</span>
            <a href="/pricing" className="text-[#EAEAEA]/70 transition-colors hover:text-[#EAEAEA]">
              View Features
            </a>
            <span className="text-[#EAEAEA]/30">|</span>
            <a
              href="mailto:support@zapdev.ai"
              className="text-[#EAEAEA]/70 transition-colors hover:text-[#EAEAEA]"
            >
              Contact Support
            </a>
          </motion.div>
        </motion.div>

        {/* Bottom glow */}
        <div className="absolute -bottom-40 left-1/2 h-20 w-[600px] -translate-x-1/2 bg-[#4F3A75] opacity-20 blur-[100px]"></div>
      </div>
    </section>
  );
}
