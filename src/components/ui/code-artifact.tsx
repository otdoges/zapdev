import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Terminal,
  FileText,
  Image,
  BarChart,
  Sparkles,
  Code2,
  Zap,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  logs: string[];
  artifacts?: Array<{
    name: string;
    url: string;
    type: 'image' | 'file' | 'chart';
  }>;
  executionTime?: number;
  memoryUsage?: number;
}

interface CodeArtifactProps {
  code: string;
  language: string;
  title?: string;
  description?: string;
  onExecute: (code: string, language: string) => Promise<ExecutionResult>;
  autoRun?: boolean;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeArtifact({
  code,
  language,
  title = "Code Preview",
  description,
  onExecute,
  autoRun = false,
  showLineNumbers = true,
  className = ""
}: CodeArtifactProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (autoRun) {
      const t = setTimeout(() => {
        handleExecute();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [autoRun]);

  const handleExecute = async () => {
    setIsExecuting(true);
    setResult(null);

    try {
      const executionResult = await onExecute(code, language);
      setResult(executionResult);

      if (executionResult.success) {
        toast.success('Code executed successfully!');
        setActiveTab('output');
      } else {
        toast.error('Execution failed');
        setActiveTab('error');
      }
    } catch (error) {
      console.error('Execution error:', error);
      const errorMessage = String(error);
      toast.error('Code execution failed');

      setResult({
        success: false,
        error: errorMessage,
        logs: []
      });
      setActiveTab('error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageIcon = () => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return <div className="w-3 h-3 bg-yellow-400 rounded-full" />;
      case 'python':
        return <div className="w-3 h-3 bg-blue-400 rounded-full" />;
      case 'html':
        return <div className="w-3 h-3 bg-orange-400 rounded-full" />;
      case 'css':
        return <div className="w-3 h-3 bg-purple-400 rounded-full" />;
      case 'json':
        return <div className="w-3 h-3 bg-green-400 rounded-full" />;
      default:
        return <Code2 className="w-3 h-3" />;
    }
  };

  const getSyntaxHighlightClass = () => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return 'language-javascript';
      case 'python':
        return 'language-python';
      case 'html':
        return 'language-html';
      case 'css':
        return 'language-css';
      case 'json':
        return 'language-json';
      default:
        return 'language-plaintext';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full ${className}`}
    >
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: isExecuting ? 360 : 0,
                  scale: isExecuting ? 1.1 : 1
                }}
                transition={{
                  rotate: { duration: 1, repeat: isExecuting ? Infinity : 0, ease: "linear" },
                  scale: { duration: 0.2 }
                }}
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </motion.div>
              <div>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {title}
                </CardTitle>
                {description && (
                  <p className="text-sm text-gray-400 mt-1">{description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1 border-white/20 bg-white/5 text-xs">
                {getLanguageIcon()}
                {language}
              </Badge>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </Button>
              </div>

              <Button
                size="sm"
                onClick={handleExecute}
                disabled={isExecuting}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Run Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-white/10 bg-black/20">
              <TabsList className="grid w-full grid-cols-4 bg-transparent">
                <TabsTrigger
                  value="preview"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
                >
                  <Eye className="w-3 h-3 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="output"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
                  disabled={!result}
                >
                  <Terminal className="w-3 h-3 mr-2" />
                  Output
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
                  disabled={!result}
                >
                  <FileText className="w-3 h-3 mr-2" />
                  Logs
                </TabsTrigger>
                <TabsTrigger
                  value="error"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
                  disabled={!result?.error}
                >
                  <XCircle className="w-3 h-3 mr-2" />
                  Error
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Code Preview Tab */}
            <TabsContent value="preview" className="p-0">
              <div className="relative">
                <ScrollArea className={`transition-all duration-300 ${isExpanded ? 'max-h-[80vh]' : 'max-h-[60vh]'}`}>
                  <div className="bg-black/40 p-4">
                    <pre
                      ref={codeRef}
                      className={`text-sm leading-relaxed font-mono text-gray-300 ${getSyntaxHighlightClass()}`}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {showLineNumbers && (
                        <code className="block">
                          {code.split('\n').map((line, index) => (
                            <div key={index} className="table-row">
                              <span className="table-cell pr-4 text-right text-gray-600 select-none min-w-[3rem]">
                                {index + 1}
                              </span>
                              <span className="table-cell">{line}</span>
                            </div>
                          ))}
                        </code>
                      )}
                      {!showLineNumbers && (
                        <code>{code}</code>
                      )}
                    </pre>
                  </div>
                </ScrollArea>

                {/* Code overlay gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>
            </TabsContent>

            {/* Output Tab */}
            <TabsContent value="output" className="p-4">
              {result?.output ? (
                <ScrollArea className="max-h-[60vh]">
                  <div className="bg-black/20 rounded-lg p-4">
                    <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap">
                      {result.output}
                    </pre>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Terminal className="w-8 h-8 mx-auto mb-2" />
                  <p>No output available</p>
                </div>
              )}
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="p-4">
              {result?.logs && result.logs.length > 0 ? (
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-2">
                    {result.logs.map((log, index) => (
                      <div key={index} className="bg-black/20 rounded p-2">
                        <code className="text-xs font-mono text-gray-300">{log}</code>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <p>No logs available</p>
                </div>
              )}
            </TabsContent>

            {/* Error Tab */}
            <TabsContent value="error" className="p-4">
              {result?.error ? (
                <div className="bg-red-950/20 border border-red-800/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="font-medium text-red-400">Execution Error</span>
                  </div>
                  <ScrollArea className="max-h-[60vh]">
                    <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap">
                      {result.error}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No errors occurred</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Status Bar */}
          {result && (
            <div className="border-t border-white/10 bg-black/20 px-4 py-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {result.success ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                    <span>{result.success ? 'Success' : 'Failed'}</span>
                  </div>
                  {result.executionTime && (
                    <span>{result.executionTime}ms</span>
                  )}
                  {result.memoryUsage && (
                    <span>{result.memoryUsage}MB</span>
                  )}
                </div>

                {result.artifacts && result.artifacts.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span>{result.artifacts.length} artifact(s)</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
