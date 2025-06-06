"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import Hero from "@/components/hero";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import FinalCTA from "@/components/final-cta"; 

const FeaturesShowcase = dynamic(() => import('@/components/features-showcase'), { loading: () => <div style={{ minHeight: '50vh' }} /> });
const VisualShowcase = dynamic(() => import('@/components/visual-showcase'), { loading: () => <div style={{ minHeight: '50vh' }} /> });
const VibeToReality = dynamic(() => import('@/components/vibe-to-reality'), { loading: () => <div style={{ minHeight: '50vh' }} /> });
const Audience = dynamic(() => import('@/components/audience'), { loading: () => <div style={{ minHeight: '50vh' }} /> });
const Testimonials = dynamic(() => import('@/components/testimonials'), { loading: () => <div style={{ minHeight: '50vh' }} /> });
const Pricing = dynamic(() => import('@/components/pricing'), { loading: () => <div style={{ minHeight: '50vh' }} /> });

export default function Home() {
  const router = useRouter()
  
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
              onClick={() => router.push("/chat")}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] transition-all text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Chat
            </motion.button>
            <motion.button
              onClick={() => {
                window.location.href = "/api/generate-stripe-checkout";
              }}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-all text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Subscribe
            </motion.button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex items-center gap-4">
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
      
      {/* Homepage sections */}
      <Hero />
      <FeaturesShowcase />
      <VisualShowcase />
      <VibeToReality />
      <Audience />
      <Pricing />
      <Testimonials />
      {/* <FinalCTA onGetStarted={() => router.push("/chat")} /> */}
    </div>
  )
}
