"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Square, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Loader,
  Terminal
} from 'lucide-react'

interface WebContainerProps {
  code: string
  onCodeChange?: (code: string) => void
  className?: string
}

export default function WebContainerComponent({ code, onCodeChange, className }: WebContainerProps) {
  const [container, setContainer] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Initialize WebContainer (mock for now until properly implemented)
  useEffect(() => {
    const initContainer = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        // Mock container initialization
        await new Promise(resolve => setTimeout(resolve, 1000))
        setContainer({ mock: true })
        
        // Auto-start if we have code
        if (code.trim()) {
          startPreview()
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize WebContainer:', error)
        setError('Failed to initialize WebContainer')
        setIsLoading(false)
      }
    }

    initContainer()
  }, [])

  // Auto-update preview when code changes
  useEffect(() => {
    if (container && code.trim() && !isLoading) {
      const debounceTimer = setTimeout(() => {
        startPreview()
      }, 500)
      
      return () => clearTimeout(debounceTimer)
    }
  }, [code, container, isLoading])

  // Start preview with current code
  const startPreview = useCallback(() => {
    if (!code.trim()) {
      setPreviewUrl('')
      return
    }

    setIsRunning(true)
    setError('')
    setTerminalOutput(prev => [...prev, '🚀 Building preview...'])
    
    try {
      // Create enhanced HTML with better styling and error handling
      const enhancedHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZapDev Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 16px; 
            font-family: system-ui, -apple-system, sans-serif;
            background: #ffffff;
            min-height: 100vh;
        }
        .error-message {
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <div id="root">
        <div id="preview-content">
            ${code}
        </div>
    </div>
    
    <script>
        // Error handling
        window.addEventListener('error', function(e) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = '<strong>Error:</strong> ' + e.message;
            document.getElementById('root').prepend(errorDiv);
        });
        
        // Console logging for debugging
        const originalLog = console.log;
        console.log = function(...args) {
            originalLog.apply(console, args);
            // Could send logs back to parent if needed
        };
        
        // Initialize any JavaScript if present
        try {
            // Execute any script tags in the code
            const scripts = document.querySelectorAll('#preview-content script');
            scripts.forEach(script => {
                if (script.src) {
                    const newScript = document.createElement('script');
                    newScript.src = script.src;
                    document.head.appendChild(newScript);
                } else if (script.textContent) {
                    eval(script.textContent);
                }
            });
        } catch (e) {
            console.error('Script execution error:', e);
        }
    </script>
</body>
</html>`
      
      const blob = new Blob([enhancedHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      setPreviewUrl(url)
      setTerminalOutput(prev => [...prev, '✅ Preview ready!'])
      
      // Cleanup old URL
      return () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
      }
    } catch (error) {
      console.error('Preview generation failed:', error)
      setError('Failed to generate preview')
      setTerminalOutput(prev => [...prev, `❌ Error: ${error}`])
    } finally {
      setIsRunning(false)
    }
  }, [code, previewUrl])

  // Stop preview
  const stopPreview = useCallback(() => {
    setIsRunning(false)
    setPreviewUrl('')
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setTerminalOutput(prev => [...prev, '🛑 Preview stopped'])
  }, [previewUrl])

  // Refresh preview
  const refreshPreview = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
    setTerminalOutput(prev => [...prev, '🔄 Preview refreshed'])
  }, [])

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-gray-400">Initializing WebContainer...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full bg-gray-900 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-white text-sm ml-2">Preview</span>
          {isRunning && <Loader className="w-4 h-4 animate-spin text-violet-400" />}
        </div>
        
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={startPreview}
              disabled={!code.trim()}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
            >
              <Play className="w-3 h-3" />
              Run
            </button>
          ) : (
            <button
              onClick={stopPreview}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
          )}
          
          <button
            onClick={refreshPreview}
            disabled={!previewUrl}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative">
        {previewUrl ? (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="WebContainer Preview"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Terminal className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No preview available</p>
              <p className="text-gray-500 text-sm">
                {code.trim() ? 'Click Run to start preview' : 'Generate some code to see a preview'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {terminalOutput.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700 p-2 max-h-24 overflow-y-auto">
          <div className="text-xs font-mono">
            {terminalOutput.slice(-3).map((output, index) => (
              <div key={index} className="text-gray-400 mb-1">
                {output}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 