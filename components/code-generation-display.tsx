'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode,
  FolderPlus,
  CheckCircle,
  Sparkles,
  Zap,
  Package,
  Palette,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileCreation {
  id: string;
  name: string;
  type: 'component' | 'style' | 'config' | 'package';
  status: 'pending' | 'creating' | 'complete';
  size?: string;
  preview?: string;
}

interface CodeGenerationDisplayProps {
  isVisible: boolean;
  files?: FileCreation[];
  currentAction?: string;
  onComplete?: () => void;
  className?: string;
}

const getFileIcon = (type: FileCreation['type']) => {
  switch (type) {
    case 'component':
      return <FileCode className="h-4 w-4" />;
    case 'style':
      return <Palette className="h-4 w-4" />;
    case 'config':
      return <Settings className="h-4 w-4" />;
    case 'package':
      return <Package className="h-4 w-4" />;
    default:
      return <FileCode className="h-4 w-4" />;
  }
};

const getFileColor = (type: FileCreation['type'], status: FileCreation['status']) => {
  if (status === 'complete') return 'text-green-400';
  if (status === 'creating') {
    switch (type) {
      case 'component':
        return 'text-blue-400';
      case 'style':
        return 'text-purple-400';
      case 'config':
        return 'text-orange-400';
      case 'package':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  }
  return 'text-slate-400';
};

export default function CodeGenerationDisplay({
  isVisible,
  files = [],
  currentAction = 'Generating code...',
  onComplete,
  className,
}: CodeGenerationDisplayProps) {
  const [displayFiles, setDisplayFiles] = useState<FileCreation[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Default files if none provided
  const defaultFiles: FileCreation[] = [
    {
      id: 'package',
      name: 'package.json',
      type: 'package',
      status: 'pending',
      size: '1.2KB',
      preview: '{\n  "name": "my-app",\n  "dependencies": {...}',
    },
    {
      id: 'app',
      name: 'App.tsx',
      type: 'component',
      status: 'pending',
      size: '3.4KB',
      preview: 'import React from "react";\n\nexport default function App() {...}',
    },
    {
      id: 'styles',
      name: 'globals.css',
      type: 'style',
      status: 'pending',
      size: '2.1KB',
      preview: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
    },
    {
      id: 'config',
      name: 'tailwind.config.js',
      type: 'config',
      status: 'pending',
      size: '1.8KB',
      preview: 'module.exports = {\n  content: [...],\n  theme: {...}',
    },
  ];

  const activeFiles = files.length > 0 ? files : defaultFiles;

  useEffect(() => {
    if (!isVisible) {
      setDisplayFiles([]);
      setCurrentFileIndex(0);
      return;
    }

    setDisplayFiles(activeFiles.map((file) => ({ ...file, status: 'pending' })));
  }, [isVisible, files]);

  useEffect(() => {
    if (!isVisible || displayFiles.length === 0) return;

    const timer = setTimeout(() => {
      if (currentFileIndex < displayFiles.length) {
        // Update current file to creating
        setDisplayFiles((prev) =>
          prev.map((file, index) => ({
            ...file,
            status:
              index < currentFileIndex
                ? 'complete'
                : index === currentFileIndex
                  ? 'creating'
                  : 'pending',
          }))
        );

        // After 1.5 seconds, mark as complete and move to next
        setTimeout(() => {
          setDisplayFiles((prev) =>
            prev.map((file, index) => ({
              ...file,
              status:
                index <= currentFileIndex
                  ? 'complete'
                  : index === currentFileIndex + 1
                    ? 'creating'
                    : 'pending',
            }))
          );

          if (currentFileIndex < displayFiles.length - 1) {
            setCurrentFileIndex((prev) => prev + 1);
          } else {
            // All files complete
            setTimeout(() => {
              onComplete?.();
            }, 1000);
          }
        }, 1500);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentFileIndex, displayFiles.length, isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm',
          'overflow-hidden rounded-xl border border-slate-700/50 shadow-xl',
          'mx-auto max-w-lg',
          className
        )}
      >
        {/* Header */}
        <div className="border-b border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 p-2"
            >
              <Zap className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold text-white">Code Generation</h3>
              <p className="text-sm text-slate-400">{currentAction}</p>
            </div>
          </div>
        </div>

        {/* File Creation Progress */}
        <div className="space-y-3 p-4">
          {displayFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-3 rounded-lg p-3 transition-all duration-300',
                file.status === 'creating'
                  ? 'border border-violet-500/30 bg-violet-500/20'
                  : file.status === 'complete'
                    ? 'border border-green-500/30 bg-green-500/20'
                    : 'border border-slate-700/30 bg-slate-800/30'
              )}
            >
              {/* File Icon */}
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300',
                  file.status === 'creating'
                    ? 'bg-violet-500/20'
                    : file.status === 'complete'
                      ? 'bg-green-500/20'
                      : 'bg-slate-700/50'
                )}
              >
                <div className={getFileColor(file.type, file.status)}>{getFileIcon(file.type)}</div>
              </div>

              {/* File Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'truncate font-medium transition-colors duration-300',
                      file.status === 'creating'
                        ? 'text-violet-300'
                        : file.status === 'complete'
                          ? 'text-green-300'
                          : 'text-slate-300'
                    )}
                  >
                    {file.name}
                  </p>
                  {file.size && (
                    <span className="rounded bg-slate-700/50 px-2 py-1 text-xs text-slate-500">
                      {file.size}
                    </span>
                  )}
                </div>

                {file.status === 'creating' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                    <div className="h-1 w-full rounded-full bg-slate-700">
                      <motion.div
                        className="h-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                )}

                {file.preview && file.status === 'creating' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 overflow-hidden rounded bg-slate-900/50 p-2 font-mono text-xs text-slate-400"
                  >
                    <div className="truncate">{file.preview}</div>
                  </motion.div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center">
                {file.status === 'creating' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="text-violet-400"
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                )}
                {file.status === 'complete' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-400"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Overall Progress */}
        <div className="border-t border-slate-700/50 p-4">
          <div className="mb-2 flex justify-between text-sm text-slate-400">
            <span>Files Created</span>
            <span>
              {Math.min(currentFileIndex + 1, displayFiles.length)} / {displayFiles.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-700">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{
                width: `${(Math.min(currentFileIndex + 1, displayFiles.length) / displayFiles.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Completion Status */}
        {currentFileIndex >= displayFiles.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-green-500/20 bg-green-500/10 p-4"
          >
            <div className="flex items-center justify-center gap-2 text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">All files generated successfully!</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
