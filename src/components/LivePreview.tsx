import { useState, useEffect, useRef } from 'react';
import { sanitizeCode, sanitizeOutput } from '../utils/text-sanitizer';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  Tablet,
  Code2,
  Terminal,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface LivePreviewProps {
  code: string;
  language: string;
  isVisible: boolean;
  executionResult?: {
    success: boolean;
    output?: string;
    error?: string;
    logs: string[];
    executionTime?: number;
  };
  onExecute?: () => void;
  isExecuting?: boolean;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';
type PreviewMode = 'preview' | 'code' | 'output';

export function LivePreview({ 
  code, 
  language, 
  isVisible, 
  executionResult, 
  onExecute, 
  isExecuting = false 
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('preview');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const blobUrlsRef = useRef<string[]>([]);

  // Sanitize HTML to prevent XSS attacks
  const sanitizeHtml = (htmlCode: string): string => {
    return DOMPurify.sanitize(htmlCode, {
      ALLOWED_TAGS: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'img', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'form', 'input', 'button', 'textarea', 'select', 'option',
        'nav', 'header', 'footer', 'section', 'article', 'aside',
        'strong', 'em', 'i', 'b', 'u', 'br', 'hr'
      ],
      ALLOWED_ATTR: [
        'class', 'id', 'style', 'href', 'src', 'alt', 'title',
        'type', 'value', 'placeholder', 'name', 'for', 'data-*'
      ],
      ALLOW_DATA_ATTR: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'applet', 'meta', 'link'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
    });
  };

  // Create a secure blob URL for HTML preview to avoid same-origin security issues
  const createSecurePreviewUrl = (htmlCode: string): string => {
    // Clean up previous URL if it exists
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      const index = blobUrlsRef.current.indexOf(currentPreviewUrl);
      if (index > -1) {
        blobUrlsRef.current.splice(index, 1);
      }
    }
    
    // Strict CSP header without unsafe-inline and other security improvements
    const secureHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; media-src 'none'; script-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'">
  <title>Live Preview</title>
</head>
<body>
${sanitizeHtml(htmlCode)}
</body>
</html>`;
    
    const blob = new Blob([secureHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Track the URL for cleanup
    blobUrlsRef.current.push(url);
    setCurrentPreviewUrl(url);
    
    return url;
  };

  const getViewModeStyles = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  const getLanguageIcon = () => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">JS</div>;
      case 'typescript':
      case 'ts':
        return <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">TS</div>;
      case 'python':
      case 'py':
        return <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-green-500 rounded flex items-center justify-center text-white text-xs font-bold">PY</div>;
      case 'html':
        return <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded flex items-center justify-center text-white text-xs font-bold">H</div>;
      default:
        return <Code2 className="w-4 h-4 text-gray-500" />;
    }
  };

  // Update preview URL when code changes
  useEffect(() => {
    const isHtml = (language || '').toLowerCase() === 'html' || code.includes('<html');
    if (isHtml && code.trim()) {
      createSecurePreviewUrl(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language]);
  
  // Auto-execute on code change if enabled
  useEffect(() => {
    if (autoRefresh && code.trim() && onExecute) {
      const timer = setTimeout(onExecute, 1000); // Debounce execution
      return () => clearTimeout(timer);
    }
  }, [code, autoRefresh, onExecute]);

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up all tracked blob URLs
      blobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current = [];
      setCurrentPreviewUrl(null);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className={`h-full flex flex-col bg-gradient-to-br from-slate-900 to-blue-950 border-l border-gray-800 ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      <Card className="h-full border-0 bg-transparent">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-blue-200/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: isExecuting ? 360 : 0,
                  scale: isExecuting ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: isExecuting ? Infinity : 0, ease: "linear" },
                  scale: { duration: 1, repeat: isExecuting ? Infinity : 0, ease: "easeInOut" }
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-sm opacity-30 animate-pulse" />
                <Zap className="relative w-5 h-5 text-blue-400" />
              </motion.div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">
                  Live Preview
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="flex items-center gap-1 bg-blue-900/50 text-blue-300">
                    {getLanguageIcon()}
                    {language.toUpperCase()}
                  </Badge>
                  {isExecuting && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1"
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-green-400 font-medium">Running...</span>
                    </motion.div>
                  )}
                  {executionResult && (
                    <Badge 
                      variant="outline" 
                      className={`flex items-center gap-1 ${
                        executionResult.success 
                          ? 'border-green-500 text-green-400 bg-green-950/50'
                          : 'border-red-500 text-red-400 bg-red-950/50'
                      }`}
                    >
                      {executionResult.success ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {executionResult.success ? 'Success' : 'Error'}
                      {executionResult.executionTime && (
                        <span className="ml-1">{executionResult.executionTime}ms</span>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Controls */}
              <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('desktop')}
                  className="h-6 w-6 p-0"
                >
                  <Monitor className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'tablet' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('tablet')}
                  className="h-6 w-6 p-0"
                >
                  <Tablet className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('mobile')}
                  className="h-6 w-6 p-0"
                >
                  <Smartphone className="w-3 h-3" />
                </Button>
              </div>

              {/* Control Buttons */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-8 px-2"
              >
                {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              
              {onExecute && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onExecute}
                  disabled={isExecuting}
                  className="h-8 px-2"
                >
                  {isExecuting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RotateCcw className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 px-2"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <CardContent className="flex-1 p-0">
                <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as PreviewMode)} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border-b border-gray-700">
                    <TabsTrigger value="preview" className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="gap-2">
                      <Code2 className="w-4 h-4" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="output" className="gap-2">
                      <Terminal className="w-4 h-4" />
                      Output
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="flex-1 p-4">
                    <div className={`h-full ${getViewModeStyles()} transition-all duration-300`}>
                      <div className="bg-white rounded-lg h-full overflow-hidden shadow-2xl">
                        {(language.toLowerCase() === 'html' || code.includes('<html')) && currentPreviewUrl ? (
                          <iframe
                            src={currentPreviewUrl}
                            className="w-full h-full border-0"
                            title="Live Preview"
                            sandbox="allow-same-origin"
                          />
                        ) : language.toLowerCase().includes('javascript') ? (
                          <div className="p-4 h-full flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 text-sm">
                                JavaScript code ready to execute
                              </p>
                              <p className="text-gray-500 text-xs mt-2">
                                Click the play button to run the code
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 h-full flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <Terminal className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 text-sm">
                                {language} code preview
                              </p>
                              <p className="text-gray-500 text-xs mt-2">
                                Check the Output tab for execution results
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="flex-1">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        <pre className="text-sm font-mono text-gray-300 bg-gray-900 p-4 rounded-lg overflow-x-auto">
                          <code>{sanitizeCode(code, '// No code to display')}</code>
                        </pre>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="output" className="flex-1">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        {executionResult ? (
                          <>
                            <div className={`p-3 rounded-lg border ${
                              executionResult.success 
                                ? 'bg-green-950/20 border-green-800 text-green-100'
                                : 'bg-red-950/20 border-red-800 text-red-100'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                {executionResult.success ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span className="font-medium">
                                  {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                                </span>
                                {executionResult.executionTime && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {executionResult.executionTime}ms
                                  </div>
                                )}
                              </div>
                              
                              {executionResult.output && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2 text-gray-300">Output:</h4>
                                  <pre className="text-xs font-mono bg-black/20 p-3 rounded border overflow-x-auto">
                                    {sanitizeOutput(executionResult.output, 'No output')}
                                  </pre>
                                </div>
                              )}
                              
                              {executionResult.error && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-medium mb-2 text-red-300">Error:</h4>
                                  <pre className="text-xs font-mono bg-black/20 p-3 rounded border overflow-x-auto text-red-200">
                                    {sanitizeOutput(executionResult.error, 'No error details')}
                                  </pre>
                                </div>
                              )}
                              
                              {executionResult.logs.length > 0 && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-medium mb-2 text-gray-300">Logs:</h4>
                                  <div className="space-y-1">
                                    {executionResult.logs.map((log, index) => (
                                      <pre key={index} className="text-xs font-mono bg-black/20 p-2 rounded border overflow-x-auto">
                                        {sanitizeOutput(log, 'Empty log entry')}
                                      </pre>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Terminal className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No execution results yet</p>
                            <p className="text-xs mt-1">Run the code to see output here</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}