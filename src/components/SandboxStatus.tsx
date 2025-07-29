import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  startSandbox, 
  isSandboxRunning, 
  getSandboxStatus, 
  closeSandbox 
} from '@/lib/sandbox';
import { Play, Square, RefreshCw, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface SandboxStatusProps {
  className?: string;
}

export const SandboxStatus: React.FC<SandboxStatusProps> = ({ className = '' }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [sandboxInfo, setSandboxInfo] = useState<{
    sandboxId?: string;
    isAlive: boolean;
    template?: string;
  }>({ isAlive: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const running = await isSandboxRunning();
      setIsRunning(running);
      
      if (running) {
        // Use getSandboxStatus for safer access to sandbox information
        const status = await getSandboxStatus();
        if (status) {
          setSandboxInfo({
            isAlive: status.isRunning,
            sandboxId: status.sandboxId
          });
        }
      } else {
        setSandboxInfo({ isAlive: false });
      }
    } catch (error) {
      console.error('Error checking sandbox status:', error);
      setSandboxInfo({ isAlive: false });
      setIsRunning(false);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await startSandbox();
      await checkStatus();
      toast.success('E2B sandbox started successfully');
    } catch (error) {
      console.error('Failed to start sandbox:', error);
      toast.error('Failed to start E2B sandbox. Check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await closeSandbox();
      await checkStatus();
      toast.success('E2B sandbox stopped');
    } catch (error) {
      console.error('Failed to stop sandbox:', error);
      toast.error('Failed to stop sandbox');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`${className} w-full max-w-md`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4" />
          E2B Sandbox Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={isRunning ? 'default' : 'secondary'}>
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
        </div>
        
        {sandboxInfo.sandboxId && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sandbox ID:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {sandboxInfo.sandboxId.substring(0, 8)}...
            </code>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Template:</span>
          <Badge variant="outline" className="text-xs">
            {sandboxInfo.template || 'base'}
          </Badge>
        </div>
        
        <div className="flex gap-2 pt-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              disabled={isLoading}
              size="sm"
              className="flex-1"
            >
              {isLoading ? (
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <Play className="w-3 h-3 mr-2" />
              )}
              Start Sandbox
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <Square className="w-3 h-3 mr-2" />
              )}
              Stop Sandbox
            </Button>
          )}
          
          <Button
            onClick={checkStatus}
            size="sm"
            variant="ghost"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground pt-2">
          {isRunning ? (
            'Sandbox is ready for code execution'
          ) : (
            'Start sandbox to enable code execution'
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 