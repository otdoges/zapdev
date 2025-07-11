'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
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
  Folder,
  File,
  Monitor,
  Download,
  ExternalLink,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';
import { cn } from '@/lib/utils';

interface WebContainerEnhancedProps {
  code: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  aiTeamInstructions?: string;
}

interface FileSystemTree {
  [key: string]: {
    file?: {
      contents: string;
    };
    directory?: FileSystemTree;
  };
}

interface ServerInfo {
  url: string;
  port: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
}

export default function WebContainerEnhanced({
  code,
  onCodeChange,
  className,
  aiTeamInstructions,
}: WebContainerEnhancedProps) {
  const [container, setContainer] = useState<WebContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [fileSystem, setFileSystem] = useState<FileSystemTree>({});
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const webcontainerInstance = useRef<WebContainer | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Initialize WebContainer with better error handling
  useEffect(() => {
    const initContainer = async () => {
      setIsLoading(true);
      setError(null);
      addTerminalOutput('🚀 Initializing WebContainer...');

      try {
        if (!WebContainer) {
          throw new Error('WebContainer API is not available in this browser');
        }

        const instance = await WebContainer.boot();
        webcontainerInstance.current = instance;
        setContainer(instance);
        
        addTerminalOutput('✅ WebContainer initialized successfully');
        
        // Setup code if provided
        if (code && code.trim()) {
          await setupProject(instance, code);
        } else if (aiTeamInstructions) {
          await setupFromInstructions(instance, aiTeamInstructions);
        }
        
        setIsLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        addTerminalOutput(`❌ Error: ${errorMessage}`);
        setIsLoading(false);
        errorLogger.error(ErrorCategory.AI_MODEL, 'WebContainer initialization failed:', error);
      }
    };

    initContainer();

    return () => {
      if (webcontainerInstance.current) {
        webcontainerInstance.current.teardown();
      }
    };
  }, []);

  // Handle code changes
  useEffect(() => {
    if (container && code && code.trim()) {
      setupProject(container, code);
    }
  }, [code, container]);

  const addTerminalOutput = useCallback((output: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalOutput(prev => [...prev, `[${timestamp}] ${output}`]);
  }, []);

  const setupProject = async (containerInstance: WebContainer, codeContent: string) => {
    try {
      addTerminalOutput('📦 Setting up project...');
      
      // Detect project type
      const isReact = codeContent.includes('import React') || codeContent.includes('from "react"');
      const isHTML = codeContent.includes('<!DOCTYPE html>') || codeContent.includes('<html');
      const isVue = codeContent.includes('vue') || codeContent.includes('<template>');
      const isNode = codeContent.includes('require(') || codeContent.includes('import ');

      let projectFiles: FileSystemTree = {};

      if (isReact) {
        projectFiles = await createReactProject(codeContent);
      } else if (isHTML) {
        projectFiles = await createHTMLProject(codeContent);
      } else if (isVue) {
        projectFiles = await createVueProject(codeContent);
      } else {
        projectFiles = await createNodeProject(codeContent);
      }

      await containerInstance.mount(projectFiles as any);
      setFileSystem(projectFiles);
      addTerminalOutput('✅ Project files created');

      await installDependencies(containerInstance);
      await startDevServer(containerInstance);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addTerminalOutput(`❌ Setup failed: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const createReactProject = async (codeContent: string): Promise<FileSystemTree> => {
    return {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'zapdev-app',
            type: 'module',
            scripts: {
              dev: 'vite --host 0.0.0.0 --port 3000',
              build: 'vite build',
              preview: 'vite preview --host 0.0.0.0 --port 3000'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.0.0',
              vite: '^4.4.0'
            }
          }, null, 2)
        }
      },
      'vite.config.js': {
        file: {
          contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
})`
        }
      },
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ZapDev App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`
        }
      },
      src: {
        directory: {
          'main.jsx': {
            file: {
              contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
            }
          },
          'App.jsx': {
            file: { contents: codeContent }
          }
        }
      }
    };
  };

  const createHTMLProject = async (codeContent: string): Promise<FileSystemTree> => {
    return {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'zapdev-html-app',
            scripts: {
              dev: 'npx serve . -l 3000',
              start: 'npx serve . -l 3000'
            },
            dependencies: {
              serve: 'latest'
            }
          }, null, 2)
        }
      },
      'index.html': {
        file: { contents: codeContent }
      }
    };
  };

  const createVueProject = async (codeContent: string): Promise<FileSystemTree> => {
    return {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'zapdev-vue-app',
            type: 'module',
            scripts: {
              dev: 'vite --host 0.0.0.0 --port 3000',
              build: 'vite build'
            },
            dependencies: {
              vue: '^3.3.0'
            },
            devDependencies: {
              '@vitejs/plugin-vue': '^4.0.0',
              vite: '^4.4.0'
            }
          }, null, 2)
        }
      },
      'vite.config.js': {
        file: {
          contents: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})`
        }
      },
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ZapDev Vue App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`
        }
      },
      src: {
        directory: {
          'main.js': {
            file: {
              contents: `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`
            }
          },
          'App.vue': {
            file: { contents: codeContent }
          }
        }
      }
    };
  };

  const createNodeProject = async (codeContent: string): Promise<FileSystemTree> => {
    return {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'zapdev-node-app',
            type: 'module',
            scripts: {
              dev: 'node index.js',
              start: 'node index.js'
            }
          }, null, 2)
        }
      },
      'index.js': {
        file: { contents: codeContent }
      }
    };
  };

  const setupFromInstructions = async (containerInstance: WebContainer, instructions: string) => {
    addTerminalOutput('🤖 Setting up project from AI instructions...');
    // This would integrate with the AI team coordinator
    // For now, create a basic React project
    const defaultCode = `import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🤖 AI Generated App</h1>
      <p>Built from instructions: {instructions.substring(0, 100)}...</p>
    </div>
  );
}

