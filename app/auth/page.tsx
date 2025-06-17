"use client"

import { Suspense } from "react"
import { motion } from "framer-motion"
import AuthFormContainer from "@/components/auth-form-container"

// It's good practice to have a specific loading component for Suspense boundaries
function LoadingFallback() {
  return (
    <div className="w-full max-w-md p-8 text-center">
      <p className="text-lg text-[#EAEAEA]/70">Loading authentication...</p>
      {/* You could add a spinner or a more detailed skeleton here */}
    </div>
  )
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10">
        {/* Background gradient effects */}
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-[#4F3A75] opacity-5 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/3 right-1/3 w-1/3 h-1/3 bg-[#7A3F6D] opacity-5 blur-[120px] rounded-full" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">ZapDev</span> Studio
            </h1>
            <p className="text-[#EAEAEA]/70 text-sm">
              Design with feeling. Build with speed.
            </p>
          </motion.div>
        </div>
        
        <Suspense fallback={<LoadingFallback />}>
          <AuthFormContainer />
        </Suspense>
      </motion.div>
    </div>
  )
}