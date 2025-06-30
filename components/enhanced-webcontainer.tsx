'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader,
  Terminal,
  FileText,
  Code2,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { ServerFallbackService, FallbackResult } from '@/lib/services/webcontainer/server-fallback';
import { WebContainerManager } from '@/lib/services/webcontainer/webcontainer-manager';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

interface EnhancedWebContainerProps {
  code: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  aiTeamInstructions?: string;
  projectType?: 'html' | 'react' | 'vue' | 'svelte';
}

export default function EnhancedWebContainerComponent({
  code,
  className,
  projectType = 'html',
}: EnhancedWebContainerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [executionMethod, setExecutionMethod] = useState<'webcontainer' | 'server' | 'static' | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [performanceMode, setPerformanceMode] = useState(false);

  const webContainerRef = useRef<unknown>(null);
  const fallbackServiceRef = useRef<ServerFallbackService>(new ServerFallbackService());
  const webContainerManagerRef = useRef<WebContainerManager>(new WebContainerManager());
  const terminalRef = useRef<HTMLDivElement>(null);

  // Performance monitoring
  useEffect(() => {
    const checkPerformance = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const isSlowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
        const isLowEndDevice = navigator.hardwareConcurrency < 4 || (navigator as any).deviceMemory < 4;
        
        setPerformanceMode(isSlowConnection || isLowEndDevice);
      }
    };

    checkPerformance();
    
    // Listen for connection changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addTerminalOutput = useCallback((output: string) => {
    setTerminalOutput(prev => {
      const newOutput = [...prev, `[${new Date().toLocaleTimeString()}] ${output}`];
      // Limit terminal output to prevent memory issues
      return newOutput.slice(-50);
    });
    
    // Auto-scroll terminal
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const primaryAction = useCallback(async (): Promise<FallbackResult> => {
    try {
      // Initialize WebContainer
      const containerInstance = await webContainerManagerRef.current.initialize();
      addTerminalOutput('✅ WebContainer initialized successfully');
      
      // Set up code in container
      await setupCodeInContainer(containerInstance, code);
      
      // Start development server
      const serverUrl = await startDevelopmentServer(containerInstance);
      
      return {
        success: true,
        url: serverUrl,
        method: 'webcontainer' as const,
      };
    } catch (_error) {
      throw error;
    }
  }, [code, addTerminalOutput]);

  const executeCodeWithFallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPreviewUrl(null);
    setExecutionMethod(null);
    
    addTerminalOutput('🚀 Starting code execution...');

    try {
      const result = await fallbackServiceRef.current.executeWithFallback(
        primaryAction,
        code,
        projectType
      );

      if (result.success) {
        setPreviewUrl(result.url || null);
        setIsRunning(true);
        setExecutionMethod(result.method);
        addTerminalOutput(`✅ Code executed successfully using ${result.method} method`);
        
        if (result.method !== 'webcontainer') {
          addTerminalOutput(`ℹ️ WebContainer unavailable, using ${result.method} fallback for compatibility`);
        }
      } else {
        throw new Error(result.error || 'Execution failed');
      }
    } catch (_error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Code execution failed:', error);
      setError(error instanceof Error ? error.message : 'Execution failed');
      addTerminalOutput(`❌ Execution failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [code, projectType, addTerminalOutput, primaryAction]);

  const setupCodeInContainer = useCallback(async (containerInstance: unknown, codeContent: string) => {
    addTerminalOutput('📄 Setting up code in WebContainer...');

    const isHTML = codeContent.includes('<!DOCTYPE html>') || codeContent.includes('<html');
    const isReact = codeContent.includes('import React') || codeContent.includes('from "react"');

    if (isHTML) {
      await setupHTMLProject(containerInstance, codeContent);
    } else if (isReact) {
      await setupReactProject(containerInstance, codeContent);
    } else {
      await setupGenericProject(containerInstance, codeContent);
    }
  }, [addTerminalOutput]);

  const setupHTMLProject = useCallback(async (containerInstance: unknown, htmlCode: string) => {
    const files = {
      'index.html': { file: { contents: htmlCode } },
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'webcontainer-app',
            type: 'module',
            scripts: {
              dev: 'npx serve . -p 3000',
              start: 'npx serve . -p 3000',
            },
            dependencies: {
              serve: 'latest',
            },
          }, null, 2),
        },
      },
    };

    await (containerInstance as { mount: (files: unknown) => Promise<void> }).mount(files);
    addTerminalOutput('📦 HTML project files created');
  }, [addTerminalOutput]);

  const setupReactProject = useCallback(async (containerInstance: unknown, reactCode: string) => {
    const files = {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'react-app',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0',
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.0.0',
              vite: '^4.4.5',
            },
          }, null, 2),
        },
      },
      'vite.config.js': {
        file: {
          contents: `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})
          `.trim(),
        },
      },
      'index.html': {
        file: {
          contents: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
          `.trim(),
        },
      },
      'src/main.jsx': {
        file: {
          contents: `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
          `.trim(),
        },
      },
      'src/App.jsx': {
        file: { contents: reactCode },
      },
    };

    await (containerInstance as { mount: (files: unknown) => Promise<void> }).mount(files);
    addTerminalOutput('📦 React project files created');
  }, [addTerminalOutput]);

  const setupGenericProject = useCallback(async (containerInstance: unknown, codeContent: string) => {
    const files = {
      'index.js': { file: { contents: codeContent } },
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'generic-app',
            type: 'module',
            scripts: {
              dev: 'node index.js',
              start: 'node index.js',
            },
          }, null, 2),
        },
      },
    };

    await (containerInstance as { mount: (files: unknown) => Promise<void> }).mount(files);
    addTerminalOutput('📦 Generic project files created');
  }, [addTerminalOutput]);

  const startDevelopmentServer = useCallback(async (containerInstance: unknown): Promise<string> => {
    addTerminalOutput('🚀 Starting development server...');

    return new Promise((resolve, reject) => {
      let serverStartTimeout: NodeJS.Timeout;

      const startServer = async () => {
        try {
          const devProcess = await (containerInstance as { spawn: (cmd: string, args: string[]) => Promise<{ output: { pipeTo: (stream: WritableStream) => void }, exit: Promise<number> }> }).spawn('npm', ['run', 'dev']);

          devProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                const output = data.toString();
                addTerminalOutput(output);

                // Check for server start patterns
                if (
                  output.includes('Local:') ||
                  output.includes('running at') ||
                  output.includes('ready in') ||
                  output.includes('http://localhost')
                ) {
                  const urlMatch = output.match(/https?:\/\/[^\s]+/);
                  if (urlMatch) {
                    clearTimeout(serverStartTimeout);
                    resolve(urlMatch[0]);
                  }
                }
              },
            })
          );

          // Set up timeout for server start
          serverStartTimeout = setTimeout(() => {
            const fallbackUrl = 'http://localhost:3000';
            addTerminalOutput(`⚠️ Server start timeout - using fallback URL: ${fallbackUrl}`);
            resolve(fallbackUrl);
          }, 15000);

          // Listen for the server-ready event
          containerInstance.on('server-ready', (port: number, url: string) => {
            clearTimeout(serverStartTimeout);
            resolve(url);
          });

          // Monitor process exit
          devProcess.exit.then((exitCode: number) => {
            if (exitCode !== 0) {
              clearTimeout(serverStartTimeout);
              reject(new Error(`Dev server exited with code ${exitCode}`));
            }
          });
        } catch (_error) {
          clearTimeout(serverStartTimeout);
          reject(error);
        }
      };

      startServer();
    });
  }, [addTerminalOutput]);

  const stopExecution = useCallback(() => {
    setIsRunning(false);
    setPreviewUrl(null);
    setExecutionMethod(null);
    addTerminalOutput('🛑 Execution stopped');
    
    // Clean up WebContainer if needed
    if (webContainerRef.current) {
      webContainerManagerRef.current.teardown();
    }
  }, [addTerminalOutput]);

  const refreshExecution = useCallback(() => {
    stopExecution();
    setTimeout(() => {
      executeCodeWithFallback();
    }, 500);
  }, [stopExecution, executeCodeWithFallback]);

  const getStatusIcon = () => {
    if (isLoading) return <Loader className="h-4 w-4 animate-spin" />;
    if (error) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (isRunning) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Play className="h-4 w-4" />;
  };

  const getExecutionMethodInfo = () => {
    switch (executionMethod) {
      case 'webcontainer':
        return { icon: <Code2 className="h-4 w-4 text-blue-500" />, label: 'WebContainer', color: 'text-blue-500' };
      case 'server':
        return { icon: <Zap className="h-4 w-4 text-green-500" />, label: 'Server Fallback', color: 'text-green-500' };
      case 'static':
        return { icon: <FileText className="h-4 w-4 text-yellow-500" />, label: 'Static Preview', color: 'text-yellow-500' };
      default:
        return null;
    }
  };

  return (
    <div className={`flex h-full flex-col bg-[#0D0D10] ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center gap-2 border-b border-white/10 p-4">
        <button
          onClick={executeCodeWithFallback}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-deep-violet px-4 py-2 text-sm font-medium text-white transition-all hover:bg-deep-violet/80 disabled:opacity-50"
        >
          {getStatusIcon()}
          {isLoading ? 'Executing...' : 'Run Code'}
        </button>

        {isRunning && (
          <button
            onClick={stopExecution}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-700"
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
        )}

        <button
          onClick={refreshExecution}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-600 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

        {/* Status indicators */}
        <div className="ml-auto flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1 text-sm text-red-500">
              <WifiOff className="h-4 w-4" />
              Offline
            </div>
          )}
          
          {performanceMode && (
            <div className="flex items-center gap-1 text-sm text-yellow-500">
              <Zap className="h-4 w-4" />
              Performance Mode
            </div>
          )}

          {executionMethod && (
            <div className={`flex items-center gap-1 text-sm ${getExecutionMethodInfo()?.color}`}>
              {getExecutionMethodInfo()?.icon}
              {getExecutionMethodInfo()?.label}
            </div>
          )}

          <div className={`flex items-center gap-1 text-sm ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Preview Panel */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center bg-red-500/10"
              >
                <div className="text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                  <h3 className="mt-4 text-lg font-semibold text-red-500">Execution Failed</h3>
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                  <button
                    onClick={refreshExecution}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {!error && !previewUrl && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center bg-gray-900/50"
              >
                <div className="text-center">
                  <Code2 className="mx-auto h-12 w-12 text-gray-500" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-300">Ready to Execute</h3>
                  <p className="mt-2 text-sm text-gray-500">Click "Run Code" to see your application in action</p>
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center bg-blue-500/10"
              >
                <div className="text-center">
                  <Loader className="mx-auto h-12 w-12 animate-spin text-blue-500" />
                  <h3 className="mt-4 text-lg font-semibold text-blue-500">Executing Code</h3>
                  <p className="mt-2 text-sm text-blue-400">
                    {performanceMode ? 'Optimizing for your device...' : 'Setting up your application...'}
                  </p>
                </div>
              </motion.div>
            )}

            {previewUrl && (
              <motion.iframe
                key={previewUrl}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={previewUrl}
                className="h-full w-full border-none bg-white"
                title="Application Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-downloads"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Terminal Panel */}
        <div className="w-1/3 border-l border-white/10">
          <div className="flex items-center gap-2 border-b border-white/10 p-3">
            <Terminal className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Terminal Output</span>
            <button
              onClick={() => setTerminalOutput([])}
              className="ml-auto text-xs text-gray-500 hover:text-gray-300"
            >
              Clear
            </button>
          </div>
          <div
            ref={terminalRef}
            className="h-full overflow-y-auto bg-black/50 p-3 font-mono text-xs text-gray-300"
          >
            {terminalOutput.length === 0 ? (
              <div className="text-gray-500">No output yet...</div>
            ) : (
              terminalOutput.map((line, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap break-words">
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 