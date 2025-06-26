"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIAgent {
  id: string
  name: string
  role: string
  status: 'idle' | 'working' | 'complete' | 'error'
  currentTask?: string
  result?: any
  progress?: number
  startTime?: Date
  endTime?: Date
}

interface AITeamRealtimeProps {
  userRequest: string
  onComplete?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

const initialAgents: AIAgent[] = [
  {
    id: 'analyst',
    name: 'Business Analyst',
    role: 'Requirements Analysis',
    status: 'idle'
  },
  {
    id: 'architect',
    name: 'System Architect',
    role: 'Architecture Design',
    status: 'idle'
  },
  {
    id: 'frontend',
    name: 'Frontend Developer',
    role: 'UI Components',
    status: 'idle'
  },
  {
    id: 'backend',
    name: 'Backend Developer',
    role: 'API Services',
    status: 'idle'
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    role: 'Deployment Setup',
    status: 'idle'
  }
]

export default function AITeamRealtime({ 
  userRequest, 
  onComplete, 
  onError, 
  className 
}: AITeamRealtimeProps) {
  const [agents, setAgents] = useState<AIAgent[]>(initialAgents)
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)
  const [teamResults, setTeamResults] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [overallProgress, setOverallProgress] = useState(0)

  // Start the AI team coordination process
  const startCoordination = async () => {
    setIsProcessing(true)
    setOverallProgress(0)
    addLog('🚀 Starting AI team coordination...')

    const steps = ['analyze', 'architect', 'frontend', 'backend', 'deploy']
    const agentMap: Record<string, string> = {
      'analyze': 'analyst',
      'architect': 'architect', 
      'frontend': 'frontend',
      'backend': 'backend',
      'deploy': 'devops'
    }

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const agentId = agentMap[step]
        
        // Update agent status to working
        updateAgentStatus(agentId, 'working', `Processing ${step} step...`)
        setCurrentAgent(agentId)
        
        addLog(`🤖 ${agents.find(a => a.id === agentId)?.name} is working on ${step}...`)
        
        // Call the AI coordination API
        const result = await callAITeamAPI(step, userRequest)
        
        if (result.error) {
          updateAgentStatus(agentId, 'error')
          addLog(`❌ ${result.error}`)
          onError?.(result.error)
          return
        }

        // Update agent with results
        updateAgentStatus(agentId, 'complete', undefined, result.result)
        setTeamResults(prev => ({ ...prev, [step]: result.result }))
        
        addLog(`✅ ${result.agent} completed: ${step}`)
        
        // Update overall progress
        setOverallProgress(((i + 1) / steps.length) * 100)
        
        // Simulate processing time for visual effect
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      setCurrentAgent(null)
      addLog('🎉 AI team coordination complete!')
      onComplete?.(teamResults)
      
    } catch (error) {
      addLog(`❌ Coordination failed: ${error}`)
      onError?.(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

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
          step: step
        })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'API call failed'
      }
    }
  }

  // Update agent status
  const updateAgentStatus = (
    agentId: string, 
    status: AIAgent['status'], 
    task?: string, 
    result?: any
  ) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        const updated = {
          ...agent,
          status,
          currentTask: task,
          result
        }

        if (status === 'working' && !agent.startTime) {
          updated.startTime = new Date()
        }
        if (status === 'complete' || status === 'error') {
          updated.endTime = new Date()
        }

        return updated
      }
      return agent
    }))
  }

  // Add log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Get agent icon
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'analyst': return <Lightbulb className="w-4 h-4" />
      case 'architect': return <Settings className="w-4 h-4" />
      case 'frontend': return <Code className="w-4 h-4" />
      case 'backend': return <Brain className="w-4 h-4" />
      case 'devops': return <Zap className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  // Get status color
  const getStatusColor = (status: AIAgent['status']) => {
    switch (status) {
      case 'idle': return 'text-gray-400'
      case 'working': return 'text-yellow-400'
      case 'complete': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  // Start coordination when component mounts
  useEffect(() => {
    if (userRequest && !isProcessing) {
      startCoordination()
    }
  }, [userRequest])

  return (
    <div className={cn("bg-gray-900 rounded-lg border border-gray-700", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-400" />
          <div className="flex-1">
            <h3 className="text-white font-semibold">AI Development Team</h3>
            <p className="text-gray-400 text-sm">Real-time coordination in progress</p>
          </div>
          <div className="text-right">
            <div className="text-white font-medium">{Math.round(overallProgress)}%</div>
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* Agents Status */}
        <div className="space-y-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Team Members
          </h4>
          
          <div className="space-y-2">
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                layout
                className={cn(
                  "p-3 rounded-lg border transition-all duration-300",
                  agent.id === currentAgent 
                    ? "bg-blue-500/20 border-blue-500/50" 
                    : "bg-gray-800 border-gray-700",
                  agent.status === 'complete' && "bg-green-500/10 border-green-500/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    agent.status === 'working' ? 'bg-yellow-500/20' :
                    agent.status === 'complete' ? 'bg-green-500/20' :
                    agent.status === 'error' ? 'bg-red-500/20' :
                    'bg-gray-600/20'
                  )}>
                    {agent.status === 'working' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    ) : agent.status === 'complete' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : agent.status === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      getAgentIcon(agent.id)
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{agent.name}</span>
                      <span className={cn("text-xs capitalize", getStatusColor(agent.status))}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{agent.role}</p>
                    {agent.currentTask && (
                      <p className="text-blue-300 text-xs mt-1">{agent.currentTask}</p>
                    )}
                  </div>
                  
                  {(agent.startTime || agent.endTime) && (
                    <div className="text-right">
                      <Clock className="w-3 h-3 text-gray-500 inline mr-1" />
                      <span className="text-xs text-gray-500">
                        {agent.endTime 
                          ? `${Math.round((agent.endTime.getTime() - (agent.startTime?.getTime() || 0)) / 1000)}s`
                          : agent.startTime 
                            ? `${Math.round((Date.now() - agent.startTime.getTime()) / 1000)}s`
                            : ''
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Show result preview for completed agents */}
                {agent.status === 'complete' && agent.result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-2 bg-gray-700/50 rounded text-xs"
                  >
                    <div className="text-green-300 font-medium mb-1">Result Preview:</div>
                    <div className="text-gray-300">
                      {agent.result.reasoning || agent.result.projectType || 'Task completed successfully'}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Real-time Logs */}
        <div className="space-y-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Team Activity Log
          </h4>
          
          <div className="bg-gray-800 rounded-lg p-3 h-80 overflow-y-auto">
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
  )
} 