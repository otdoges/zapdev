"use client"

import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";
import Hero from "@/components/hero";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import FinalCTA from "@/components/final-cta"; 
import Pricing from "@/components/pricing";

const FeaturesShowcase = dynamic(() => import('@/components/features-showcase'), { loading: () => <div style={{ minHeight: '50vh' }} /> });
const VisualShowcase = dynamic(() => import('@/components/visual-showcase'), { loading: () => <div style={{ minHeight: '50vh' }} /> });
const VibeToReality = dynamic(() => import('@/components/vibe-to-reality'), { loading: () => <div style={{ minHeight: '50vh' }} /> });
const Audience = dynamic(() => import('@/components/audience'), { loading: () => <div style={{ minHeight: '50vh' }} /> });
const Testimonials = dynamic(() => import('@/components/testimonials'), { loading: () => <div style={{ minHeight: '50vh' }} /> });

export default function Home() {
  const router = useRouter();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const { scrollY } = useScroll();
  
  const goToPricingPage = () => {
    router.push('/pricing');
  };

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (y) => {
      // Show floating CTA after scrolling down 500px
      if (y > 500 && !showFloatingCTA) {
        setShowFloatingCTA(true);
      } else if (y <= 500 && showFloatingCTA) {
        setShowFloatingCTA(false);
      }
    });

    return () => unsubscribe();
  }, [scrollY, showFloatingCTA]);
  
  return (
    <div className="min-h-screen bg-[#0D0D10] text-white">
      {/* Auth buttons */}
      <motion.div 
        className="fixed top-4 right-4 flex gap-4 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <SignedIn>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={goToPricingPage}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#A0527C] to-[#6C52A0] hover:from-[#B0627C] hover:to-[#7C62B0] transition-all text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Subscribe
            </motion.button>
            <motion.button
              onClick={() => router.push("/chat")}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] transition-all text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Chat
            </motion.button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={goToPricingPage}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#A0527C] to-[#6C52A0] hover:from-[#B0627C] hover:to-[#7C62B0] transition-all text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Subscribe
            </motion.button>
            <SignInButton mode="redirect">
              <motion.button
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-all text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <motion.button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] transition-all text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Up
              </motion.button>
            </SignUpButton>
          </div>
        </SignedOut>
      </motion.div>
      
      {/* Try it now button that navigates to chat */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        <SignedIn>
          <motion.button
            onClick={() => router.push("/chat")}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] shadow-lg shadow-purple-900/20 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="font-medium">Try ZapDev Now</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.33337 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.66663 4L12.6666 8L8.66663 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="redirect">
            <motion.button
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] shadow-lg shadow-purple-900/20 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="font-medium">Start Weaving the Web</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.33337 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.66663 4L12.6666 8L8.66663 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </SignInButton>
        </SignedOut>
      </motion.div>

      {/* Floating CTA for subscribing */}
      {showFloatingCTA && (
        <motion.div
          className="fixed bottom-8 left-8 z-50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <motion.button
            onClick={goToPricingPage}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A0527C] to-[#6C52A0] hover:from-[#B0627C] hover:to-[#7C62B0] shadow-lg shadow-purple-900/20 flex items-center gap-2 group relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 font-medium flex items-center gap-2">
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Unlock Pro Features
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-[#B0627C] to-[#7C62B0] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full blur-xl transform scale-0 group-hover:scale-100 transition-transform duration-500"></div>
          </motion.button>
        </motion.div>
      )}
      
      {/* Homepage sections */}
      <Hero />
      <FeaturesShowcase />
      <VisualShowcase />
      <VibeToReality />
      <Audience />
      <Testimonials />
      {/* <FinalCTA onGetStarted={() => router.push("/chat")} /> */}
    </div>
  )
}
