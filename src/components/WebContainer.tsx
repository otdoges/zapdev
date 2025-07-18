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
  CheckCircle
} from "lucide-react";
import { WebContainer } from '@webcontainer/api';

interface WebContainerProps {
  code?: string;
  language?: string;
  isRunning?: boolean;
}

const WebContainerComponent = ({ code, language = "html", isRunning = false }: WebContainerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"idle" | "running" | "error" | "success">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Initialize WebContainer instance
  useEffect(() => {
    const initWebContainer = async () => {
      try {
        const webcontainer = await WebContainer.boot();
        setWebcontainerInstance(webcontainer);
        
        // Listen for server-ready event
        webcontainer.on('server-ready', (port, url) => {
          setPreviewUrl(url);
          if (iframeRef.current) {
            iframeRef.current.src = url;
          }
          setStatus("success");
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Failed to initialize WebContainer:', error);
        setStatus("error");
        setIsLoading(false);
      }
    };

    initWebContainer();
  }, []);

  // Parse code to extract HTML, CSS, and JS
  const parseCode = (codeString: string) => {
    const htmlMatch = codeString.match(/```html\n([\s\S]*?)```/);
    const cssMatch = codeString.match(/```css\n([\s\S]*?)```/);
    const jsMatch = codeString.match(/```(?:javascript|js)\n([\s\S]*?)```/);
    
    const html = htmlMatch ? htmlMatch[1] : codeString.includes('<html') ? codeString : `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        ${codeString}
        <script src="script.js"></script>
      </body>
      </html>
    `;
    
    const css = cssMatch ? cssMatch[1] : `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
        background: #f8fafc;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
    `;
    
    const js = jsMatch ? jsMatch[1] : `
      console.log('Welcome to zapdev preview!');
    `;
    
    return { html, css, js };
  };

  const runCode = useCallback(async () => {
    if (!webcontainerInstance || !code) return;
    
    setIsLoading(true);
    setStatus("running");
    
    try {
      const { html, css, js } = parseCode(code);
      
      // Create project files
      const files = {
        'index.html': {
          file: {
            contents: html,
          },
        },
        'style.css': {
          file: {
            contents: css,
          },
        },
        'script.js': {
          file: {
            contents: js,
          },
        },
        'package.json': {
          file: {
            contents: JSON.stringify({
              name: "zapdev-preview",
              version: "1.0.0",
              scripts: {
                dev: "python -m http.server 3000",
                start: "python -m http.server 3000"
              }
            }, null, 2),
          },
        },
      };

      // Mount the files
      await webcontainerInstance.mount(files);
      
      // Start the dev server
      const serverProcess = await webcontainerInstance.spawn('python', ['-m', 'http.server', '3000']);
      
      // Handle server output
      serverProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('Server output:', data);
        },
      }));
      
    } catch (error) {
      console.error('Error running code:', error);
      setStatus("error");
      setIsLoading(false);
    }
  }, [webcontainerInstance, code]);

  const stopCode = () => {
    setStatus("idle");
    setPreviewUrl("");
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

  const getStatusColor = () => {
    switch (status) {
      case "running":
        return "bg-yellow-500/20 text-yellow-400";
      case "success":
        return "bg-green-500/20 text-green-400";
      case "error":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case "success":
        return <CheckCircle className="w-3 h-3" />;
      case "error":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={`${getStatusColor()} border-0`}>
            {getStatusIcon()}
            <span className="ml-1 capitalize">{status}</span>
          </Badge>
          <span className="text-xs text-gray-400">
            {language.toUpperCase()}
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
            disabled={status !== "success"}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={openInNewTab}
            disabled={status !== "success"}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Open
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 bg-white">
        {status === "idle" ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Play className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Ready to Preview</p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Run" to see your application
              </p>
            </div>
          </div>
        ) : status === "running" ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium text-gray-700">Building...</p>
              <p className="text-sm text-gray-500 mt-2">
                Setting up your development environment
              </p>
            </div>
          </div>
        ) : status === "error" ? (
          <div className="h-full flex items-center justify-center text-red-500">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Build Failed</p>
              <p className="text-sm text-gray-400 mt-2">
                There was an error building your application
              </p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
};

export default WebContainerComponent;