import { useEffect, useRef, useState } from "react";
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

interface WebContainerProps {
  code?: string;
  language?: string;
  isRunning?: boolean;
}

const WebContainer = ({ code, language = "html", isRunning = false }: WebContainerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"idle" | "running" | "error" | "success">("idle");
  const [isLoading, setIsLoading] = useState(false);

  // Simulate WebContainer functionality
  const runCode = async () => {
    setIsLoading(true);
    setStatus("running");
    
    // Simulate build process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (code) {
      // Create a blob URL for the HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <style>
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
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .title {
              font-size: 2.5rem;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 16px;
            }
            .subtitle {
              font-size: 1.125rem;
              color: #6b7280;
              margin-bottom: 32px;
            }
            .button {
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            }
            .button:hover {
              background: #2563eb;
              transform: translateY(-1px);
            }
            .features {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 24px;
              margin-top: 40px;
            }
            .feature {
              padding: 24px;
              background: #f8fafc;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .feature-title {
              font-size: 1.25rem;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 8px;
            }
            .feature-desc {
              color: #6b7280;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">Welcome to zapdev</h1>
              <p class="subtitle">AI-powered web development made simple</p>
              <button class="button">Get Started</button>
            </div>
            
            <div class="features">
              <div class="feature">
                <h3 class="feature-title">AI-Powered</h3>
                <p class="feature-desc">Generate complete web applications using advanced AI models</p>
              </div>
              <div class="feature">
                <h3 class="feature-title">Real-time Preview</h3>
                <p class="feature-desc">See your changes instantly with our live preview system</p>
              </div>
              <div class="feature">
                <h3 class="feature-title">Export Ready</h3>
                <p class="feature-desc">Download production-ready code for your projects</p>
              </div>
            </div>
          </div>
          
          <script>
            document.querySelector('.button').addEventListener('click', function() {
              this.textContent = 'Building...';
              this.style.background = '#10b981';
              setTimeout(() => {
                this.textContent = 'Ready to Deploy!';
              }, 1000);
            });
          </script>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      if (iframeRef.current) {
        iframeRef.current.src = url;
      }
      
      setStatus("success");
    } else {
      setStatus("error");
    }
    
    setIsLoading(false);
  };

  const stopCode = () => {
    setStatus("idle");
    if (iframeRef.current) {
      iframeRef.current.src = "about:blank";
    }
  };

  const refreshCode = () => {
    if (status === "success") {
      runCode();
    }
  };

  useEffect(() => {
    if (isRunning && code) {
      runCode();
    }
  }, [isRunning, code]);

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

export default WebContainer;