"use client"

import { AnimatedAIChat } from "@/components/animated-ai-chat"
import { motion } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import { useUser, UserButton, SignedIn } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export default function ChatSessionPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.id as string
  const { user, isLoaded } = useUser()
  const [isValidSession, setIsValidSession] = useState(true)
  
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
    <div className="min-h-screen flex flex-col w-full items-center justify-center bg-[#0D0D10] text-white relative overflow-hidden">
      {/* Auth button */}
      <motion.div 
        className="absolute top-4 right-4 flex gap-4 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </motion.div>
      
      {/* ZapDev branding */}
      <motion.div
        className="absolute top-6 left-6 flex items-center gap-2 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-xl font-bold">
          <span className="text-gradient">ZapDev</span> Studio
        </span>
      </motion.div>

      {/* Back button */}
      <motion.div
        className="absolute top-6 left-40 flex items-center gap-2 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={() => router.push("/")}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Back to Home"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </motion.div>

      {/* Chat interface */}
      <AnimatedAIChat chatId={chatId} />
    </div>
  )
} 