'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Brain,
  Code,
  Settings,
  Zap,
  CheckCircle,
  Loader,
  Clock,
  FileText,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'complete' | 'error';
  currentTask?: string;
  result?: object;
  progress?: number;
  startTime?: Date;
  endTime?: Date;
}

interface AITeamRealtimeProps {
  userRequest: string;
  onComplete?: (result: object) => void;
  onError?: (error: string) => void;
  className?: string;
}

const initialAgents: AIAgent[] = [
  {
    id: 'analyst',
    name: 'Business Analyst',
    role: 'Requirements Analysis',
    status: 'idle',
  },
  {
    id: 'architect',
    name: 'System Architect',
    role: 'Architecture Design',
    status: 'idle',
  },
  {
    id: 'frontend',
    name: 'Frontend Developer',
    role: 'UI Components',
    status: 'idle',
  },
  {
    id: 'backend',
    name: 'Backend Developer',
    role: 'API Services',
    status: 'idle',
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    role: 'Deployment Setup',
    status: 'idle',
  },
];

export default function AITeamRealtime({
  userRequest,
  onComplete,
  onError,
  className,
}: AITeamRealtimeProps) {
  const [agents, setAgents] = useState<AIAgent[]>(initialAgents);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [teamResults, setTeamResults] = useState<Record<string, object>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Start the AI team coordination process
  const startCoordination = async () => {
    setIsProcessing(true);
    setOverallProgress(0);
    addLog('🚀 Starting AI team coordination...');

    const steps = ['analyze', 'architect', 'frontend', 'backend', 'deploy'];
    const agentMap: Record<string, string> = {
      analyze: 'analyst',
      architect: 'architect',
      frontend: 'frontend',
      backend: 'backend',
      deploy: 'devops',
    };

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const agentId = agentMap[step];

        // Update agent status to working
        updateAgentStatus(agentId, 'working', `Processing ${step} step...`);
        setCurrentAgent(agentId);

        addLog(`🤖 ${agents.find((a) => a.id === agentId)?.name} is working on ${step}...`);

        // Call the AI coordination API
        const result = await callAITeamAPI(step, userRequest);

        if (result.error) {
          updateAgentStatus(agentId, 'error');
          addLog(`❌ ${result.error}`);
          onError?.(result.error);
          return;
        }

        // Update agent with results
        updateAgentStatus(agentId, 'complete', undefined, result.result);
        setTeamResults((prev) => ({ ...prev, [step]: result.result }));

        addLog(`✅ ${result.agent} completed: ${step}`);

        // Update overall progress
        setOverallProgress(((i + 1) / steps.length) * 100);

        // Simulate processing time for visual effect
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setCurrentAgent(null);
      addLog('🎉 AI team coordination complete!');
      onComplete?.(teamResults);
    } catch (error) {
      addLog(`❌ Coordination failed: ${error}`);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Call AI team API for specific step
  const callAITeamAPI = async (step: string, request: string) => {
    try {
      const response = await fetch('/api/ai-team/coordinate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest: request,
          step: step,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'API call failed',
      };
    }
  };

  // Update agent status
  const updateAgentStatus = (
    agentId: string,
    status: AIAgent['status'],
    task?: string,
    result?: object
  ) => {
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          const updated = {
            ...agent,
            status,
            currentTask: task,
            result,
          };

          if (status === 'working' && !agent.startTime) {
            updated.startTime = new Date();
          }
          if (status === 'complete' || status === 'error') {
            updated.endTime = new Date();
          }

          return updated;
        }
        return agent;
      })
    );
  };

  // Add log entry
  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Get agent icon
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'analyst':
        return <Lightbulb className="h-4 w-4" />;
      case 'architect':
        return <Settings className="h-4 w-4" />;
      case 'frontend':
        return <Code className="h-4 w-4" />;
      case 'backend':
        return <Brain className="h-4 w-4" />;
      case 'devops':
        return <Zap className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: AIAgent['status']) => {
    switch (status) {
      case 'idle':
        return 'text-gray-400';
      case 'working':
        return 'text-yellow-400';
      case 'complete':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Start coordination when component mounts
  useEffect(() => {
    if (userRequest && !isProcessing) {
      startCoordination();
    }
  }, [userRequest]);

  return (
    <div className={cn('rounded-lg border border-gray-700 bg-gray-900', className)}>
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-white">AI Development Team</h3>
            <p className="text-sm text-gray-400">Real-time coordination in progress</p>
          </div>
          <div className="text-right">
            <div className="font-medium text-white">{Math.round(overallProgress)}%</div>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-700">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        {/* Agents Status */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-medium text-white">
            <Brain className="h-4 w-4" />
            Team Members
          </h4>

          <div className="space-y-2">
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                layout
                className={cn(
                  'rounded-lg border p-3 transition-all duration-300',
                  agent.id === currentAgent
                    ? 'border-blue-500/50 bg-blue-500/20'
                    : 'border-gray-700 bg-gray-800',
                  agent.status === 'complete' && 'border-green-500/30 bg-green-500/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'rounded-lg p-2',
                      agent.status === 'working'
                        ? 'bg-yellow-500/20'
                        : agent.status === 'complete'
                          ? 'bg-green-500/20'
                          : agent.status === 'error'
                            ? 'bg-red-500/20'
                            : 'bg-gray-600/20'
                    )}
                  >
                    {agent.status === 'working' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader className="h-4 w-4 text-yellow-400" />
                      </motion.div>
                    ) : agent.status === 'complete' ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : agent.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      getAgentIcon(agent.id)
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{agent.name}</span>
                      <span className={cn('text-xs capitalize', getStatusColor(agent.status))}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{agent.role}</p>
                    {agent.currentTask && (
                      <p className="mt-1 text-xs text-blue-300">{agent.currentTask}</p>
                    )}
                  </div>

                  {(agent.startTime || agent.endTime) && (
                    <div className="text-right">
                      <Clock className="mr-1 inline h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {agent.endTime
                          ? `${Math.round((agent.endTime.getTime() - (agent.startTime?.getTime() || 0)) / 1000)}s`
                          : agent.startTime
                            ? `${Math.round((Date.now() - agent.startTime.getTime()) / 1000)}s`
                            : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Show result preview for completed agents */}
                {agent.status === 'complete' && agent.result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 rounded bg-gray-700/50 p-2 text-xs"
                  >
                    <div className="mb-1 font-medium text-green-300">Result Preview:</div>
                    <div className="text-gray-300">
                      {agent.result.reasoning ||
                        agent.result.projectType ||
                        'Task completed successfully'}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Real-time Logs */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-medium text-white">
            <FileText className="h-4 w-4" />
            Team Activity Log
          </h4>

          <div className="h-80 overflow-y-auto rounded-lg bg-gray-800 p-3">
            <div className="space-y-1 font-mono text-xs">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-gray-300"
                  >
                    {log}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
