import React, { useState, useEffect } from 'react';
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
  Shield,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import WebContainerFailsafe from './WebContainerFailsafe';

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

interface E2BCodeExecutionProps {
  code: string;
  language: string;
  onExecute: (code: string, language: string) => Promise<ExecutionResult>;
  showNextJsHint?: boolean;
  autoRun?: boolean;
}

export function E2BCodeExecution({ code, language, onExecute, showNextJsHint = true, autoRun = false }: E2BCodeExecutionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [showFailsafe, setShowFailsafe] = useState(false);
  const [e2bFailed, setE2bFailed] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (autoRun) {
      // fire and forget, errors are handled inside
      // slight delay to ensure mount animation completes
      const t = setTimeout(() => {
        handleExecute();
      }, 200);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const handleExecute = async () => {
    setIsExecuting(true);
    setE2bFailed(false);
    setShowFailsafe(false);
    
    try {
      const executionResult = await onExecute(code, language);
      setResult(executionResult);
      if (executionResult.success) {
        toast.success('Code executed successfully with E2B!');
      } else {
        toast.error('E2B execution failed. WebContainer failsafe available.');
        setE2bFailed(true);
      }
    } catch (error) {
      console.error('E2B execution error:', error);
      const errorMessage = String(error);
      
      // Check if it's an E2B-related error
      const isE2bError = errorMessage.includes('E2B') || 
                        errorMessage.includes('sandbox') ||
                        errorMessage.includes('timeout') ||
                        errorMessage.includes('connection') ||
                        errorMessage.includes('network');
      
      if (isE2bError) {
        toast.error('E2B service unavailable. Activating WebContainer failsafe...');
        setE2bFailed(true);
        setShowFailsafe(true);
      } else {
        toast.error('Code execution failed');
      }
      
      setResult({
        success: false,
        error: errorMessage,
        logs: []
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const activateFailsafe = () => {
    setShowFailsafe(true);
    toast.info('Switching to WebContainer failsafe...');
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
      case 'css':
        return <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">C</div>;
      case 'json':
        return <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-teal-500 rounded flex items-center justify-center text-white text-xs font-bold">J</div>;
      default:
        return <Code2 className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-gradient bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 shadow-xl backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-blue-200/50 dark:border-blue-800/50">
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
                <Zap className="relative w-5 h-5 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <div className="flex flex-col">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Code Execution
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300">
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
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Running...</span>
                    </motion.div>
                  )}
                  {e2bFailed && (
                    <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950">
                      <AlertTriangle className="w-3 h-3" />
                      E2B Unavailable
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCode(!showCode)}
                className="gap-2 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all duration-200"
              >
                <Code2 className="w-3 h-3" />
                {showCode ? 'Hide' : 'Show'} Code
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="gap-2 hover:bg-green-100 dark:hover:bg-green-900 transition-all duration-200"
              >
                <motion.div
                  animate={{ scale: copied ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                </motion.div>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              
              {e2bFailed && !showFailsafe && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={activateFailsafe}
                  className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 transition-all duration-200"
                >
                  <Shield className="w-3 h-3" />
                  Use Failsafe
                </Button>
              )}
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className={`gap-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white border-0 shadow-lg transition-all duration-300 ${
                    isExecuting ? 'animate-pulse opacity-80' : 'hover:shadow-xl'
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-3 h-3" />
                      </motion.div>
                      <span className="hidden sm:inline">Executing...</span>
                      <span className="sm:hidden">Running</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Play className="w-3 h-3" />
                      </motion.div>
                      <span className="hidden sm:inline">Run Code</span>
                      <span className="sm:hidden">Run</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
          {showNextJsHint && language.toLowerCase() === 'javascript' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2"
            >
              <Sparkles className="w-3 h-3" />
              This code will run in a Next.js environment with full TypeScript support
            </motion.div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Code Display */}
          <AnimatePresence>
            {showCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900 p-4 font-mono text-sm"
              >
                <ScrollArea className="max-h-[300px]">
                  <pre className="text-gray-300 whitespace-pre-wrap">{code}</pre>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Code Summary when hidden */}
          {!showCode && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20 p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getLanguageIcon()}
                    <span className="font-medium text-sm">{language} Code Block</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {code.split('\n').length} lines
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCode(true)}
                  className="gap-1 text-xs"
                >
                  <Code2 className="w-3 h-3" />
                  View Code
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="border-t">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className="font-medium">
                        {result.success ? 'Execution Successful' : 'Execution Failed'}
                      </span>
                    </div>
                    {result.executionTime && (
                      <Badge variant="outline" className="text-xs">
                        {result.executionTime}ms
                      </Badge>
                    )}
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="output" className="gap-2">
                        <Terminal className="w-3 h-3" />
                        Output
                      </TabsTrigger>
                      <TabsTrigger value="logs" className="gap-2">
                        <FileText className="w-3 h-3" />
                        Logs
                      </TabsTrigger>
                      {result.artifacts && result.artifacts.length > 0 && (
                        <TabsTrigger value="artifacts" className="gap-2">
                          <Image className="w-3 h-3" />
                          Artifacts
                        </TabsTrigger>
                      )}
                      {result.error && (
                        <TabsTrigger value="error" className="gap-2">
                          <XCircle className="w-3 h-3" />
                          Error
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent value="output" className="p-4">
                      <ScrollArea className="max-h-[200px]">
                        <pre className="text-sm font-mono whitespace-pre-wrap">
                          {result.output || 'No output'}
                        </pre>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="logs" className="p-4">
                      <ScrollArea className="max-h-[200px]">
                        {result.logs.length > 0 ? (
                          <div className="space-y-1">
                            {result.logs.map((log, index) => (
                              <div key={index} className="text-sm font-mono text-gray-600 dark:text-gray-400">
                                {log}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No logs</p>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    {result.artifacts && result.artifacts.length > 0 && (
                      <TabsContent value="artifacts" className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {result.artifacts.map((artifact, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="border rounded-lg p-3 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                {artifact.type === 'image' && <Image className="w-4 h-4" />}
                                {artifact.type === 'chart' && <BarChart className="w-4 h-4" />}
                                {artifact.type === 'file' && <FileText className="w-4 h-4" />}
                                <span className="text-sm font-medium">{artifact.name}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                              >
                                <a href={artifact.url} download={artifact.name}>
                                  <Download className="w-3 h-3" />
                                </a>
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </TabsContent>
                    )}

                    {result.error && (
                      <TabsContent value="error" className="p-4">
                        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
                          <pre className="text-sm font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap">
                            {result.error}
                          </pre>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      
      {/* WebContainer Failsafe */}
      <AnimatePresence>
        {showFailsafe && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mt-4"
          >
            <WebContainerFailsafe
              code={code}
              language={language}
              isVisible={showFailsafe}
              onFallback={() => {
                toast.info('WebContainer failsafe activated successfully!');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}