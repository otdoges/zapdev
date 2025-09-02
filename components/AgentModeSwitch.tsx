'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  Zap, 
  Brain, 
  Workflow,
  Activity,
  CheckCircle,
  Clock,
  Settings,
  Users
} from 'lucide-react';

export type AgentMode = 'fast' | 'deep' | 'background';

interface BackgroundAgent {
  id: string;
  type: AgentType;
  status: 'idle' | 'working' | 'completed' | 'failed';
  currentTask?: string;
  progress: number;
  estimatedCompletion?: Date;
}

export type AgentType =
  | 'architect'        // System design and planning
  | 'developer'        // Code implementation
  | 'reviewer'         // Code review and testing
  | 'deployer'         // Deployment and CI/CD
  | 'researcher'       // Research and analysis
  | 'optimizer'        // Performance optimization

interface AgentModeSwitchProps {
  currentMode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
  backgroundAgents?: BackgroundAgent[];
  showBackgroundStatus?: boolean;
  className?: string;
  disabled?: boolean;
}

interface ModeConfig {
  id: AgentMode;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const modeConfigs: ModeConfig[] = [
  {
    id: 'fast',
    name: 'Fast Mode',
    description: 'Quick responses with single AI agent',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'deep',
    name: 'Deep Mode',
    description: 'Thorough analysis with advanced reasoning',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: 'background',
    name: 'Background Mode',
    description: 'Multi-agent parallel execution',
    icon: Workflow,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
];

const agentTypeIcons: Record<AgentType, React.ComponentType<{ className?: string }>> = {
  architect: Settings,
  developer: Bot,
  reviewer: CheckCircle,
  deployer: Activity,
  researcher: Brain,
  optimizer: Zap
};

export default function AgentModeSwitch({
  currentMode,
  onModeChange,
  backgroundAgents = [],
  showBackgroundStatus = true,
  className = '',
  disabled = false
}: AgentModeSwitchProps) {
  const [activeAgents, setActiveAgents] = useState<BackgroundAgent[]>([]);
  
  useEffect(() => {
    if (currentMode === 'background' && showBackgroundStatus) {
      // Filter active/working agents
      const active = backgroundAgents.filter(agent => 
        agent.status === 'working' || agent.status === 'idle'
      );
      setActiveAgents(active);
    }
  }, [currentMode, backgroundAgents, showBackgroundStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'idle': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm', className)}>
      {/* Mode Selector */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <Bot className="w-5 h-5 text-gray-700" />
          <h3 className="font-medium text-gray-900">AI Agent Mode</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {modeConfigs.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            
            return (
              <button
                key={mode.id}
                onClick={() => !disabled && onModeChange(mode.id)}
                disabled={disabled}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all text-left',
                  'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                  disabled && 'opacity-50 cursor-not-allowed',
                  isActive
                    ? `${mode.borderColor} ${mode.bgColor} shadow-sm`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn(
                    'w-5 h-5 mt-0.5',
                    isActive ? mode.color : 'text-gray-500'
                  )} />
                  <div className="min-w-0 flex-1">
                    <div className={cn(
                      'font-medium text-sm',
                      isActive ? mode.color : 'text-gray-900'
                    )}>
                      {mode.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 leading-tight">
                      {mode.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Background Agent Status */}
      {currentMode === 'background' && showBackgroundStatus && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Background Agents
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {activeAgents.length} active
              </span>
            </h4>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>

          {activeAgents.length > 0 ? (
            <div className="space-y-3">
              {activeAgents.slice(0, 3).map((agent) => {
                const AgentIcon = agentTypeIcons[agent.type];
                
                return (
                  <div key={agent.id} className="border rounded-md p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AgentIcon className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-sm capitalize">
                          {agent.type}
                        </span>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        getStatusColor(agent.status)
                      )}>
                        {agent.status}
                      </span>
                    </div>
                    
                    {agent.currentTask && (
                      <div className="text-xs text-gray-600 mb-2 truncate">
                        {agent.currentTask}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500">Progress</span>
                          <span className="text-xs font-medium">{agent.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={cn(
                              'h-1.5 rounded-full transition-all',
                              getProgressColor(agent.progress)
                            )}
                            style={{ width: `${agent.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      {agent.estimatedCompletion && agent.status === 'working' && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {Math.ceil((agent.estimatedCompletion.getTime() - Date.now()) / 60000)}m
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {activeAgents.length > 3 && (
                <div className="text-center">
                  <span className="text-xs text-gray-500">
                    +{activeAgents.length - 3} more agents working
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Workflow className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No background agents currently active</p>
              <p className="text-xs mt-1">Agents will appear here when tasks are running</p>
            </div>
          )}
        </div>
      )}

      {/* Mode Info */}
      {currentMode !== 'background' && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {currentMode === 'fast' && (
              <>
                <Zap className="w-4 h-4" />
                <span>Single AI agent • Optimized for speed</span>
              </>
            )}
            {currentMode === 'deep' && (
              <>
                <Brain className="w-4 h-4" />
                <span>Advanced reasoning • Higher quality responses</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}