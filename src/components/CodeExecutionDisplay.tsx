import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Terminal, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  Eye, 
  EyeOff,
  FileText,
  Activity
} from 'lucide-react';

interface ExecutionOutput {
  stdout: string;
  stderr: string;
  results: unknown[];
  error?: Error | string | unknown;
}

interface CodeExecutionDisplayProps {
  output: ExecutionOutput;
}

const CodeExecutionDisplay: React.FC<CodeExecutionDisplayProps> = ({ output }) => {
  const [showDetails, setShowDetails] = useState(true);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const copyToClipboard = async (text: string, tabName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const hasOutput = output.stdout.length > 0;
  const hasError = output.stderr.length > 0 || output.error;
  const hasResults = output.results && output.results.length > 0;

  const getStatusIcon = () => {
    if (hasError) {
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (hasError) {
      return 'Execution Failed';
    }
    return 'Execution Successful';
  };

  const getStatusColor = () => {
    if (hasError) {
      return 'destructive';
    }
    return 'default';
  };

  const formatResults = (results: unknown[]) => {
    return results.map((result, index) => {
      if (typeof result === 'object') {
        return JSON.stringify(result, null, 2);
      }
      return String(result);
    }).join('\n');
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <CardTitle className="text-sm">Execution Output</CardTitle>
            {getStatusIcon()}
            <Badge variant={getStatusColor() as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
              {getStatusText()}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showDetails ? 'Hide' : 'Show'}
          </Button>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0">
          <Tabs defaultValue={hasOutput ? "stdout" : hasError ? "stderr" : "results"} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger 
                value="stdout" 
                disabled={!hasOutput}
                className="flex items-center gap-2"
              >
                <Terminal className="w-3 h-3" />
                Output
                {hasOutput && <Badge variant="secondary" className="text-xs">✓</Badge>}
              </TabsTrigger>
              
              <TabsTrigger 
                value="stderr" 
                disabled={!hasError}
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-3 h-3" />
                Errors
                {hasError && <Badge variant="destructive" className="text-xs">!</Badge>}
              </TabsTrigger>
              
              <TabsTrigger 
                value="results" 
                disabled={!hasResults}
                className="flex items-center gap-2"
              >
                <FileText className="w-3 h-3" />
                Results
                {hasResults && <Badge variant="secondary" className="text-xs">{output.results.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stdout" className="mt-4">
              {hasOutput ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Terminal className="w-3 h-3" />
                      Standard Output
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(output.stdout, 'stdout')}
                    >
                      {copiedTab === 'stdout' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedTab === 'stdout' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px] w-full">
                    <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                      {output.stdout}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertDescription>
                    No output was produced by this code execution.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="stderr" className="mt-4">
              {hasError ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      Error Output
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(output.stderr || String(output.error), 'stderr')}
                    >
                      {copiedTab === 'stderr' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedTab === 'stderr' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px] w-full">
                    <pre className="text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-md overflow-x-auto">
                      {output.stderr || String(output.error)}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    No errors occurred during execution.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="results" className="mt-4">
              {hasResults ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      Execution Results ({output.results.length} item{output.results.length !== 1 ? 's' : ''})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(formatResults(output.results), 'results')}
                    >
                      {copiedTab === 'results' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedTab === 'results' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px] w-full">
                    <div className="space-y-2">
                      {output.results.map((result, index) => (
                        <div key={index} className="bg-muted p-3 rounded-md">
                          <div className="text-xs text-muted-foreground mb-1">
                            Result {index + 1}
                          </div>
                          <pre className="text-sm overflow-x-auto">
                            {typeof result === 'object' 
                              ? JSON.stringify(result, null, 2)
                              : String(result)
                            }
                          </pre>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    No results were returned from this execution.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};

export default CodeExecutionDisplay; 