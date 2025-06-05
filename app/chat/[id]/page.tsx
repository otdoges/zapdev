"use client"

import { AnimatedAIChat } from "@/components/animated-ai-chat"
import { motion } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import { useUser, UserButton, SignedIn } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Share2 } from "lucide-react"

export default function ChatSessionPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.id as string
  const { user, isLoaded } = useUser()
  const [isValidSession, setIsValidSession] = useState(true)
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  
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
  
  const handleShareChat = () => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${chatId}`);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  }
  
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

      {/* Share button */}
      <motion.div
        className="absolute top-6 right-20 z-50"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="relative">
          <button
            onClick={handleShareChat}
            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
          >
            <Share2 className="w-3 h-3" />
            <span>Share Chat</span>
          </button>
          
          {showShareTooltip && (
            <motion.div
              className="absolute right-0 top-full mt-2 bg-green-500 text-white px-3 py-1 rounded-md text-xs"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              Link copied!
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Chat interface */}
      <AnimatedAIChat chatId={chatId} />
    </div>
  )
} 