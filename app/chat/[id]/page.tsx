"use client"

import { AnimatedAIChat } from "@/components/animated-ai-chat"
import CodePreview from "@/components/code-preview"
import WebContainerComponent from "@/components/web-container"
import { motion } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import { useUser, UserButton, SignedIn } from "@clerk/nextjs"
import { useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Code, Eye, Maximize2, Minimize2, ArrowLeft, Zap, Settings, BarChart3 } from "lucide-react"
import { getTokenUsageStats } from "@/lib/openrouter"

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

// Memoized header component
const ChatHeader = ({ onBack, tokenStats }: { 
  onBack: () => void, 
  tokenStats: { used: number, remaining: number, percentage: number, availableModels: number } 
}) => (
  <motion.div 
    className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-white/10"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-4">
      <BackButton onClick={onBack} />
      <div>
        <h1 className="text-xl font-bold text-white">ZapDev Studio</h1>
        <p className="text-sm text-gray-400">AI-Powered Development</p>
      </div>
    </div>
    
    <div className="flex items-center gap-4">
      {/* Token Usage Indicator */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
        <BarChart3 className="w-4 h-4 text-violet-400" />
        <span className="text-xs text-gray-300">
          {tokenStats.percentage.toFixed(0)}% used
        </span>
        <div className="w-12 h-1 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              tokenStats.percentage > 80 ? 'bg-red-400' : 
              tokenStats.percentage > 60 ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ width: `${Math.min(tokenStats.percentage, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Available Models */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
        <Zap className="w-4 h-4 text-blue-400" />
        <span className="text-xs text-gray-300">
          {tokenStats.availableModels} models
        </span>
      </div>
      
      <SignedIn>
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8"
            }
          }}
        />
      </SignedIn>
    </div>
  </motion.div>
)

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useUser()
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [activeView, setActiveView] = useState<"preview" | "code" | "webcontainer">("preview")
  const [isMaximized, setIsMaximized] = useState(false)
  const [tokenStats, setTokenStats] = useState({ used: 0, remaining: 50000, percentage: 0, availableModels: 5 })
  
  const chatId = params.id as string

  // Update token stats periodically
  useEffect(() => {
    const updateStats = () => {
      const stats = getTokenUsageStats()
      setTokenStats({
        used: stats.used,
        remaining: stats.remaining,
        percentage: stats.percentage,
        availableModels: stats.availableModels || 5
      })
    }
    
    updateStats()
    const interval = setInterval(updateStats, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Memoized code handlers
  const handleCodeGenerated = useMemo(() => (code: string) => {
    setGeneratedCode(code)
  }, [])

  const handleCodeChange = useMemo(() => (code: string) => {
    setGeneratedCode(code)
  }, [])

  // Navigation handlers
  const handleBack = useMemo(() => () => {
    router.push("/chat")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <ChatHeader onBack={handleBack} tokenStats={tokenStats} />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Preview/Code/WebContainer */}
        <motion.div
          className={cn(
            "bg-gray-900/50 backdrop-blur-sm border-r border-white/10 transition-all duration-300",
            isMaximized ? "w-full" : "w-1/2"
          )}
          layout
        >
          {/* Left Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView("preview")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeView === "preview"
                    ? "bg-violet-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => setActiveView("code")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeView === "code"
                    ? "bg-violet-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Code className="w-4 h-4" />
                Code
              </button>
              <button
                onClick={() => setActiveView("webcontainer")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeView === "webcontainer"
                    ? "bg-violet-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Zap className="w-4 h-4" />
                Container
              </button>
            </div>
            
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Content Area */}
          <div className="h-[calc(100%-64px)] overflow-hidden">
            {activeView === "preview" && (
              <CodePreview 
                code={generatedCode}
              />
            )}
            {activeView === "code" && (
              <div className="h-full bg-gray-900">
                <div className="h-full overflow-auto">
                  <pre className="p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {generatedCode || "// Generated code will appear here..."}
                  </pre>
                </div>
              </div>
            )}
            {activeView === "webcontainer" && (
              <WebContainerComponent
                code={generatedCode}
                onCodeChange={handleCodeChange}
                className="h-full"
              />
            )}
          </div>
        </motion.div>

        {/* Right Panel - Chat */}
        {!isMaximized && (
          <motion.div
            className="w-1/2 bg-gray-900/30 backdrop-blur-sm flex flex-col"
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <AnimatedAIChat
              chatId={chatId}
              onCodeGenerated={handleCodeGenerated}
              onFirstMessageSent={() => {
                // Handle first message if needed
              }}
              useMultipleModels={true} // Enable multiple models
              className="h-full"
            />
          </motion.div>
        )}
      </div>

      {/* Floating maximize button when right panel is hidden */}
      {isMaximized && (
        <motion.button
          onClick={() => setIsMaximized(false)}
          className="fixed bottom-6 right-6 p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg transition-colors z-50"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Settings className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  )
} 