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
          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.6666 8H3.33329" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.33329 4L3.33329 8L7.33329 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back to Home</span>
        </motion.button>
      </motion.div>

      {/* Session ID indicator */}
      <motion.div
        className="absolute top-6 right-20 z-50"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="px-3 py-1 rounded-lg bg-white/5 text-xs flex items-center gap-1">
          <span>Chat ID: {chatId}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/chat/${chatId}`);
              alert("Chat link copied to clipboard!");
            }}
            className="ml-2 text-white/60 hover:text-white/100 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V8M10 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8H10C8.89543 8 8 8.89543 8 10V18C8 19.1046 8.89543 20 10 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Chat interface */}
      <AnimatedAIChat chatId={chatId} />
    </div>
  )
} 