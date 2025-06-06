"use client"

import { AnimatedAIChat } from "@/components/animated-ai-chat"
import { motion } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import { useUser, UserButton, SignedIn } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

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

    // When a new chat is created, we'll assume it's valid
    // This skips validation for newly created chat sessions
    // The chat system will create the database record when needed
    
  }, [chatId, user, isLoaded, router])
  
  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D10] text-white relative overflow-hidden">
      {/* Header elements */}
      <header className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <motion.button
            onClick={() => router.push("/")}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Back to Home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
          
          {/* ZapDev branding */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-xl font-bold">
              <span className="text-gradient">ZapDev</span> Studio
            </span>
          </motion.div>
        </div>

        {/* Auth button */}
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </motion.div>
      </header>

      {/* Main content with conditional layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 w-full max-w-screen-2xl mx-auto pt-24 pb-8 px-6">
        {/* Left Card / Full Width Card: Chat Interface */}
        <div className={cn(
          "h-full flex flex-col bg-slate-900/50 rounded-lg border border-slate-800",
          isChatStarted ? "md:w-1/2" : "md:w-full"
        )}>
          <AnimatedAIChat chatId={chatId} onFirstMessageSent={() => setIsChatStarted(true)} />
        </div>

        {/* Right Card: Desktop Preview (conditionally rendered) */}
        {isChatStarted && (
          <div className="md:w-1/2 h-full flex flex-col bg-slate-900/50 rounded-lg border border-slate-800 items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Desktop Preview</h2>
              <p className="text-slate-400">The UI preview will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 