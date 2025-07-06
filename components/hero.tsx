'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { CrossBrowserButton } from './ui/cross-browser-button';
import { useRouter } from 'next/navigation';
import useIsMobile from '@/hooks/useIsMobile';

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const particlesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!mounted || isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      if (particlesRef.current) {
        const particles = particlesRef.current.children;
        for (let i = 0; i < particles.length; i++) {
          const particle = particles[i] as HTMLElement;
          const rect = particle.getBoundingClientRect();
          const particleX = rect.left + rect.width / 2;
          const particleY = rect.top + rect.height / 2;

          const distX = e.clientX - particleX;
          const distY = e.clientY - particleY;
          const distance = Math.sqrt(distX * distX + distY * distY);
          const maxDistance = 300;

          if (distance < maxDistance) {
            const intensity = 1 - distance / maxDistance;
            const moveX = distX * intensity * 0.03;
            const moveY = distY * intensity * 0.03;

            particle.style.transform = `translate(${moveX}px, ${moveY}px)`;
          } else {
            particle.style.transform = 'translate(0, 0)';
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mounted, isMobile]);

  const goToPricingPage = () => {
    router.push('/pricing');
  };

  // Don't render complex animations until mounted
  if (!mounted) {
    return (
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0D0D10] px-4 py-20 md:py-32">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="mb-6 text-4xl font-bold text-white md:text-6xl lg:text-7xl">
            <span className="text-gradient">ZapDev:</span> Design with Feeling.
            <br /> Build with <span className="shimmer-effect">Speed.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-lg text-[#EAEAEA]/80 md:text-xl">
            Describe your desired vibe, and let ZapDev's AI instantly craft stunning, responsive
            websites in Svelte, Astro, and more. No-code simplicity, pro-dev power.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-20 md:py-32">
      {/* Background particles */}
      <div ref={particlesRef} className="absolute inset-0 z-0">
        {Array.from({ length: isMobile ? 15 : 50 }).map((_, i) => (
          <div
            key={i}
            className="bg-deep-violet absolute h-1 w-1 rounded-full opacity-20 md:h-2 md:w-2"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transition: 'transform 0.3s ease-out',
            }}
          />
        ))}
      </div>

      {/* Mouse glow effect */}
      {!isMobile && (
        <div
          className="mouse-glow"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
          }}
        />
      )}

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto max-w-5xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.h1
          className="mb-6 text-4xl font-bold text-white md:text-6xl lg:text-7xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <span className="text-gradient">ZapDev:</span> Design with Feeling.
          <br /> Build with <span className="shimmer-effect">Speed.</span>
        </motion.h1>

        <motion.p
          className="mx-auto mb-10 max-w-3xl text-lg text-[#EAEAEA]/80 md:text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Describe your desired vibe, and let ZapDev's AI instantly craft stunning, responsive
          websites in Svelte, Astro, and more. No-code simplicity, pro-dev power.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col justify-center gap-4 sm:flex-row"
        >
          <CrossBrowserButton
            className="cross-browser-button gradient-button-primary rounded-full px-8 py-6 text-lg font-medium text-white"
            onClick={() => router.push('/auth')}
            motionProps={{
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 }
            }}
          >
            Start Weaving Your Web
          </CrossBrowserButton>
          <CrossBrowserButton
            className="cross-browser-button rounded-full border border-[#4F3A75] bg-transparent px-8 py-6 text-lg text-white hover:border-[#7A3F6D] hover:bg-[#0D0D10]/50"
            onClick={() => router.push('/#examples')}
            motionProps={{
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 }
            }}
          >
            Explore Examples
          </CrossBrowserButton>
        </motion.div>

        {/* Subscribe Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-8 flex flex-col items-center"
        >
          <CrossBrowserButton
            className="cross-browser-button gradient-button-secondary group relative flex items-center gap-2 overflow-hidden rounded-full px-10 py-6 text-lg font-medium text-white shadow-lg shadow-[#6C52A0]/20"
            onClick={() => router.push('/auth')}
            motionProps={{
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 }
            }}
          >
            <span className="relative z-10">Sign Up Free</span>
            <svg
              className="relative z-10 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            <span className="absolute inset-0 bg-gradient-to-r from-[#B0627C] to-[#7C62B0] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
            <span className="absolute -right-12 -top-12 h-24 w-24 scale-0 transform rounded-full bg-white/10 blur-xl transition-transform duration-500 group-hover:scale-100"></span>
          </CrossBrowserButton>
          <div className="mt-2 text-sm text-[#EAEAEA]/50">
            Start building amazing websites today
          </div>
        </motion.div>
      </motion.div>

      {/* Interface Preview */}
      <motion.div
        className="relative z-10 mx-auto mt-16 w-full max-w-4xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <div className="relative w-full overflow-hidden rounded-xl border border-[#1E1E24] bg-[#121215] shadow-2xl">
          <div className="flex items-center gap-2 bg-[#161619] px-4 py-3">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/70"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500/70"></div>
              <div className="h-3 w-3 rounded-full bg-green-500/70"></div>
            </div>
            <div className="text-xs text-[#EAEAEA]/50">ZapDev Interface</div>
          </div>
          <div className="px-6 py-8">
            <div className="mb-6 flex items-center">
              <div className="h-8 flex-1 rounded-xl bg-[#1A1A1E]"></div>
              <div className="ml-4 h-8 w-20 rounded-xl bg-[#4F3A75]/20"></div>
            </div>
            <div className="flex gap-4">
              <div className="w-1/3 space-y-4">
                <div className="h-40 rounded-lg bg-[#1A1A1E]"></div>
                <div className="h-6 w-3/4 rounded-md bg-[#1A1A1E]"></div>
                <div className="h-20 rounded-lg bg-[#1A1A1E]"></div>
              </div>
              <div className="flex h-80 w-2/3 items-center justify-center overflow-hidden rounded-lg bg-[#1A1A1E]">
                <div className="rounded-full border border-[#1E1E24] bg-[#161619] px-5 py-2 text-sm text-[#EAEAEA]/40">
                  Ask zap a question...
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
