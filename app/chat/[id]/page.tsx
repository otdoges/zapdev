"use client"

import { AnimatedAIChat } from "@/components/animated-ai-chat"
import CodePreview from "@/components/code-preview"
import { motion } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import { useUser, UserButton, SignedIn } from "@clerk/nextjs"
import { useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"

// Memoize static components for better performance
const BackButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    onClick={onClick}
    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center will-change-transform"
    whileTap={{ scale: 0.95 }}
    aria-label="Back to Home"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </motion.button>
);

export default function ChatSessionPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.id as string
  const { user, isLoaded } = useUser()
  const [isValidSession, setIsValidSession] = useState(true)
  const [isChatStarted, setIsChatStarted] = useState(false)
  
  useEffect(() => {
    // Ensure user and chatId are available
    if (!isLoaded || !chatId) {
      return;
    }

    if (!user) {
      router.push('/');
      return;
    }
    
  }, [chatId, user, isLoaded, router])

  // Memoize the branding component to prevent unnecessary re-renders
  const brandingComponent = useMemo(() => (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-xl font-bold">
        <span className="text-gradient">ZapDev</span> Studio
      </span>
    </motion.div>
  ), []);
  
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0D0D10] text-white overflow-hidden">
      {/* Header elements */}
      <header className="sticky top-0 left-0 right-0 z-50 p-6 flex items-center justify-between bg-[#0D0D10]">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <BackButton onClick={() => router.push("/")} />
          
          {/* ZapDev branding */}
          {brandingComponent}
        </div>

        {/* Auth button */}
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </motion.div>
      </header>

      {/* Main content with conditional layout - fills the remaining height */}
      <div className="flex-grow flex flex-col md:flex-row gap-6 w-full px-6 pb-8">
        {/* Left Card / Full Width Card: Chat Interface */}
        <div className={cn(
          "flex-grow flex flex-col bg-slate-900/50 rounded-lg border border-slate-800 will-change-transform",
          isChatStarted ? "md:w-1/2" : "md:w-full"
        )}>
          <AnimatedAIChat chatId={chatId} onFirstMessageSent={() => setIsChatStarted(true)} />
        </div>

        {/* Right Card: Code Preview (conditionally rendered) */}
        {isChatStarted && (
          <div className="md:w-1/2 flex-grow flex flex-col bg-slate-900/50 rounded-lg border border-slate-800 will-change-transform">
            {/* This div is now managed by the AnimatedAIChat component which will populate it with the Monaco editor */}
          </div>
        )}
      </div>
    </div>
  )
} 