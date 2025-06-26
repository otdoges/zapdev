"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  Edit, 
  Check, 
  X, 
  RefreshCw, 
  Download,
  Upload,
  FileText,
  Code,
  Zap,
  AlertTriangle,
  CheckCircle,
  Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileChange {
  path: string
  originalContent: string
  modifiedContent: string
  status: 'unchanged' | 'modified' | 'added' | 'deleted'
}

interface CodeDiffViewerProps {
  projectFiles: Record<string, { file: { contents: string } }>
  onApprove?: (approvedFiles: Record<string, string>) => void
  onReject?: () => void
  onModify?: (modifiedFiles: Record<string, string>) => void
  className?: string
}

export default function CodeDiffViewer({
  projectFiles,
  onApprove,
  onReject,
  onModify,
  className
}: CodeDiffViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [modifiedFiles, setModifiedFiles] = useState<Record<string, string>>({})
  const [isEditorMode, setIsEditorMode] = useState(false)
  const [currentContent, setCurrentContent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Initialize with first file
  useEffect(() => {
    const firstFile = Object.keys(projectFiles)[0]
    if (firstFile && !selectedFile) {
      setSelectedFile(firstFile)
      setCurrentContent(projectFiles[firstFile].file.contents)
    }
  }, [projectFiles, selectedFile])

  // Get file changes
  const getFileChanges = (): FileChange[] => {
    return Object.entries(projectFiles).map(([path, fileData]) => {
      const originalContent = fileData.file.contents
      const modifiedContent = modifiedFiles[path] || originalContent
      
      return {
        path,
        originalContent,
        modifiedContent,
        status: modifiedFiles[path] ? 'modified' : 'unchanged'
      }
    })
  }

  // Handle file selection
  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath)
    setCurrentContent(modifiedFiles[filePath] || projectFiles[filePath].file.contents)
    setIsEditorMode(false)
    setEditingFile(null)
  }

  // Start editing a file
  const startEditing = (filePath: string) => {
    setEditingFile(filePath)
    setIsEditorMode(true)
    setCurrentContent(modifiedFiles[filePath] || projectFiles[filePath].file.contents)
  }

  // Save file changes
  const saveFileChanges = () => {
    if (editingFile) {
      setModifiedFiles(prev => ({
        ...prev,
        [editingFile]: currentContent
      }))
      setIsEditorMode(false)
      setEditingFile(null)
      onModify?.({ ...modifiedFiles, [editingFile]: currentContent })
    }
  }

  // Discard file changes
  const discardChanges = () => {
    if (editingFile) {
      setCurrentContent(projectFiles[editingFile].file.contents)
      setIsEditorMode(false)
      setEditingFile(null)
    }
  }

  // Reset file to original
  const resetFile = (filePath: string) => {
    const newModified = { ...modifiedFiles }
    delete newModified[filePath]
    setModifiedFiles(newModified)
    
    if (selectedFile === filePath) {
      setCurrentContent(projectFiles[filePath].file.contents)
    }
  }

  // Approve all changes
  const handleApprove = () => {
    const finalFiles: Record<string, string> = {}
    
    Object.entries(projectFiles).forEach(([path, fileData]) => {
      finalFiles[path] = modifiedFiles[path] || fileData.file.contents
    })
    
    onApprove?.(finalFiles)
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentContent)
  }

  // Get file icon
  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return <Code className="w-4 h-4 text-blue-400" />
      case 'ts':
      case 'js':
        return <FileText className="w-4 h-4 text-yellow-400" />
      case 'css':
        return <FileText className="w-4 h-4 text-purple-400" />
      case 'json':
        return <FileText className="w-4 h-4 text-green-400" />
      case 'html':
        return <FileText className="w-4 h-4 text-orange-400" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  // Filter files by search term
  const filteredFiles = Object.keys(projectFiles).filter(path =>
    path.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const fileChanges = getFileChanges()
  const hasChanges = Object.keys(modifiedFiles).length > 0

  return (
    <div className={cn("bg-gray-900 rounded-lg border border-gray-700 h-full flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-white font-semibold">Code Review & Approval</h3>
              <p className="text-gray-400 text-sm">
                Review and modify generated code before deployment
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-1 text-yellow-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {Object.keys(modifiedFiles).length} modified
              </div>
            )}
            
            <button
              onClick={onReject}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              <X className="w-4 h-4 inline mr-1" />
              Reject
            </button>
            
            <button
              onClick={handleApprove}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              <Check className="w-4 h-4 inline mr-1" />
              Approve & Deploy
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredFiles.map(filePath => {
                const isModified = modifiedFiles[filePath]
                const isSelected = selectedFile === filePath
                
                return (
                  <motion.div
                    key={filePath}
                    whileHover={{ x: 4 }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                      isSelected 
                        ? "bg-blue-600/20 border border-blue-500/30" 
                        : "hover:bg-gray-800",
                      isModified && "bg-yellow-500/10 border-l-2 border-l-yellow-500"
                    )}
                    onClick={() => handleFileSelect(filePath)}
                  >
                    {getFileIcon(filePath)}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">{filePath}</div>
                      {isModified && (
                        <div className="text-yellow-400 text-xs">Modified</div>
                      )}
                    </div>
                    
                    {isModified && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          resetFile(filePath)
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        title="Reset to original"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Code Editor/Viewer */}
        <div className="flex-1 flex flex-col">
          {selectedFile && (
            <>
              {/* File Header */}
              <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile)}
                  <span className="text-white font-medium">{selectedFile}</span>
                  {modifiedFiles[selectedFile] && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                      Modified
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  {isEditorMode && editingFile === selectedFile ? (
                    <div className="flex gap-1">
                      <button
                        onClick={saveFileChanges}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        <Check className="w-3 h-3 inline mr-1" />
                        Save
                      </button>
                      <button
                        onClick={discardChanges}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                      >
                        <X className="w-3 h-3 inline mr-1" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(selectedFile)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Code Content */}
              <div className="flex-1 overflow-hidden">
                {isEditorMode && editingFile === selectedFile ? (
                  <textarea
                    value={currentContent}
                    onChange={(e) => setCurrentContent(e.target.value)}
                    className="w-full h-full p-4 bg-gray-800 text-white font-mono text-sm resize-none focus:outline-none"
                    spellCheck={false}
                  />
                ) : (
                  <div className="h-full overflow-y-auto">
                    <pre className="p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap">
                      <code>{currentContent}</code>
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-400">
              <FileText className="w-4 h-4" />
              {Object.keys(projectFiles).length} files
            </div>
            {hasChanges && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Edit className="w-4 h-4" />
                {Object.keys(modifiedFiles).length} modified
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Review code carefully before deployment
          </div>
        </div>
      </div>
    </div>
  )
} 