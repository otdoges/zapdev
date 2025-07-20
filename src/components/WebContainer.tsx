/**
 * WebContainer Component
 * 
 * This component provides a browser-based runtime for executing Next.js applications.
 * 
 * REQUIREMENTS:
 * 1. Cross-Origin Isolation Headers (configured in vite.config.ts and vercel.json):
 *    - Cross-Origin-Embedder-Policy: require-corp
 *    - Cross-Origin-Opener-Policy: same-origin
 * 
 * 2. Browser Support:
 *    - Chrome/Chromium (recommended)
 *    - Safari 16.4+ 
 *    - Firefox with experimental features
 * 
 * 3. Dependencies:
 *    - @webcontainer/api v1.6.1+
 * 
 * 4. Secure Context:
 *    - Must be served over HTTPS in production
 *    - SharedArrayBuffer must be available
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Square, 
  RotateCcw, 
  ExternalLink, 
  Loader2,
  AlertCircle,
  Terminal,
  Folder
} from "lucide-react";
import { WebContainer } from '@webcontainer/api';

// Import extracted utilities and types
import { WebContainerProps, WebContainerStatus } from "@/types/webcontainer";
import { checkBrowserCompatibility } from "@/utils/webcontainer-compatibility";
import { parseCodeToNextJSProject } from "@/utils/nextjs-project-generator";
import { getStatusColor, getStatusIcon, getStatusText } from "@/utils/webcontainer-status";

const WebContainerComponent = ({ code, language = "nextjs", isRunning = false }: WebContainerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<WebContainerStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Initialize WebContainer instance
  useEffect(() => {
    const initWebContainer = async () => {
      try {
        // Check browser compatibility first
        const compatibility = checkBrowserCompatibility();
        if (!compatibility.compatible) {
          setStatus("error");
          setIsLoading(false);
          setShowLogs(true);
          addLog(`Browser Compatibility Error: ${compatibility.reason}`);
          return;
        }

        addLog("Browser compatibility check passed");
        addLog("Initializing WebContainer...");
        
        const webcontainer = await WebContainer.boot();
        setWebcontainerInstance(webcontainer);
        
        addLog("WebContainer initialized successfully");
        
        // Listen for server-ready event
        webcontainer.on('server-ready', (port, url) => {
          addLog(`Server ready on port ${port}: ${url}`);
          setPreviewUrl(url);
          if (iframeRef.current) {
            iframeRef.current.src = url;
          }
          setStatus("success");
          setIsLoading(false);
        });

        // Listen for error events
        webcontainer.on('error', (error) => {
          addLog(`WebContainer error: ${error}`);
          setStatus("error");
          setIsLoading(false);
          setShowLogs(true);
        });
        
      } catch (error) {
        console.error('Failed to initialize WebContainer:', error);
        setStatus("error");
        setIsLoading(false);
        setShowLogs(true);
        addLog(`Error: Failed to initialize WebContainer - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initWebContainer();
  }, []);

  const addLog = (message: string) => {
    setBuildLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const runCode = useCallback(async () => {
    if (!webcontainerInstance || !code) return;
    
    setIsLoading(true);
    setStatus("installing");
    setBuildLogs([]);
    addLog("Starting Next.js project setup...");
    
    try {
      // Parse the code and create Next.js project structure
      const projectFiles = parseCodeToNextJSProject(code);
      addLog("Generated Next.js project structure");
      
      // Mount the files
      await webcontainerInstance.mount(projectFiles as any);
      addLog("Mounted project files");
      
      setStatus("installing");
      addLog("Installing dependencies...");
      
      // Install dependencies
      const installProcess = await webcontainerInstance.spawn('npm', ['install']);
      
      // Handle install output
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          addLog(`npm: ${data}`);
        },
      }));
      
      const installExitCode = await installProcess.exit;
      if (installExitCode !== 0) {
        throw new Error(`npm install failed with exit code ${installExitCode}`);
      }
      
      addLog("Dependencies installed successfully");
      setStatus("building");
      addLog("Starting development server...");
      
      // Start the Next.js development server
      const serverProcess = await webcontainerInstance.spawn('npm', ['run', 'dev']);
      
      // Handle server output
      serverProcess.output.pipeTo(new WritableStream({
        write(data) {
          addLog(`dev server: ${data}`);
          if (data.includes('Ready') || data.includes('compiled')) {
            setStatus("running");
          }
        },
      }));
      
    } catch (error) {
      console.error('Error running code:', error);
      setStatus("error");
      setIsLoading(false);
      addLog(`Error: ${error}`);
    }
  }, [webcontainerInstance, code]);

  const stopCode = async () => {
    if (webcontainerInstance) {
      try {
        await webcontainerInstance.spawn('pkill', ['-f', 'next']);
      } catch (error) {
        console.log('Error stopping processes:', error);
      }
    }
    
    setStatus("idle");
    setPreviewUrl("");
    setBuildLogs([]);
    if (iframeRef.current) {
      iframeRef.current.src = "about:blank";
    }
  };

  const refreshCode = () => {
    if (status === "success") {
      runCode();
    }
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  useEffect(() => {
    if (isRunning && code) {
      runCode();
    }
  }, [isRunning, code, runCode]);

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={`${getStatusColor(status)} border-0`}>
            {getStatusIcon(status)}
            <span className="ml-1">{getStatusText(status)}</span>
          </Badge>
          <span className="text-xs text-gray-400">
            Next.js
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={runCode}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Play className="w-3 h-3 mr-1" />
            Run
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={stopCode}
            disabled={status === "idle"}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Square className="w-3 h-3 mr-1" />
            Stop
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCode}
            disabled={status !== "success" && status !== "running"}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Terminal className="w-3 h-3 mr-1" />
            Logs
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={openInNewTab}
            disabled={status !== "success" && status !== "running"}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Open
          </Button>
        </div>
      </div>

      {/* Logs Panel */}
      {showLogs && (
        <div className="h-32 bg-gray-900 border-b border-gray-700 overflow-auto">
          <div className="p-3 text-xs font-mono text-gray-300">
            {buildLogs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
            {buildLogs.length === 0 && (
              <div className="text-gray-500">No logs yet...</div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="flex-1 bg-white">
        {status === "idle" ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Folder className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Ready to Build</p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Run" to create your Next.js application
              </p>
            </div>
          </div>
        ) : (["installing", "building", "running"].includes(status)) ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium text-gray-700">
                {status === "installing" && "Installing Dependencies..."}
                {status === "building" && "Building Application..."}
                {status === "running" && "Starting Server..."}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few moments
              </p>
            </div>
          </div>
        ) : status === "error" ? (
          <div className="h-full flex items-center justify-center text-red-500">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Build Failed</p>
              <p className="text-sm text-gray-400 mt-2">
                Check the logs for more details
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(true)}
                className="mt-4"
              >
                <Terminal className="w-4 h-4 mr-2" />
                Show Logs
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Next.js Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        )}
      </div>
    </div>
  );
};

export default WebContainerComponent;