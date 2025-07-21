import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Loader2,
  AlertCircle,
  Terminal,
  Code,
  Cloud,
  Server
} from 'lucide-react';
import e2bService from '@/lib/e2b-service';
import WebContainerComponent from '@/components/WebContainer';

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  logs: string[];
  executionTime?: number;
  provider: 'e2b' | 'webcontainer';
}

interface CodeExecutionDisplayProps {
  code?: string;
  language?: 'python' | 'javascript' | 'typescript' | 'bash' | 'nextjs';
  isRunning?: boolean;
  autoRun?: boolean;
  showProvider?: boolean;
}

export default function CodeExecutionDisplay({ 
  code = '', 
  language = 'javascript',
  isRunning = false,
  autoRun = false,
  showProvider = true
}: CodeExecutionDisplayProps) {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [provider, setProvider] = useState<'e2b' | 'webcontainer'>('e2b');
  const [useWebContainer, setUseWebContainer] = useState(false);

  // Check E2B availability on mount
  useEffect(() => {
    const checkE2BAvailability = async () => {
      const status = e2bService.getStatus();
      if (!status.available) {
        setProvider('webcontainer');
        setUseWebContainer(true);
      }
    };
    
    checkE2BAvailability();
  }, []);

  // Auto-run when code changes
  useEffect(() => {
    if (autoRun && code && !isExecuting) {
      executeCode();
    }
  }, [code, autoRun]);

  const executeCode = async () => {
    if (!code.trim()) return;

    setIsExecuting(true);
    setResult(null);

    try {
      if (language === 'nextjs' || useWebContainer) {
        // Use WebContainer for Next.js projects or when E2B is not available
        executeWithWebContainer();
      } else {
        // Try E2B first for other code execution
        await executeWithE2B();
      }
    } catch (error) {
      console.error('Execution error:', error);
      setResult({
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [],
        executionTime: 0,
        provider: provider
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const executeWithE2B = async () => {
    try {
      // Guard against unsupported language
      if (language === 'nextjs') {
        // This should never be called for Next.js projects – fallback to WebContainer instead
        throw new Error('Next.js projects should run in a WebContainer, not via E2B');
      }

      // Execute the code using the E2B service
      const execution = await e2bService.executeCode(code, {
        language, // narrowed to supported languages by the check above
        timeout: 30000,
      });

      setResult({
        success: execution.success,
        output: execution.output,
        error: execution.error,
        logs: execution.logs,
        executionTime: execution.executionTime,
        provider: 'e2b',
      });
      setProvider('e2b');
    } catch (error) {
      console.warn('E2B execution failed, falling back to WebContainer:', error);
      executeWithWebContainer();
    }
  };

  function executeWithWebContainer() {
    // For WebContainer, we'll show the existing WebContainer component
    setUseWebContainer(true);
    setProvider('webcontainer');
    setResult({
      success: true,
      output: 'Running in WebContainer environment...',
      logs: ['Switched to WebContainer for Next.js execution'],
      executionTime: 0,
      provider: 'webcontainer'
    });
  }

  const stopExecution = () => {
    setIsExecuting(false);
    setResult(null);
  };

  const retryExecution = () => {
    executeCode();
  };

  const getProviderIcon = () => {
    switch (provider) {
      case 'e2b':
        return <Cloud className="w-4 h-4" />;
      case 'webcontainer':
        return <Server className="w-4 h-4" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  const getProviderColor = () => {
    switch (provider) {
      case 'e2b':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'webcontainer':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  // If using WebContainer for Next.js, render the WebContainer component
  if (useWebContainer && language === 'nextjs') {
    return (
      <div className="h-full">
        <WebContainerComponent 
          code={code} 
          language="nextjs" 
          isRunning={isRunning}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          {showProvider && (
            <Badge className={`border ${getProviderColor()}`}>
              {getProviderIcon()}
              <span className="ml-1 capitalize">{provider}</span>
            </Badge>
          )}
          <Badge variant="outline" className="text-gray-400">
            {language}
          </Badge>
          {result && (
            <Badge className={result.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
              {result.success ? 'Success' : 'Failed'}
              {result.executionTime && ` (${result.executionTime}ms)`}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={executeCode}
            disabled={isExecuting || !code.trim()}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Play className="w-4 h-4 mr-1" />
            )}
            Run
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={stopExecution}
            disabled={!isExecuting}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Square className="w-4 h-4 mr-1" />
            Stop
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={retryExecution}
            disabled={isExecuting}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Retry
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Terminal className="w-4 h-4 mr-1" />
            Logs
          </Button>
        </div>
      </div>

      {/* Logs Panel */}
      {showLogs && result && (
        <div className="h-32 bg-gray-900 border-b border-gray-700 overflow-auto">
          <div className="p-3 text-xs font-mono text-gray-300">
            {result.logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
            {result.logs.length === 0 && (
              <div className="text-gray-500">No logs available</div>
            )}
          </div>
        </div>
      )}

      {/* Output */}
      <div className="flex-1 bg-gray-950">
        {isExecuting ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium text-gray-300">
                Executing code...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Running on {provider === 'e2b' ? 'E2B Cloud' : 'WebContainer'}
              </p>
            </div>
          </div>
        ) : result ? (
          <ScrollArea className="h-full p-4">
            {result.success ? (
              <div className="space-y-4">
                {result.output && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Output:</h3>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-800 p-3 rounded">
                      {result.output}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="text-sm font-medium">Execution Failed</h3>
                </div>
                {result.error && (
                  <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono bg-red-900/20 p-3 rounded border border-red-500/20">
                    {result.error}
                  </pre>
                )}
              </div>
            )}
          </ScrollArea>
        ) : !code.trim() ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Ready to Execute</p>
              <p className="text-sm text-gray-400 mt-2">
                Add some code and click "Run" to see results
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Click Run to Execute</p>
              <p className="text-sm text-gray-400 mt-2">
                Code is ready for execution
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 