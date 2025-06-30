'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, AlertCircle, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface TokenUsageProps {
  currentTokens: number
  maxTokens?: number
  costPerToken?: number
  isGenerating?: boolean
  className?: string
}

export function TokenUsage({
  currentTokens,
  maxTokens = 4096,
  costPerToken = 0.000002, // Default cost per token in USD
  isGenerating = false,
  className
}: TokenUsageProps) {
  const [displayTokens, setDisplayTokens] = useState(currentTokens)
  const percentage = (displayTokens / maxTokens) * 100
  const estimatedCost = displayTokens * costPerToken
  const isWarning = percentage > 75
  const isDanger = percentage > 90

  // Animate token count changes
  useEffect(() => {
    const difference = currentTokens - displayTokens
    if (difference === 0) return

    const increment = difference / 20 // Animate over 20 frames
    let frame = 0

    const timer = setInterval(() => {
      frame++
      setDisplayTokens(prev => {
        const next = prev + increment
        if (frame >= 20) {
          clearInterval(timer)
          return currentTokens
        }
        return Math.round(next)
      })
    }, 16) // ~60fps

    return () => clearInterval(timer)
  }, [currentTokens, displayTokens])

  const getColorClass = () => {
    if (isDanger) return 'text-red-500'
    if (isWarning) return 'text-yellow-500'
    return 'text-purple-500'
  }

  const getProgressColorClass = () => {
    if (isDanger) return 'bg-red-500'
    if (isWarning) return 'bg-yellow-500'
    return 'bg-purple-500'
  }

  return (
    <div className={cn('rounded-lg border border-zinc-800 bg-zinc-900/50 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={cn('w-4 h-4', getColorClass())} />
          <span className="text-sm font-medium text-zinc-300">Token Usage</span>
        </div>
        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-purple-500 rounded-full"
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500 ml-1">Generating</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        {/* Token count */}
        <div className="flex items-end justify-between">
          <motion.div
            key={displayTokens}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="space-y-1"
          >
            <div className="flex items-baseline gap-1">
              <span className={cn('text-2xl font-bold', getColorClass())}>
                {displayTokens.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-500">/ {maxTokens.toLocaleString()}</span>
            </div>
            <div className="text-xs text-zinc-600">
              ~${estimatedCost.toFixed(4)} estimated
            </div>
          </motion.div>

          {/* Warning indicators */}
          <AnimatePresence>
            {isWarning && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1"
              >
                <AlertCircle className={cn('w-4 h-4', getColorClass())} />
                <span className={cn('text-xs', getColorClass())}>
                  {isDanger ? 'Near limit!' : 'High usage'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <Progress value={percentage} className="h-2 bg-zinc-800">
            <div
              className={cn(
                'h-full transition-all duration-300',
                getProgressColorClass(),
                isGenerating && 'animate-pulse'
              )}
              style={{ width: `${percentage}%` }}
            />
          </Progress>
          {isGenerating && (
            <motion.div
              className="absolute inset-0 h-2 overflow-hidden rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
            >
              <motion.div
                className={cn('h-full w-1/3', getProgressColorClass())}
                animate={{
                  x: ['0%', '300%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Usage tips */}
        {percentage > 50 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-2 border-t border-zinc-800"
          >
            <div className="flex items-start gap-2">
              <TrendingUp className="w-3 h-3 text-zinc-500 mt-0.5" />
              <div className="text-xs text-zinc-500">
                {isDanger ? (
                  <span>Consider starting a new chat to avoid token limits.</span>
                ) : isWarning ? (
                  <span>Token usage is high. Responses may be truncated soon.</span>
                ) : (
                  <span>Token usage is over 50%. Monitor for optimal performance.</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Mini version for inline display
export function TokenUsageMini({ currentTokens, maxTokens = 4096 }: { currentTokens: number; maxTokens?: number }) {
  const percentage = (currentTokens / maxTokens) * 100
  const isWarning = percentage > 75
  const isDanger = percentage > 90

  const getColorClass = () => {
    if (isDanger) return 'text-red-500'
    if (isWarning) return 'text-yellow-500'
    return 'text-zinc-500'
  }

  return (
    <div className="flex items-center gap-2">
      <Zap className={cn('w-3 h-3', getColorClass())} />
      <span className={cn('text-xs', getColorClass())}>
        {currentTokens.toLocaleString()} / {maxTokens.toLocaleString()}
      </span>
    </div>
  )
}