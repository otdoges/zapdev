'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileChange {
  path: string;
  originalContent: string;
  modifiedContent: string;
  status: 'unchanged' | 'modified' | 'added' | 'deleted';
}

interface CodeDiffViewerProps {
  projectFiles: Record<string, { file: { contents: string } }>;
  onApprove?: (approvedFiles: Record<string, string>) => void;
  onReject?: () => void;
  onModify?: (modifiedFiles: Record<string, string>) => void;
  className?: string;
}

export default function CodeDiffViewer({
  projectFiles,
  onApprove,
  onReject,
  onModify,
  className,
}: CodeDiffViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [modifiedFiles, setModifiedFiles] = useState<Record<string, string>>({});
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize with first file
  useEffect(() => {
    const firstFile = Object.keys(projectFiles)[0];
    if (firstFile && !selectedFile) {
      setSelectedFile(firstFile);
      setCurrentContent(projectFiles[firstFile].file.contents);
    }
  }, [projectFiles, selectedFile]);

  // Get file changes
  const getFileChanges = (): FileChange[] => {
    return Object.entries(projectFiles).map(([path, fileData]) => {
      const originalContent = fileData.file.contents;
      const modifiedContent = modifiedFiles[path] || originalContent;

      return {
        path,
        originalContent,
        modifiedContent,
        status: modifiedFiles[path] ? 'modified' : 'unchanged',
      };
    });
  };

  // Handle file selection
  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    setCurrentContent(modifiedFiles[filePath] || projectFiles[filePath].file.contents);
    setIsEditorMode(false);
    setEditingFile(null);
  };

  // Start editing a file
  const startEditing = (filePath: string) => {
    setEditingFile(filePath);
    setIsEditorMode(true);
    setCurrentContent(modifiedFiles[filePath] || projectFiles[filePath].file.contents);
  };

  // Save file changes
  const saveFileChanges = () => {
    if (editingFile) {
      setModifiedFiles((prev) => ({
        ...prev,
        [editingFile]: currentContent,
      }));
      setIsEditorMode(false);
      setEditingFile(null);
      onModify?.({ ...modifiedFiles, [editingFile]: currentContent });
    }
  };

  // Discard file changes
  const discardChanges = () => {
    if (editingFile) {
      setCurrentContent(projectFiles[editingFile].file.contents);
      setIsEditorMode(false);
      setEditingFile(null);
    }
  };

  // Reset file to original
  const resetFile = (filePath: string) => {
    const newModified = { ...modifiedFiles };
    delete newModified[filePath];
    setModifiedFiles(newModified);

    if (selectedFile === filePath) {
      setCurrentContent(projectFiles[filePath].file.contents);
    }
  };

  // Approve all changes
  const handleApprove = () => {
    const finalFiles: Record<string, string> = {};

    Object.entries(projectFiles).forEach(([path, fileData]) => {
      finalFiles[path] = modifiedFiles[path] || fileData.file.contents;
    });

    onApprove?.(finalFiles);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentContent);
  };

  // Get file icon
  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'tsx':
      case 'jsx':
        return <Code className="h-4 w-4 text-blue-400" />;
      case 'ts':
      case 'js':
        return <FileText className="h-4 w-4 text-yellow-400" />;
      case 'css':
        return <FileText className="h-4 w-4 text-purple-400" />;
      case 'json':
        return <FileText className="h-4 w-4 text-green-400" />;
      case 'html':
        return <FileText className="h-4 w-4 text-orange-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  // Filter files by search term
  const filteredFiles = Object.keys(projectFiles).filter((path) =>
    path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fileChanges = getFileChanges();
  const hasChanges = Object.keys(modifiedFiles).length > 0;

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-lg border border-gray-700 bg-gray-900',
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-blue-400" />
            <div>
              <h3 className="font-semibold text-white">Code Review & Approval</h3>
              <p className="text-sm text-gray-400">
                Review and modify generated code before deployment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-1 text-sm text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                {Object.keys(modifiedFiles).length} modified
              </div>
            )}

            <button
              onClick={onReject}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
            >
              <X className="mr-1 inline h-4 w-4" />
              Reject
            </button>

            <button
              onClick={handleApprove}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
            >
              <Check className="mr-1 inline h-4 w-4" />
              Approve & Deploy
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div className="flex w-80 flex-col border-r border-gray-700">
          <div className="border-b border-gray-700 p-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 p-2">
              {filteredFiles.map((filePath) => {
                const isModified = modifiedFiles[filePath];
                const isSelected = selectedFile === filePath;

                return (
                  <motion.div
                    key={filePath}
                    whileHover={{ x: 4 }}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-all',
                      isSelected ? 'border border-blue-500/30 bg-blue-600/20' : 'hover:bg-gray-800',
                      isModified && 'border-l-2 border-l-yellow-500 bg-yellow-500/10'
                    )}
                    onClick={() => handleFileSelect(filePath)}
                  >
                    {getFileIcon(filePath)}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white">{filePath}</div>
                      {isModified && <div className="text-xs text-yellow-400">Modified</div>}
                    </div>

                    {isModified && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetFile(filePath);
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
                        title="Reset to original"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Code Editor/Viewer */}
        <div className="flex flex-1 flex-col">
          {selectedFile && (
            <>
              {/* File Header */}
              <div className="flex items-center justify-between border-b border-gray-700 p-3">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile)}
                  <span className="font-medium text-white">{selectedFile}</span>
                  {modifiedFiles[selectedFile] && (
                    <span className="rounded bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
                      Modified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="rounded p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </button>

                  {isEditorMode && editingFile === selectedFile ? (
                    <div className="flex gap-1">
                      <button
                        onClick={saveFileChanges}
                        className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                      >
                        <Check className="mr-1 inline h-3 w-3" />
                        Save
                      </button>
                      <button
                        onClick={discardChanges}
                        className="rounded bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
                      >
                        <X className="mr-1 inline h-3 w-3" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(selectedFile)}
                      className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                      <Edit className="mr-1 inline h-3 w-3" />
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
                    className="h-full w-full resize-none bg-gray-800 p-4 font-mono text-sm text-white focus:outline-none"
                    spellCheck={false}
                  />
                ) : (
                  <div className="h-full overflow-y-auto">
                    <pre className="whitespace-pre-wrap p-4 font-mono text-sm text-gray-300">
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
      <div className="border-t border-gray-700 bg-gray-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-400">
              <FileText className="h-4 w-4" />
              {Object.keys(projectFiles).length} files
            </div>
            {hasChanges && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Edit className="h-4 w-4" />
                {Object.keys(modifiedFiles).length} modified
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">Review code carefully before deployment</div>
        </div>
      </div>
    </div>
  );
}
