"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MonacoEditor } from "@/components/ui/monaco-editor"

interface CodePreviewProps {
  code: string
  language?: string
  filename?: string
}

export default function CodePreview({ code, language = "html", filename = "index.html" }: CodePreviewProps) {
  const [mounted, setMounted] = useState(false)
  const [editorOptions] = useState({
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
    lineNumbers: "on" as const,
    readOnly: false,
    wordWrap: "on" as const,
    automaticLayout: true,
    scrollbar: {
      vertical: "auto" as const,
      horizontal: "auto" as const,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    renderLineHighlight: "none" as const,
    selectionHighlight: false,
    occurrencesHighlight: false,
    contextmenu: false,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: "off" as const,
    tabCompletion: "off" as const,
    wordBasedSuggestions: "off" as const,
    parameterHints: { enabled: false },
    hover: { enabled: false },
  })

  // Set mounted state once component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce"></div>
          <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-.2s]"></div>
          <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-.4s]"></div>
        </div>
      </div>
    )
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
    <div className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
      {/* File header bar */}
      <div className="bg-[#2d2d30] px-4 py-2.5 font-mono text-xs text-slate-300 flex items-center border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-slate-200">{filename}</span>
        </div>
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
    </div>
  )
} 