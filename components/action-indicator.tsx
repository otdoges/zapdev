"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Hammer, Sparkles, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionIndicatorProps {
  action: string
  isActive: boolean
  className?: string
}

const actionIcons: Record<string, React.ReactNode> = {
  building: <Hammer className="w-4 h-4" />,
  analyzing: <Sparkles className="w-4 h-4" />,
  creating: <Zap className="w-4 h-4" />,
  complete: <CheckCircle className="w-4 h-4" />
}

export default function ActionIndicator({ action, isActive, className }: ActionIndicatorProps) {
  if (!isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full",
        "bg-gradient-to-r from-violet-500/20 to-purple-500/20",
        "border border-violet-500/30 text-violet-300",
        "backdrop-blur-sm",
        className
      )}
    >
      <motion.div
        animate={{ rotate: action === 'complete' ? 0 : 360 }}
        transition={{ 
          duration: action === 'complete' ? 0 : 2, 
          repeat: action === 'complete' ? 0 : Infinity,
          ease: "linear" 
        }}
      >
        {actionIcons[action] || actionIcons.building}
      </motion.div>
      <span className="text-sm font-medium capitalize">
        {action === 'complete' ? '✅ Done!' : `${action}...`}
      </span>
    </motion.div>
  )
} 