'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  Users,
  Brain,
} from 'lucide-react';
import { getContainer, DIContainer } from '@/lib/services/container';
import { AIAgent } from '@/lib/services/ai-team/ai-team-coordinator';
import { ServerStatus } from '@/lib/services/webcontainer/server-manager';

interface WebContainerProps {
  code: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  aiTeamInstructions?: string;
}

export default function WebContainerRefactored({
  code,
  onCodeChange,
  className,
  aiTeamInstructions,
}: WebContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    isRunning: false,
    url: null,
    port: null,
  });
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([
    {
      id: 'architect',
      name: 'System Architect',
      role: 'Project structure & dependencies',
      status: 'idle',
    },
    { id: 'frontend', name: 'Frontend Developer', role: 'UI/UX components', status: 'idle' },
    { id: 'backend', name: 'Backend Developer', role: 'Server logic & APIs', status: 'idle' },
    { id: 'devops', name: 'DevOps Engineer', role: 'Build & deployment', status: 'idle' },
  ]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<DIContainer | null>(null);

  // Initialize container and services
  useEffect(() => {
    const initContainer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        addTerminalOutput('🔄 Initializing services...');
        
        containerRef.current = getContainer();
        
        // Setup AI team if instructions provided
        if (aiTeamInstructions) {
          await startAITeamDevelopment(aiTeamInstructions);
        } else if (code && code.trim()) {
          await setupCodeInContainer(code);
        }
        
        setIsLoading(false);
        addTerminalOutput('✅ Services initialized successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        addTerminalOutput(`❌ Error: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    initContainer();

    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        containerRef.current.cleanup();
      }
    };
  }, []); // Only run once on mount

  // Handle code changes
  useEffect(() => {
    const setupCode = async () => {
      if (containerRef.current && code && code.trim()) {
        await setupCodeInContainer(code);
      }
    };

    setupCode();
  }, [code]);

  // Setup code in container using services
  const setupCodeInContainer = async (codeContent: string) => {
    if (!containerRef.current) return;

    try {
      addTerminalOutput('📄 Setting up code in WebContainer...');

      const projectSetupService = containerRef.current.createProjectSetupService({
        onOutput: addTerminalOutput,
        onProgress: (step, progress) => {
          addTerminalOutput(`📊 ${step}: ${progress}%`);
        },
      });

      const result = await projectSetupService.setupProject(undefined, {
        codeContent,
        instructions: '',
      });

      if (result.success) {
        const status = projectSetupService.getServerStatus();
        setServerStatus(status);
        addTerminalOutput('✅ Project setup completed successfully');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addTerminalOutput(`❌ Setup error: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  // AI Team Development Process
  const startAITeamDevelopment = async (instructions: string) => {
    if (!containerRef.current) return;

    try {
      addTerminalOutput('🤖 Starting AI team development process...');

      const aiTeamCoordinator = containerRef.current.createAITeamCoordinator({
        onAgentUpdate: setAiAgents,
        onOutput: addTerminalOutput,
      });

      await aiTeamCoordinator.startDevelopment(instructions);

      const status = aiTeamCoordinator.getServerStatus();
      setServerStatus(status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addTerminalOutput(`❌ AI team error: ${errorMessage}`);
      setError('AI team development failed');
    }
  };

  // Helper function to add terminal output
  const addTerminalOutput = (output: string) => {
    setTerminalOutput((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${output}`]);
  };

  // Stop preview
  const stopPreview = useCallback(() => {
    if (containerRef.current) {
      const projectSetupService = containerRef.current.createProjectSetupService();
      projectSetupService.stopServer();
      setServerStatus({
        isRunning: false,
        url: null,
        port: null,
      });
      addTerminalOutput('🛑 Development server stopped');
    }
  }, []);

  // Refresh preview
  const refreshPreview = useCallback(() => {
    if (iframeRef.current && serverStatus.url) {
      iframeRef.current.src = iframeRef.current.src;
      addTerminalOutput('🔄 Preview refreshed');
    }
  }, [serverStatus.url]);

  if (isLoading) {
    return (
      <div className={`flex h-full items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-violet-500" />
          <p className="text-gray-400">Initializing WebContainer...</p>
          <div className="mt-4 space-y-2">
            {terminalOutput.slice(-3).map((output, i) => (
              <p key={i} className="text-xs text-gray-500">
                {output}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col bg-gray-900 ${className}`}>
      {/* AI Team Status */}
      {aiTeamInstructions && (
        <div className="border-b border-gray-700 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="font-medium text-white">AI Development Team</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {aiAgents.map((agent) => (
              <div key={agent.id} className="rounded-lg bg-gray-800 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-white">{agent.name}</span>
                </div>
                <p className="mb-2 text-xs text-gray-400">{agent.role}</p>
                <div className="flex items-center gap-2">
                  {agent.status === 'idle' && <div className="h-2 w-2 rounded-full bg-gray-500" />}
                  {agent.status === 'working' && (
                    <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                  )}
                  {agent.status === 'complete' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {agent.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  <span className="text-xs capitalize text-gray-300">{agent.status}</span>
                </div>
                {agent.currentTask && (
                  <p className="mt-1 text-xs text-gray-400">{agent.currentTask}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between border-b border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${serverStatus.isRunning ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span className="text-sm text-white">{serverStatus.isRunning ? 'Running' : 'Stopped'}</span>
          </div>
          {serverStatus.url && <span className="text-sm text-gray-400">{serverStatus.url}</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshPreview}
            disabled={!serverStatus.url}
            className="rounded bg-gray-700 p-2 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={stopPreview}
            disabled={!serverStatus.isRunning}
            className="rounded bg-red-600 p-2 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Square className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1">
        {/* Preview */}
        <div className="flex-1 bg-white">
          {serverStatus.url ? (
            <iframe
              ref={iframeRef}
              src={serverStatus.url}
              className="h-full w-full border-0"
              title="Preview"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p>Preview will appear here once the development server starts</p>
              </div>
            </div>
          )}
        </div>

        {/* Terminal */}
        <div className="flex w-1/3 flex-col bg-black font-mono text-sm text-green-400">
          <div className="flex items-center gap-2 border-b border-gray-700 p-3">
            <Terminal className="h-4 w-4" />
            <span className="text-white">Terminal</span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {terminalOutput.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                {line}
              </div>
            ))}
            {terminalOutput.length === 0 && (
              <div className="text-gray-500">Waiting for output...</div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="border-t border-red-700 bg-red-900 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-100">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}