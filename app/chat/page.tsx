"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export default function ChatPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Generate a new unique chat ID and redirect
    const chatId = generateRandomString(25);
    router.push(`/chat/${chatId}`)
  }, [router])
  
  return (
    <div className="min-h-screen flex flex-col w-full items-center justify-center bg-[#0D0D10] text-white">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 mb-4 relative"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] opacity-20 blur-md animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.div>
        <motion.span 
          className="text-xl font-medium text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Creating your chat session...
        </motion.span>
      </div>
    </div>
  )
} 