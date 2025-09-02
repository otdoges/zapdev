'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  Brain,
  Code,
  Search,
  FileText,
  Sparkles,
  Activity,
  Clock,
  Users,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  Globe,
  Cpu,
  Monitor,
  RefreshCw
} from 'lucide-react';
import BackgroundAgentSwitch from './BackgroundAgentSwitch';

interface BackgroundAgent {
  id: string;
  name: string;
  type: 'researcher' | 'developer' | 'analyzer' | 'searcher' | 'coordinator';
  status: 'idle' | 'working' | 'completed' | 'error' | 'paused';
  currentTask?: string;
  progress: number;
  startTime: Date;
  estimatedCompletion?: Date;
  searchQueries?: string[];
  results?: {
    codeGenerated: number;
    searchResults: number;
    filesAnalyzed: number;
    tasksCompleted: number;
  };
}

interface TaskQueue {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  createdAt: Date;
  estimatedDuration: number;
}

interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  avgResponseTime: number;
  successRate: number;
  searchQueries: number;
  codeGenerated: number;
}

export default function BackgroundAgentDashboard() {
  const [agents, setAgents] = useState<BackgroundAgent[]>([]);
  const [taskQueue, setTaskQueue] = useState<TaskQueue[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalAgents: 0,
    activeAgents: 0,
    totalTasks: 0,
    completedTasks: 0,
    avgResponseTime: 0,
    successRate: 0,
    searchQueries: 0,
    codeGenerated: 0
  });
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [expandedMetrics, setExpandedMetrics] = useState(false);
  const [realTimeLog, setRealTimeLog] = useState<string[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    if (isSystemActive) {
      const mockAgents: BackgroundAgent[] = [
        {
          id: 'agent-1',
          name: 'Web Researcher',
          type: 'searcher',
          status: 'working',
          currentTask: 'Searching for React best practices',
          progress: 75,
          startTime: new Date(Date.now() - 300000),
          estimatedCompletion: new Date(Date.now() + 120000),
          searchQueries: ['React hooks patterns', 'Modern React architecture'],
          results: { codeGenerated: 0, searchResults: 12, filesAnalyzed: 0, tasksCompleted: 3 }
        },
        {
          id: 'agent-2',
          name: 'Code Developer',
          type: 'developer',
          status: 'working',
          currentTask: 'Generating component structure',
          progress: 45,
          startTime: new Date(Date.now() - 180000),
          estimatedCompletion: new Date(Date.now() + 240000),
          results: { codeGenerated: 3, searchResults: 0, filesAnalyzed: 8, tasksCompleted: 1 }
        },
        {
          id: 'agent-3',
          name: 'Code Analyzer',
          type: 'analyzer',
          status: 'idle',
          currentTask: undefined,
          progress: 0,
          startTime: new Date(),
          results: { codeGenerated: 0, searchResults: 0, filesAnalyzed: 24, tasksCompleted: 5 }
        }
      ];

      setAgents(mockAgents);
      setSystemMetrics({
        totalAgents: mockAgents.length,
        activeAgents: mockAgents.filter(a => a.status === 'working').length,
        totalTasks: 15,
        completedTasks: 9,
        avgResponseTime: 1.2,
        successRate: 0.87,
        searchQueries: 12,
        codeGenerated: 3
      });

      // Simulate real-time updates
      const interval = setInterval(() => {
        setAgents(prev => prev.map(agent => {
          if (agent.status === 'working' && agent.progress < 100) {
            const newProgress = Math.min(agent.progress + Math.random() * 10, 100);
            return {
              ...agent,
              progress: newProgress,
              status: newProgress >= 100 ? 'completed' : 'working'
            };
          }
          return agent;
        }));

        // Add random log entries
        setRealTimeLog(prev => [
          `${new Date().toLocaleTimeString()}: Agent completed search query`,
          ...prev.slice(0, 9)
        ]);
      }, 3000);

      return () => clearInterval(interval);
    } else {
      setAgents([]);
      setRealTimeLog([]);
    }
  }, [isSystemActive]);

  const handleSystemToggle = useCallback((active: boolean) => {
    setIsSystemActive(active);
    if (active) {
      setRealTimeLog([`${new Date().toLocaleTimeString()}: Background agent system activated`]);
    }
  }, []);

  const handleAddTask = useCallback(() => {
    if (!newTaskText.trim()) return;
    
    const newTask: TaskQueue = {
      id: `task-${Date.now()}`,
      title: newTaskText.slice(0, 50),
      description: newTaskText,
      priority: 'medium',
      createdAt: new Date(),
      estimatedDuration: 300 // 5 minutes
    };
    
    setTaskQueue(prev => [newTask, ...prev]);
    setNewTaskText('');
  }, [newTaskText]);

  const getAgentIcon = (type: BackgroundAgent['type']) => {
    switch (type) {
      case 'searcher': return Search;
      case 'developer': return Code;
      case 'analyzer': return BarChart3;
      case 'researcher': return Brain;
      case 'coordinator': return Users;
      default: return Bot;
    }
  };

  const getStatusColor = (status: BackgroundAgent['status']) => {
    switch (status) {
      case 'working': return 'text-primary bg-orange-50 border-primary/20';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'idle': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: TaskQueue['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-primary bg-orange-50 border-primary/20';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-primary/5 p-6">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Background Agents</h1>
              <p className="text-gray-600">Autonomous AI system for parallel processing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <BackgroundAgentSwitch
              isActive={isSystemActive}
              onToggle={handleSystemToggle}
              agentCount={systemMetrics.activeAgents}
              size="lg"
            />
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </motion.div>
      </div>

      {!isSystemActive ? (
        /* Inactive State */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="max-w-md mx-auto">
            <div className="p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-lg mb-6">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Background Agents Disabled
              </h2>
              <p className="text-gray-600 mb-6">
                Activate the background agent system to start autonomous AI processing, 
                web searching, and parallel task execution.
              </p>
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-primary" />
                  <span>Intelligent web search integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <Code className="w-4 h-4 text-primary" />
                  <span>Automated code generation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>Parallel task processing</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => handleSystemToggle(true)}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
            >
              Activate Background Agents
            </Button>
          </div>
        </motion.div>
      ) : (
        /* Active State */
        <div className="space-y-8">
          {/* System Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-primary/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                System Overview
              </h2>
              <Button
                variant="ghost"
                onClick={() => setExpandedMetrics(!expandedMetrics)}
                className="gap-2"
              >
                {expandedMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expandedMetrics ? 'Less' : 'More'} Details
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Active Agents</span>
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mt-1">
                  {systemMetrics.activeAgents}/{systemMetrics.totalAgents}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Success Rate</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {Math.round(systemMetrics.successRate * 100)}%
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Searches</span>
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {systemMetrics.searchQueries}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Code Generated</span>
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-1">
                  {systemMetrics.codeGenerated}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedMetrics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Response Time</span>
                        <span className="font-medium">{systemMetrics.avgResponseTime}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tasks Completed</span>
                        <span className="font-medium">{systemMetrics.completedTasks}/{systemMetrics.totalTasks}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Real-time Activity</h4>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-20 overflow-y-auto">
                      {realTimeLog.slice(0, 3).map((log, i) => (
                        <div key={i} className="text-xs text-gray-600 py-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Agents */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-primary/10"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Active Agents ({agents.length})
              </h2>
              
              <div className="space-y-4">
                {agents.map((agent) => {
                  const AgentIcon = getAgentIcon(agent.type);
                  const isSelected = selectedAgent === agent.id;
                  
                  return (
                    <motion.div
                      key={agent.id}
                      layout
                      className={cn(
                        'border rounded-lg p-4 cursor-pointer transition-all',
                        isSelected ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <AgentIcon className="w-4 h-4 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{agent.name}</h4>
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium border',
                              getStatusColor(agent.status)
                            )}>
                              {agent.status}
                            </span>
                          </div>
                          
                          {agent.currentTask && (
                            <p className="text-sm text-gray-600 mb-2">
                              {agent.currentTask}
                            </p>
                          )}
                          
                          {agent.status === 'working' && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Progress</span>
                                <span className="font-medium">{Math.round(agent.progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <motion.div
                                  className="bg-primary h-1.5 rounded-full"
                                  style={{ width: `${agent.progress}%` }}
                                  animate={{ width: `${agent.progress}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {agent.estimatedCompletion && agent.status === 'working' && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.ceil((agent.estimatedCompletion.getTime() - Date.now()) / 60000)}m
                            </div>
                          )}
                          
                          {agent.status === 'working' && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                              <Cpu className="w-4 h-4 text-primary" />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Expanded agent details */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-100"
                          >
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500">Start Time:</span>
                                <div className="font-medium">{agent.startTime.toLocaleTimeString()}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Tasks Completed:</span>
                                <div className="font-medium">{agent.results?.tasksCompleted || 0}</div>
                              </div>
                              {agent.searchQueries && agent.searchQueries.length > 0 && (
                                <div className="col-span-2">
                                  <span className="text-gray-500">Recent Searches:</span>
                                  <div className="mt-1">
                                    {agent.searchQueries.slice(0, 2).map((query, i) => (
                                      <div key={i} className="bg-gray-50 rounded px-2 py-1 text-xs font-mono mb-1">
                                        {query}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Task Queue & Controls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Add New Task */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-primary/10">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Add New Task
                </h2>
                
                <div className="space-y-4">
                  <Textarea
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Describe the task for background agents to process..."
                    rows={3}
                    className="resize-none"
                  />
                  
                  <Button
                    onClick={handleAddTask}
                    disabled={!newTaskText.trim()}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Add to Queue
                  </Button>
                </div>
              </div>

              {/* Task Queue */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-primary/10">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Task Queue ({taskQueue.length})
                </h2>
                
                {taskQueue.length > 0 ? (
                  <div className="space-y-3">
                    {taskQueue.slice(0, 5).map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {task.title}
                              </h4>
                              <span className={cn(
                                'px-2 py-1 rounded text-xs font-medium border',
                                getPriorityColor(task.priority)
                              )}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Est. {formatDuration(task.estimatedDuration)}</span>
                              <span>Added {task.createdAt.toLocaleTimeString()}</span>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTaskQueue(prev => prev.filter(t => t.id !== task.id))}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {taskQueue.length > 5 && (
                      <div className="text-center text-sm text-gray-500 pt-2">
                        +{taskQueue.length - 5} more tasks in queue
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No tasks in queue</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}