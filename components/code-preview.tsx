"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

// Dynamically import the Monaco Editor to reduce initial bundle size
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="animate-pulse flex space-x-2">
        <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce"></div>
        <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-.2s]"></div>
        <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-.4s]"></div>
      </div>
    </div>
  )
})

interface CodePreviewProps {
  code: string
  language?: string
  filename?: string
}

export default function CodePreview({ code, language = "typescript", filename = "main.tsx" }: CodePreviewProps) {
  const [mounted, setMounted] = useState(false)
  const [editorOptions] = useState({
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: "on",
    readOnly: false, // Allow the user to edit the code
    wordWrap: "on",
    automaticLayout: true,
    scrollbar: {
      vertical: "auto",
      horizontal: "auto"
    }
  })

  // Set mounted state once component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Detect language from filename
  const getLanguageFromFilename = (filename: string): string => {
    const extension = filename.split('.').pop()
    switch (extension) {
      case 'js':
        return 'javascript'
      case 'ts':
        return 'typescript'
      case 'jsx':
      case 'tsx':
        return 'typescript'
      case 'css':
        return 'css'
      case 'scss':
      case 'sass':
        return 'scss'
      case 'html':
        return 'html'
      case 'json':
        return 'json'
      case 'md':
        return 'markdown'
      case 'py':
        return 'python'
      default:
        return language // fallback to provided language
    }
  }

  const detectedLanguage = filename ? getLanguageFromFilename(filename) : language

  return (
    <motion.div
      className="flex flex-col h-full bg-slate-900/75 rounded-lg overflow-hidden border border-slate-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* File header bar */}
      <div className="bg-slate-800/50 px-4 py-2 font-mono text-xs text-slate-400 flex items-center">
        <span className="mr-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span>{filename}</span>
      </div>
      
      {/* Monaco editor */}
      <div className="flex-grow">
        <MonacoEditor
          height="100%"
          defaultLanguage={detectedLanguage}
          defaultValue={code}
          theme="vs-dark"
          options={editorOptions}
        />
      </div>
    </motion.div>
  )
} 