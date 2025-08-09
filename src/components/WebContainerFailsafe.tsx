import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Play,
  Square,
  RotateCcw,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Terminal,
  FileText,
  Folder,
  Code2,
  Zap,
  Download,
  Copy,
  Check,
  Settings,
  Maximize,
  Minimize,
  RefreshCw,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

// WebContainer API types (dynamically imported)
interface WebContainerInstance {
  mount: (files: Record<string, ProjectFile>) => Promise<void>;
  spawn: (command: string, args?: string[]) => Promise<WebContainerProcess>;
  on: (event: string, callback: (port: number, url: string) => void) => void;
  fs: {
    readFile: (path: string, encoding?: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    readdir: (path: string) => Promise<string[]>;
    rm: (path: string, options?: { recursive?: boolean }) => Promise<void>;
    mkdir: (path: string) => Promise<void>;
  };
}

interface WebContainerProcess {
  output: ReadableStream;
  exit: Promise<number>;
  kill: () => void;
}

interface ProjectFile {
  file?: {
    contents: string;
  };
  directory?: {
    [key: string]: ProjectFile;
  };
}

interface WebContainerFailsafeProps {
  code: string;
  language: string;
  onFallback?: () => void;
  isVisible: boolean;
  autoRun?: boolean;
}

export const WebContainerFailsafe: React.FC<WebContainerFailsafeProps> = ({
  code,
  language,
  onFallback,
  isVisible,
  autoRun = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [webcontainer, setWebcontainer] = useState<WebContainerInstance | null>(null);
  const [status, setStatus] = useState<'idle' | 'booting' | 'mounting' | 'installing' | 'running' | 'error' | 'ready'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customCode, setCustomCode] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [currentProcess, setCurrentProcess] = useState<WebContainerProcess | null>(null);
  const [supportInfo, setSupportInfo] = useState({
    supported: false,
    reason: '',
    crossOriginIsolated: false,
    sharedArrayBufferSupported: false
  });
  const hasTriggeredAutoRunRef = useRef(false);

  // Check WebContainer support on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check cross-origin isolation
        const crossOriginIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
        
        // Check SharedArrayBuffer support
        const sharedArrayBufferSupported = typeof SharedArrayBuffer !== 'undefined';
        
        // Check if HTTPS (required for production)
        const isSecure = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
        
        const supported = crossOriginIsolated && sharedArrayBufferSupported && isSecure;
        let reason = '';
        
        if (!crossOriginIsolated) {
          reason = 'Cross-origin isolation not enabled. Add Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers.';
        } else if (!sharedArrayBufferSupported) {
          reason = 'SharedArrayBuffer not supported in this browser.';
        } else if (!isSecure) {
          reason = 'HTTPS required for WebContainer in production.';
        }
        
        setSupportInfo({
          supported,
          reason,
          crossOriginIsolated,
          sharedArrayBufferSupported
        });
        
        if (supported && isVisible) {
          await initializeWebContainer();
        }
      } catch (error) {
        console.error('Error checking WebContainer support:', error);
        setSupportInfo({
          supported: false,
          reason: `Error checking support: ${error}`,
          crossOriginIsolated: false,
          sharedArrayBufferSupported: false
        });
      }
    };

    checkSupport();
  }, [isVisible, initializeWebContainer]);

  // Auto-run when visible and supported
  useEffect(() => {
    if (!isVisible || !autoRun) return;
    if (!supportInfo.supported) return;
    if (hasTriggeredAutoRunRef.current && status !== 'idle') return;

    const run = async () => {
      try {
        hasTriggeredAutoRunRef.current = true;
        // Ensure booted
        if (!webcontainer) {
          await initializeWebContainer();
        }
        // Small delay to allow state to settle
        setTimeout(() => {
          void runProject();
        }, 150);
      } catch (e) {
        // no-op; errors handled downstream
      }
    };

    run();
    // re-run when code changes (new code => new preview)
    // reset flag to allow another auto run on new code
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, autoRun, supportInfo.supported, code, language]);

  // Trigger auto-run once webcontainer becomes available
  useEffect(() => {
    if (!isVisible || !autoRun) return;
    if (!supportInfo.supported) return;
    if (!webcontainer) return;
    if (status !== 'idle' && status !== 'error') return;
    if (hasTriggeredAutoRunRef.current) {
      // allow subsequent auto-run when code changes
      void runProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcontainer]);

  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setLogs(prev => [...prev, formattedMessage]);
  }, []);

  const initializeWebContainer = useCallback(async () => {
    if (!supportInfo.supported) {
      setError(supportInfo.reason);
      setStatus('error');
      return;
    }

    try {
      setStatus('booting');
      addLog('Initializing WebContainer...');
      
      // Dynamically import WebContainer to avoid SSR issues
      const { WebContainer } = await import('@webcontainer/api');
      
      const instance = await WebContainer.boot();
      setWebcontainer(instance);
      
      // Listen for server-ready event
      instance.on('server-ready', (port, url) => {
        setPreviewUrl(url);
        if (iframeRef.current) {
          iframeRef.current.src = url;
        }
        setStatus('ready');
        addLog(`Server ready at ${url}`, 'success');
      });
      
      addLog('WebContainer initialized successfully', 'success');
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      setError(`Failed to initialize WebContainer: ${error}`);
      setStatus('error');
      addLog(`Initialization failed: ${error}`, 'error');
      
      // Call fallback if provided
      if (onFallback) {
        onFallback();
      }
    }
  }, [supportInfo.supported, supportInfo.reason, addLog, onFallback]);

  const createProjectStructure = useCallback((codeInput: string, lang: string): { [key: string]: ProjectFile } => {
    const files: { [key: string]: ProjectFile } = {};
    
    if (lang.toLowerCase() === 'javascript' || lang.toLowerCase() === 'typescript') {
      // Create a Next.js project structure
      files['package.json'] = {
        file: {
          contents: JSON.stringify({
            name: 'zapdev-nextjs-failsafe',
            version: '0.1.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
              lint: 'next lint'
            },
            dependencies: {
              'next': '^14.0.0',
              'react': '^18.2.0',
              'react-dom': '^18.2.0',
              'typescript': '^5.0.0',
              '@types/node': '^20.0.0',
              '@types/react': '^18.2.0',
              '@types/react-dom': '^18.2.0'
            },
            devDependencies: {
              'eslint': '^8.0.0',
              'eslint-config-next': '^14.0.0'
            }
          }, null, 2)
        }
      };
      
      files['next.config.js'] = {
        file: {
          contents: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"]
    }
  }
}

module.exports = nextConfig`
        }
      };
      
      files['tsconfig.json'] = {
        file: {
          contents: JSON.stringify({
            compilerOptions: {
              target: "es5",
              lib: ["dom", "dom.iterable", "esnext"],
              allowJs: true,
              skipLibCheck: true,
              strict: true,
              noEmit: true,
              esModuleInterop: true,
              module: "esnext",
              moduleResolution: "bundler",
              resolveJsonModule: true,
              isolatedModules: true,
              jsx: "preserve",
              incremental: true,
              plugins: [{ name: "next" }],
              paths: { "@/*": ["./*"] }
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            exclude: ["node_modules"]
          }, null, 2)
        }
      };
      
      files['app'] = {
        directory: {
          'layout.tsx': {
            file: {
              contents: `import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ZapDev WebContainer Failsafe',
  description: 'Generated by ZapDev WebContainer failsafe',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`
            }
          },
          'page.tsx': {
            file: {
              contents: `'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">
            🚀 ZapDev WebContainer Failsafe
          </h1>
          <div className="bg-black/30 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Code Output:</h2>
            <pre className="text-green-400 font-mono text-sm overflow-x-auto">
              <code>{${JSON.stringify(codeInput)}}</code>
            </pre>
          </div>
          <div className="text-center">
            <p className="text-white/80 mb-4">
              This is running in a secure WebContainer environment as a failsafe for E2B.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg">
                ✅ Next.js Ready
              </div>
              <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg">
                ⚡ TypeScript Support
              </div>
              <div className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg">
                🔒 Secure Sandbox
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}`
            }
          },
          'globals.css': {
            file: {
              contents: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`
            }
          }
        }
      };
      
      files['tailwind.config.js'] = {
        file: {
          contents: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
        }
      };
    } else {
      // Create a simple HTML/JS project for other languages
      files['package.json'] = {
        file: {
          contents: JSON.stringify({
            name: 'zapdev-simple-failsafe',
            version: '1.0.0',
            scripts: {
              start: 'npx serve . -p 3000'
            },
            devDependencies: {
              'serve': '^14.0.0'
            }
          }, null, 2)
        }
      };
      
      files['index.html'] = {
        file: {
          contents: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZapDev WebContainer Failsafe</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 800px;
            width: 90%;
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .code-output {
            background: rgba(0, 0, 0, 0.3);
            padding: 1.5rem;
            border-radius: 10px;
            margin: 2rem 0;
            font-family: 'Courier New', monospace;
            text-align: left;
            overflow-x: auto;
        }
        .badges {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
            margin-top: 2rem;
        }
        .badge {
            background: rgba(255, 255, 255, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 25px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ZapDev WebContainer Failsafe</h1>
        <p>This is running in a secure WebContainer environment as a failsafe for E2B.</p>
        <div class="code-output">
            <h3>Your Code Output:</h3>
            <pre><code>${codeInput.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>
        <div class="badges">
            <div class="badge">✅ Secure Sandbox</div>
            <div class="badge">⚡ Fast Execution</div>
            <div class="badge">🔒 Isolated Environment</div>
        </div>
    </div>
</body>
</html>`
        }
      };
    }
    
    return files;
  }, []);

  const runProject = async () => {
    if (!webcontainer) {
      await initializeWebContainer();
      // will re-enter when webcontainer is set by effect
    }
    
    try {
      setStatus('mounting');
      setLogs([]);
      addLog('Creating project structure...');
      
      const projectFiles = createProjectStructure(customCode || code, language);
      
      // Mount the project files
      await webcontainer.mount(projectFiles);
      addLog('Project files mounted successfully', 'success');
      
      setStatus('installing');
      addLog('Installing dependencies...');
      
      // Install dependencies
      const installProcess = await webcontainer.spawn('npm', ['install']);
      setCurrentProcess(installProcess);
      
      // Stream install output
      const reader = installProcess.output.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const output = new TextDecoder().decode(value);
        addLog(`npm: ${output.trim()}`);
      }
      
      const installExitCode = await installProcess.exit;
      if (installExitCode !== 0) {
        throw new Error(`npm install failed with exit code ${installExitCode}`);
      }
      
      addLog('Dependencies installed successfully', 'success');
      
      // Start the development server
      setStatus('running');
      addLog('Starting development server...');
      
      const command = language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript' 
        ? ['run', 'dev'] 
        : ['start'];
      
      const serverProcess = await webcontainer.spawn('npm', command);
      setCurrentProcess(serverProcess);
      
      // Stream server output
      const serverReader = serverProcess.output.getReader();
      const streamOutput = async () => {
        while (true) {
          const { done, value } = await serverReader.read();
          if (done) break;
          
          const output = new TextDecoder().decode(value);
          addLog(`server: ${output.trim()}`);
        }
      };
      
      streamOutput();
      
    } catch (error) {
      console.error('Error running project:', error);
      setError(`Error running project: ${error}`);
      setStatus('error');
      addLog(`Error: ${error}`, 'error');
    }
  };

  const stopProject = async () => {
    if (currentProcess) {
      currentProcess.kill();
      setCurrentProcess(null);
    }
    
    setStatus('idle');
    setPreviewUrl('');
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
    addLog('Project stopped', 'info');
  };

  const refreshProject = () => {
    if (previewUrl && iframeRef.current) {
      iframeRef.current.src = previewUrl + '?refresh=' + Date.now();
      addLog('Preview refreshed', 'info');
    }
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    toast.success('Logs copied to clipboard!');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'booting':
      case 'mounting':
      case 'installing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'running':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ready':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'booting':
      case 'mounting':
      case 'installing':
      case 'running':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'ready':
        return <CheckCircle className="w-3 h-3" />;
      case 'error':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-orange-200 dark:border-orange-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: status === 'running' || status === 'installing' ? 360 : 0 }}
                transition={{ duration: 2, repeat: (status === 'running' || status === 'installing') ? Infinity : 0, ease: "linear" }}
              >
                <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </motion.div>
              <CardTitle className="text-lg font-semibold">WebContainer Failsafe</CardTitle>
              <Badge variant="outline" className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1 capitalize">{status}</span>
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Settings className="w-3 h-3" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>WebContainer Configuration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Custom Code:</label>
                      <Textarea
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        placeholder="Enter custom code to override default..."
                        className="mt-2"
                        rows={6}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Cross-Origin Isolated:</span>
                        <span className={`ml-2 ${supportInfo.crossOriginIsolated ? 'text-green-600' : 'text-red-600'}`}>
                          {supportInfo.crossOriginIsolated ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">SharedArrayBuffer:</span>
                        <span className={`ml-2 ${supportInfo.sharedArrayBufferSupported ? 'text-green-600' : 'text-red-600'}`}>
                          {supportInfo.sharedArrayBufferSupported ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>
                    </div>
                    {!supportInfo.supported && (
                      <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          <AlertTriangle className="w-4 h-4 inline mr-2" />
                          {supportInfo.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="gap-2"
              >
                {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
                {isFullscreen ? 'Minimize' : 'Fullscreen'}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={runProject}
                disabled={status === 'installing' || status === 'running' || !supportInfo.supported}
                className="gap-2"
              >
                <Play className="w-3 h-3" />
                Run Project
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={stopProject}
                disabled={status === 'idle'}
                className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Square className="w-3 h-3" />
                Stop
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={refreshProject}
                disabled={status !== 'ready'}
                className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={openInNewTab}
                disabled={status !== 'ready'}
                className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {previewUrl && `Running at: ${previewUrl}`}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" className="gap-2">
                <Zap className="w-3 h-3" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <Terminal className="w-3 h-3" />
                Logs ({logs.length})
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2">
                <FileText className="w-3 h-3" />
                Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="m-0">
              <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-96'} flex flex-col`}>
                {status === 'idle' ? (
                  <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="text-center">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                      <h3 className="text-lg font-medium mb-2">WebContainer Failsafe Ready</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This will run when E2B is unavailable
                      </p>
                      {!supportInfo.supported && (
                        <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg max-w-md mx-auto">
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <AlertTriangle className="w-4 h-4 inline mr-2" />
                            {supportInfo.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : status === 'error' ? (
                  <div className="flex-1 flex items-center justify-center bg-red-50 dark:bg-red-950">
                    <div className="text-center">
                      <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                      <h3 className="text-lg font-medium text-red-700 dark:text-red-300 mb-2">
                        Failsafe Error
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-400 max-w-md">
                        {error}
                      </p>
                    </div>
                  </div>
                ) : status === 'ready' && previewUrl ? (
                  <iframe
                    ref={iframeRef}
                    className="w-full flex-1 border-0"
                    title="WebContainer Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
                      <p className="text-lg font-medium capitalize">{status}...</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Setting up your secure environment
                      </p>
                    </div>
                  </div>
                )}
                
                {isFullscreen && (
                  <div className="absolute top-4 right-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsFullscreen(false)}
                      className="bg-black/20 border-white/20 text-white"
                    >
                      <Minimize className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="m-0">
              <div className="h-96 bg-gray-900 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-300">Console Output</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyLogs}
                    className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                </div>
                <ScrollArea className="h-80">
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs font-mono text-gray-300"
                      >
                        {log}
                      </motion.div>
                    ))}
                    {logs.length === 0 && (
                      <p className="text-sm text-gray-500">No logs yet...</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="files" className="m-0">
              <div className="h-96 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Folder className="w-4 h-4" />
                  <h4 className="font-medium">Project Structure</h4>
                </div>
                <div className="space-y-2">
                  {language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript' ? (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-3 h-3" />
                        package.json
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-3 h-3" />
                        next.config.js
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-3 h-3" />
                        tsconfig.json
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Folder className="w-3 h-3" />
                        app/
                      </div>
                      <div className="flex items-center gap-2 text-sm ml-4">
                        <FileText className="w-3 h-3" />
                        layout.tsx
                      </div>
                      <div className="flex items-center gap-2 text-sm ml-4">
                        <FileText className="w-3 h-3" />
                        page.tsx
                      </div>
                      <div className="flex items-center gap-2 text-sm ml-4">
                        <FileText className="w-3 h-3" />
                        globals.css
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-3 h-3" />
                        package.json
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-3 h-3" />
                        index.html
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WebContainerFailsafe;