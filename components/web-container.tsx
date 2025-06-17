"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Square, 
  RefreshCw, 
  Globe,
  Save,
  Zap,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { MonacoEditor } from '@/components/ui/monaco-editor'

interface WebContainerProps {
  code: string
  onCodeChange?: (code: string) => void
  className?: string
}

export function WebContainerComponent({ code, onCodeChange, className }: WebContainerProps) {
  const [container, setContainer] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [fileContent, setFileContent] = useState<string>(code)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'terminal'>('editor')
  const [isMaximized, setIsMaximized] = useState(false)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Initialize WebContainer
  useEffect(() => {
    const initContainer = async () => {
      try {
        setIsLoading(true)
        // For now, we'll use a mock container until WebContainer is properly set up
        setContainer({ mock: true })
        setFileContent(code)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize WebContainer:', error)
        setIsLoading(false)
      }
    }

    initContainer()
  }, [code])

  // Start development server
  const startDevServer = useCallback(async () => {
    setIsRunning(true)
    setTerminalOutput(prev => [...prev, '🚀 Starting development server...'])
    
    // Mock preview URL for now
    const mockHtml = `data:text/html,${encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ZapDev Preview</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>body { margin: 0; padding: 16px; }</style>
        </head>
        <body>
          <div id="app">
            ${fileContent}
          </div>
        </body>
      </html>
    `)}`
    
    setPreviewUrl(mockHtml)
    setTerminalOutput(prev => [...prev, '🌐 Server ready!'])
  }, [fileContent])

  // Stop development server
  const stopDevServer = useCallback(() => {
    setIsRunning(false)
    setPreviewUrl('')
    setTerminalOutput(prev => [...prev, '🛑 Server stopped'])
  }, [])

  if (isLoading) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-gray-400">Initializing WebContainer...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={`bg-gray-900 rounded-lg border border-gray-700 overflow-hidden ${
        isMaximized ? 'fixed inset-4 z-50' : ''
      } ${className}`}
      layout
    >
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-500" />
            <h3 className="text-white font-medium">WebContainer</h3>
          </div>
          
          <div className="flex items-center gap-1">
            {['editor', 'preview', 'terminal'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={startDevServer}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
            >
              <Play className="w-3 h-3" />
              Start
            </button>
          ) : (
            <button
              onClick={stopDevServer}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
          )}
          
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-96">
        {activeTab === 'editor' && (
          <div className="h-full flex flex-col">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <span className="text-white text-sm">index.html</span>
              <button
                onClick={() => onCodeChange?.(fileContent)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </div>
            
            <div className="flex-1">
              <MonacoEditor
                value={fileContent}
                onChange={(value: string | undefined) => {
                  setFileContent(value || '')
                  onCodeChange?.(value || '')
                }}
                language="html"
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="h-full bg-white">
            {previewUrl ? (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-0"
                title="Preview"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start the development server to see preview</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="h-full bg-black text-green-400 font-mono text-sm overflow-hidden">
            <div className="h-full overflow-y-auto p-4" ref={terminalRef}>
              {terminalOutput.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
              {terminalOutput.length === 0 && (
                <div className="text-gray-500">WebContainer terminal ready...</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 px-4 py-1 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1 ${isRunning ? 'text-green-400' : 'text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`} />
            {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        
        <span>WebContainer v1.6.1</span>
      </div>
    </motion.div>
  )
}

export default WebContainerComponent 