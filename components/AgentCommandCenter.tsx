'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Zap, 
  Brain, 
  GitBranch, 
  Rocket, 
  Search, 
  Settings,
  Play,
  Pause,
  Square,
  BarChart3,
  Users,
  Code2,
  Database,
  Globe,
  Timer,
  CheckCircle,
  AlertCircle,
  XCircle,
  Cpu,
  Network,
  Eye,
  Sparkles
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: 'architect' | 'developer' | 'reviewer' | 'deployer' | 'researcher' | 'optimizer';
  status: 'idle' | 'working' | 'completed' | 'failed' | 'paused';
  currentTask?: string;
  progress: number;
  estimatedCompletion?: Date;
  performance: {
    tasksCompleted: number;
    successRate: number;
    avgDuration: number;
  };
  resources: {
    cpu: number;
    memory: number;
    network: number;
  };
}

interface Task {
  id: string;
  title: string;
  type: 'feature' | 'bugfix' | 'optimization' | 'research' | 'deployment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgent?: string;
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  estimatedDuration: number;
  dependencies: string[];
}

interface SystemMetrics {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  activeAgents: number;
  systemLoad: number;
  throughput: number;
  uptime: string;
}

const agentTypeConfig = {
  architect: { icon: Brain, color: 'bg-purple-500', label: 'Architect' },
  developer: { icon: Code2, color: 'bg-blue-500', label: 'Developer' },
  reviewer: { icon: Eye, color: 'bg-green-500', label: 'Reviewer' },
  deployer: { icon: Rocket, color: 'bg-orange-500', label: 'Deployer' },
  researcher: { icon: Search, color: 'bg-cyan-500', label: 'Researcher' },
  optimizer: { icon: BarChart3, color: 'bg-pink-500', label: 'Optimizer' }
};

const taskTypeConfig = {
  feature: { icon: Sparkles, color: 'text-blue-400' },
  bugfix: { icon: AlertCircle, color: 'text-red-400' },
  optimization: { icon: BarChart3, color: 'text-green-400' },
  research: { icon: Search, color: 'text-purple-400' },
  deployment: { icon: Rocket, color: 'text-orange-400' }
};

export default function AgentCommandCenter() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    activeAgents: 0,
    systemLoad: 0,
    throughput: 0,
    uptime: '0h 0m'
  });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [view, setView] = useState<'overview' | 'agents' | 'tasks' | 'performance'>('overview');
  
  const logsRef = useRef<HTMLDivElement>(null);

  // Simulate real-time data updates
  useEffect(() => {
    // Initialize sample data
    const initialAgents: Agent[] = [
      {
        id: 'agent-1',
        name: 'Zeus',
        type: 'architect',
        status: 'working',
        currentTask: 'Designing microservice architecture',
        progress: 65,
        estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000),
        performance: { tasksCompleted: 42, successRate: 94, avgDuration: 23 },
        resources: { cpu: 45, memory: 67, network: 23 }
      },
      {
        id: 'agent-2',
        name: 'Apollo',
        type: 'developer',
        status: 'working',
        currentTask: 'Implementing user authentication',
        progress: 82,
        estimatedCompletion: new Date(Date.now() + 8 * 60 * 1000),
        performance: { tasksCompleted: 156, successRate: 98, avgDuration: 18 },
        resources: { cpu: 78, memory: 54, network: 67 }
      },
      {
        id: 'agent-3',
        name: 'Athena',
        type: 'reviewer',
        status: 'idle',
        progress: 0,
        performance: { tasksCompleted: 89, successRate: 99, avgDuration: 12 },
        resources: { cpu: 12, memory: 34, network: 8 }
      },
      {
        id: 'agent-4',
        name: 'Hermes',
        type: 'deployer',
        status: 'completed',
        currentTask: 'Production deployment v2.1.0',
        progress: 100,
        performance: { tasksCompleted: 67, successRate: 96, avgDuration: 35 },
        resources: { cpu: 23, memory: 45, network: 89 }
      },
      {
        id: 'agent-5',
        name: 'Artemis',
        type: 'researcher',
        status: 'working',
        currentTask: 'Analyzing performance bottlenecks',
        progress: 34,
        estimatedCompletion: new Date(Date.now() + 25 * 60 * 1000),
        performance: { tasksCompleted: 73, successRate: 91, avgDuration: 28 },
        resources: { cpu: 56, memory: 78, network: 45 }
      }
    ];

    const initialTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Implement real-time chat system',
        type: 'feature',
        priority: 'high',
        assignedAgent: 'agent-2',
        status: 'in-progress',
        progress: 82,
        estimatedDuration: 120,
        dependencies: []
      },
      {
        id: 'task-2',
        title: 'Fix memory leak in data processing',
        type: 'bugfix',
        priority: 'critical',
        status: 'queued',
        progress: 0,
        estimatedDuration: 45,
        dependencies: ['task-1']
      },
      {
        id: 'task-3',
        title: 'Optimize database queries',
        type: 'optimization',
        priority: 'medium',
        assignedAgent: 'agent-5',
        status: 'in-progress',
        progress: 34,
        estimatedDuration: 90,
        dependencies: []
      },
      {
        id: 'task-4',
        title: 'Research new AI models',
        type: 'research',
        priority: 'low',
        status: 'queued',
        progress: 0,
        estimatedDuration: 180,
        dependencies: []
      }
    ];

    setAgents(initialAgents);
    setTasks(initialTasks);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setAgents(prevAgents => 
        prevAgents.map(agent => {
          if (agent.status === 'working') {
            const newProgress = Math.min(agent.progress + Math.random() * 5, 100);
            return {
              ...agent,
              progress: newProgress,
              resources: {
                cpu: Math.max(10, Math.min(90, agent.resources.cpu + (Math.random() - 0.5) * 10)),
                memory: Math.max(10, Math.min(90, agent.resources.memory + (Math.random() - 0.5) * 8)),
                network: Math.max(5, Math.min(95, agent.resources.network + (Math.random() - 0.5) * 15))
              },
              status: newProgress >= 100 ? 'completed' : 'working'
            };
          }
          return agent;
        })
      );

      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.status === 'in-progress') {
            const newProgress = Math.min(task.progress + Math.random() * 3, 100);
            return {
              ...task,
              progress: newProgress,
              status: newProgress >= 100 ? 'completed' : 'in-progress'
            };
          }
          return task;
        })
      );

      // Update metrics
      setMetrics({
        totalTasks: initialTasks.length,
        activeTasks: initialTasks.filter(t => t.status === 'in-progress').length,
        completedTasks: initialTasks.filter(t => t.status === 'completed').length,
        activeAgents: initialAgents.filter(a => a.status === 'working').length,
        systemLoad: Math.random() * 100,
        throughput: 12 + Math.random() * 8,
        uptime: '2h 34m'
      });

      // Add random log entries
      if (Math.random() < 0.3) {
        const logMessages = [
          '✅ Task "Implement user dashboard" completed successfully',
          '🚀 Agent "Apollo" deployed feature to staging environment',
          '⚡ System optimization improved response time by 15%',
          '🔍 Artemis discovered potential performance improvement',
          '📊 Code review completed with 98% approval rating',
          '🛠️ Auto-scaling triggered due to increased load'
        ];
        const newLog = logMessages[Math.floor(Math.random() * logMessages.length)];
        setLogs(prev => [newLog, ...prev.slice(0, 19)]); // Keep only last 20 logs
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = 0;
    }
  }, [logs]);

  const handleComman