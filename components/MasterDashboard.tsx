'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  BarChart3, 
  Bot,
  Brain,
  TrendingUp,
  Workflow,
  Zap,
  Monitor,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AgentModeSwitch, { type AgentMode } from './AgentModeSwitch';
import AutonomousDashboard from './AutonomousDashboard';
import EnhancedDashboard from './EnhancedDashboard';

interface MasterDashboardProps {
  className?: string;
  userSubscription?: 'free' | 'pro' | 'enterprise';
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    pipeline: 'healthy' | 'warning' | 'critical';
    orchestrator: 'healthy' | 'warning' | 'critical';
    github: 'healthy' | 'warning' | 'critical';
    agents: 'healthy' | 'warning' | 'critical';
  };
  metrics: {
    uptime: number;
    responseTime: number;
    successRate: number;
    agentUtilization: number;
  };
}

type DashboardView = 'overview' | 'autonomous' | 'analytics' | 'agents' | 'monitoring';

export default function MasterDashboard({ 
  className = '',
  userSubscription = 'free'
}: MasterDashboardProps) {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [agentMode, setAgentMode] = useState<AgentMode>('fast');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [backgroundAgents, setBackgroundAgents] = useState<any[]>([]);
  const [loading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load system health and background agents
  const loadSystemData = useCallback(async () => {
    try {
      const [healthRes, agentsRes] = await Promise.all([
        fetch('/api/monitor/system-health'),
        fetch('/api/background-agents?action=list')
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData.health || null);
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setBackgroundAgents(agentsData.agents || []);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load system data:', error);
    }
  }, []);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [loadSystemData]);

  const handleAgentModeChange = useCallback((mode: AgentMode) => {
    setAgentMode(mode);
    
    // If switching to background mode and user has Pro+, load agents dashboard
    if (mode === 'background' && userSubscription !== 'free') {
      setCurrentView('autonomous');
    }
  }, [userSubscription]);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'System overview and quick actions',
      available: true
    },
    {
      id: 'autonomous',
      label: 'Autonomous',
      icon: Workflow,
      description: 'Multi-agent coordination and tasks',
      available: userSubscription !== 'free'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      description: 'Performance insights and metrics',
      available: userSubscription !== 'free'
    },
    {
      id: 'agents',
      label: 'AI Agents',
      icon: Bot,
      description: 'Agent management and configuration',
      available: true
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: Monitor,
      description: 'Real-time system monitoring',
      available: userSubscription === 'enterprise'
    }
  ] as const;

  return (
    <div className={cn('bg-white rounded-xl shadow-lg border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ZapDev AI Platform
            </h1>
            <p className="text-sm text-gray-600">
              Scout.new-inspired autonomous development
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* System Health Indicator */}
          {systemHealth && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
              getHealthColor(systemHealth.overall)
            )}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
              System {systemHealth.overall}
            </div>
          )}
          
          {/* Last Update */}
          <span className="text-xs text-gray-500">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
          
          {/* Refresh Button */}
          <Button
            onClick={loadSystemData}
            disabled={loading}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b">
        <nav className="flex overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isAvailable = item.available;
            
            return (
              <button
                key={item.id}
                onClick={() => isAvailable && setCurrentView(item.id as DashboardView)}
                disabled={!isAvailable}
                className={cn(
                  'flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  'hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
                  !isAvailable && 'opacity-50 cursor-not-allowed',
                  isActive && isAvailable
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600'
                )}
                title={!isAvailable ? `${item.label} requires Pro subscription` : item.description}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {!isAvailable && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                    {'Pro'}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {currentView === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            {systemHealth && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Uptime</span>
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {(systemHealth.metrics.uptime * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Response Time</span>
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {systemHealth.metrics.responseTime}ms
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">Success Rate</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {(systemHealth.metrics.successRate * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-900">Agent Utilization</span>
                    <Bot className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {(systemHealth.metrics.agentUtilization * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {/* Agent Mode Switch */}
            <div className="max-w-4xl">
              <AgentModeSwitch
                currentMode={agentMode}
                onModeChange={handleAgentModeChange}
                backgroundAgents={backgroundAgents}
                showBackgroundStatus={agentMode === 'background' && userSubscription !== 'free'}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setCurrentView('autonomous')}
                disabled={userSubscription === 'free'}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <Workflow className="w-6 h-6" />
                <span>Launch Autonomous Pipeline</span>
                {userSubscription === 'free' && (
                  <span className="text-xs text-yellow-600">(Pro required)</span>
                )}
              </Button>
              
              <Button
                onClick={() => setCurrentView('analytics')}
                disabled={userSubscription === 'free'}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <BarChart3 className="w-6 h-6" />
                <span>View Analytics</span>
                {userSubscription === 'free' && (
                  <span className="text-xs text-yellow-600">(Pro required)</span>
                )}
              </Button>
              
              <Button
                onClick={() => setCurrentView('agents')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <Bot className="w-6 h-6" />
                <span>Manage AI Agents</span>
              </Button>
            </div>

            {/* Subscription Upgrade Prompt */}
            {userSubscription === 'free' && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Unlock Advanced Features
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Upgrade to Pro for autonomous development, parallel feature shipping, 
                      and advanced analytics.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Multi-agent coordination</li>
                      <li>• Background task execution</li>
                      <li>• GitHub PR automation</li>
                      <li>• Performance analytics</li>
                    </ul>
                  </div>
                  <div className="ml-6">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'autonomous' && userSubscription !== 'free' && (
          <AutonomousDashboard />
        )}

        {currentView === 'analytics' && userSubscription !== 'free' && (
          <EnhancedDashboard />
        )}

        {currentView === 'agents' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">AI Agent Management</h2>
            
            <AgentModeSwitch
              currentMode={agentMode}
              onModeChange={setAgentMode}
              backgroundAgents={backgroundAgents}
              showBackgroundStatus={true}
              className="max-w-4xl"
            />

            {/* Agent Configuration */}
            <div className="border rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Agent Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Agent Mode
                  </label>
                  <select
                    value={agentMode}
                    onChange={(e) => setAgentMode(e.target.value as AgentMode)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="fast">Fast Mode</option>
                    <option value="deep">Deep Mode</option>
                    <option value="background" disabled={userSubscription === 'free'}>
                      Background Mode {userSubscription === 'free' ? '(Pro required)' : ''}
                    </option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Concurrent Agents
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    disabled={userSubscription === 'free'}
                  >
                    <option value="1">1 Agent (Free)</option>
                    <option value="3">3 Agents (Pro)</option>
                    <option value="10">10 Agents (Pro)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'monitoring' && userSubscription !== 'free' && (
          <div className="text-center py-12">
            <Monitor className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Real-time Monitoring
            </h3>
            <p className="text-gray-600">
              Advanced monitoring dashboard coming soon...
            </p>
          </div>
        )}

        {/* Restricted Access Message */}
        {((currentView === 'autonomous' && userSubscription === 'free') ||
          (currentView === 'analytics' && userSubscription === 'free') ||
          (currentView === 'monitoring' && userSubscription !== 'enterprise')) && (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {'Pro Subscription Required'}
            </h3>
            <p className="text-gray-600 mb-4">
              This feature requires a Pro subscription to access.
            </p>
            <Button>
              Upgrade Subscription
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}