export default App;`;
    
    await setupProject(containerInstance, defaultCode);
  };

  const installDependencies = async (containerInstance: WebContainer) => {
    setIsInstalling(true);
    setInstallProgress(0);
    addTerminalOutput('📦 Installing dependencies...');

    try {
      const installProcess = await containerInstance.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            addTerminalOutput(data);
            // Simulate progress
            setInstallProgress(prev => Math.min(prev + 10, 90));
          }
        })
      );

      const exitCode = await installProcess.exit;
      
      if (exitCode !== 0) {
        throw new Error(`npm install failed with exit code ${exitCode}`);
      }

      setInstallProgress(100);
      addTerminalOutput('✅ Dependencies installed successfully');
    } catch (error) {
      addTerminalOutput(`❌ Installation failed: ${error}`);
      throw error;
    } finally {
      setIsInstalling(false);
    }
  };

  const startDevServer = async (containerInstance: WebContainer) => {
    addTerminalOutput('🚀 Starting development server...');
    
    try {
      setServerInfo({ url: '', port: 3000, status: 'starting' });
      
      const serverProcess = await containerInstance.spawn('npm', ['run', 'dev']);
      
      serverProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            addTerminalOutput(data);
            
            // Look for server ready indicators
            if (data.includes('Local:') || data.includes('localhost:3000') || data.includes('ready in')) {
              const url = 'http://localhost:3000';
              setServerInfo({ url, port: 3000, status: 'running' });
              addTerminalOutput(`✅ Server running at ${url}`);
            }
          }
        })
      );

      // Fallback: assume server is ready after 5 seconds
      setTimeout(() => {
        if (!serverInfo || serverInfo.status !== 'running') {
          const url = 'http://localhost:3000';
          setServerInfo({ url, port: 3000, status: 'running' });
          addTerminalOutput(`🔗 Server should be available at ${url}`);
        }
      }, 5000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addTerminalOutput(`❌ Server start failed: ${errorMessage}`);
      setServerInfo(prev => prev ? { ...prev, status: 'error' } : null);
      throw error;
    }
  };

  const refreshPreview = useCallback(() => {
    if (iframeRef.current && serverInfo?.url) {
      iframeRef.current.src = iframeRef.current.src;
      addTerminalOutput('🔄 Preview refreshed');
    }
  }, [serverInfo?.url]);

  const stopServer = useCallback(() => {
    setServerInfo(prev => prev ? { ...prev, status: 'stopped' } : null);
    addTerminalOutput('🛑 Development server stopped');
  }, []);

  const openInNewTab = useCallback(() => {
    if (serverInfo?.url) {
      window.open(serverInfo.url, '_blank');
    }
  }, [serverInfo?.url]);

  if (isLoading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex h-full items-center justify-center p-6">
          <div className="text-center space-y-4">
            <Loader className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Initializing WebContainer...</p>
              <p className="text-xs text-muted-foreground">Setting up development environment</p>
            </div>
            {terminalOutput.length > 0 && (
              <div className="max-w-md space-y-1">
                {terminalOutput.slice(-3).map((output, i) => (
                  <p key={i} className="text-xs text-muted-foreground truncate">
                    {output}
                  </p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex h-full items-center justify-center p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">Setup Failed</p>
              <p className="text-xs text-muted-foreground max-w-md">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-2 w-2 rounded-full',
              serverInfo?.status === 'running' ? 'bg-green-500' :
              serverInfo?.status === 'starting' ? 'bg-yellow-500 animate-pulse' :
              serverInfo?.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
            )} />
            <span className="text-sm font-medium">
              {serverInfo?.status === 'running' ? 'Running' :
               serverInfo?.status === 'starting' ? 'Starting...' :
               serverInfo?.status === 'error' ? 'Error' : 'Stopped'}
            </span>
          </div>
          {serverInfo?.url && (
            <Badge variant="secondary" className="text-xs">
              Port {serverInfo.port}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPreview}
            disabled={!serverInfo?.url}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openInNewTab}
            disabled={!serverInfo?.url}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={stopServer}
            disabled={serverInfo?.status !== 'running'}
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Installation Progress */}
      {isInstalling && (
        <div className="px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-3">
            <Loader className="h-4 w-4 animate-spin" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Installing dependencies</span>
                <span className="text-xs text-muted-foreground">{installProgress}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${installProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="preview" className="text-xs">
            <Monitor className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs">
            <Folder className="mr-2 h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="terminal" className="text-xs">
            <Terminal className="mr-2 h-4 w-4" />
            Terminal
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0">
          <TabsContent value="preview" className="h-full m-0 p-4">
            {serverInfo?.url ? (
              <iframe
                ref={iframeRef}
                src={serverInfo.url}
                className="w-full h-full border rounded-lg bg-white"
                title="Preview"
              />
            ) : (
              <div className="flex h-full items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center space-y-2">
                  <Monitor className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {serverInfo?.status === 'starting' ? 'Starting server...' : 'Preview will appear here'}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="h-full m-0 p-4">
            <ScrollArea className="h-full border rounded-lg">
              <div className="p-4 space-y-2">
                <FileTree tree={fileSystem} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="terminal" className="h-full m-0 p-4">
            <div className="h-full border rounded-lg bg-black text-green-400 font-mono text-sm overflow-hidden">
              <div className="p-2 border-b border-gray-700 bg-gray-900 text-white">
                <span className="text-xs">Terminal Output</span>
              </div>
              <ScrollArea className="h-full p-4" ref={terminalRef}>
                <div className="space-y-1">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-words text-xs">
                      {line}
                    </div>
                  ))}
                  {terminalOutput.length === 0 && (
                    <div className="text-gray-500 text-xs">Waiting for output...</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}

// File tree component
function FileTree({ tree, level = 0 }: { tree: FileSystemTree; level?: number }) {
  return (
    <div className={cn('space-y-1', level > 0 && 'ml-4')}>
      {Object.entries(tree).map(([name, item]) => {
        const isFile = 'file' in item;
        const Icon = isFile ? File : Folder;
        
        return (
          <div key={name} className="space-y-1">
            <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{name}</span>
              {isFile && (
                <Badge variant="outline" className="text-xs">
                  {item.file!.contents.length} chars
                </Badge>
              )}
            </div>
            {!isFile && item.directory && (
              <FileTree tree={item.directory} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}