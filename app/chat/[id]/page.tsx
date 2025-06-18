"use client"

import { AnimatedAIChat } from "@/components/animated-ai-chat"
import WebContainerComponent from "@/components/web-container"
import { motion } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Code, Eye, Maximize2, Minimize2, ArrowLeft, Settings, BarChart3, Brain } from "lucide-react"
import { getTokenUsageStats } from "@/lib/openrouter"
import { useAuthUser } from "@/lib/actions"

// Memoize static components for better performance
const BackButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    onClick={onClick}
    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center will-change-transform"
    whileTap={{ scale: 0.95 }}
    whileHover={{ scale: 1.05 }}
  >
    <ArrowLeft className="w-5 h-5 text-white" />
  </motion.button>
)

const StatsDisplay = ({ stats }: { stats: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 text-xs text-white/60"
  >
    <div className="flex items-center gap-1">
      <Brain className="w-3 h-3" />
      <span>{stats?.totalTokens?.toLocaleString() || 0} tokens</span>
    </div>
    <div className="flex items-center gap-1">
      <BarChart3 className="w-3 h-3" />
      <span>${(stats?.totalCost || 0).toFixed(4)}</span>
    </div>
  </motion.div>
)

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.id as string
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false)
  const [tokenStats, setTokenStats] = useState<any>(null)
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [hasMessagesSent, setHasMessagesSent] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuthUser()

  // Memoized handlers
  const handleBack = useMemo(() => () => router.push('/chat'), [router])
  const togglePreview = useMemo(() => () => setIsPreviewExpanded(prev => !prev), [])

  // Load token usage stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getTokenUsageStats()
        setTokenStats(stats)
      } catch (error) {
        console.error('Failed to load token stats:', error)
      }
    }
    
    if (isAuthenticated) {
      loadStats()
    }
  }, [isAuthenticated])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0D0D10] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <BackButton onClick={handleBack} />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">
              Chat Session
            </h1>
            <StatsDisplay stats={tokenStats} />
          </div>
        </div>
        
        {/* Only show preview controls after first message */}
        {hasMessagesSent && (
          <div className="flex items-center gap-2">
            <motion.button
              onClick={togglePreview}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isPreviewExpanded ? (
                <>
                  <Code className="w-4 h-4" />
                  <span className="text-sm">Show Chat</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Show Preview</span>
                </>
              )}
            </motion.button>
            
            <motion.button
              onClick={togglePreview}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {isPreviewExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </motion.button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {!hasMessagesSent ? (
        /* Full-width chat before first message */
        <div className="flex-1 flex overflow-hidden">
          <div className="w-full h-full">
            <AnimatedAIChat
              chatId={chatId === 'new' ? undefined : chatId}
              onFirstMessageSent={() => {
                console.log('First message sent')
                setHasMessagesSent(true)
              }}
              onCodeGenerated={(code) => {
                setGeneratedCode(code)
              }}
              useMultipleModels={false}
              className="h-full"
            />
          </div>
        </div>
      ) : (
        /* Split layout after first message */
        <motion.div 
          className="flex-1 flex overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Chat Panel */}
          <motion.div 
            className={cn(
              "transition-all duration-300 flex flex-col",
              isPreviewExpanded ? "w-0 opacity-0" : "w-1/2 opacity-100"
            )}
            initial={{ width: "100%" }}
            animate={{ width: isPreviewExpanded ? "0%" : "50%" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <AnimatedAIChat
              chatId={chatId === 'new' ? undefined : chatId}
              onFirstMessageSent={() => {
                console.log('First message sent')
              }}
              onCodeGenerated={(code) => {
                setGeneratedCode(code)
              }}
              useMultipleModels={false}
              className="h-full"
            />
          </motion.div>

          {/* Separator */}
          {!isPreviewExpanded && (
            <motion.div 
              className="w-px bg-white/10 flex-shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
          )}

          {/* Preview Panel */}
          <motion.div 
            className={cn(
              "transition-all duration-300 flex flex-col",
              isPreviewExpanded ? "w-full opacity-100" : "w-1/2 opacity-100"
            )}
            initial={{ width: "0%", opacity: 0 }}
            animate={{ 
              width: isPreviewExpanded ? "100%" : "50%", 
              opacity: 1 
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <WebContainerComponent 
              code={generatedCode}
              onCodeChange={setGeneratedCode}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 