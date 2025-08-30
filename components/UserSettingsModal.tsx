'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Zap,
  Monitor,
  X,
  Check,
  AlertCircle,
  Gauge,
  GitBranch,
  Users,
  Clock,
  Activity
} from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    taskCompletion: boolean;
    systemAlerts: boolean;
  };
  aiAgent: {
    enabled: boolean;
    mode: 'manual' | 'auto' | 'scheduled';
    triggers: string[];
    restrictions: string[];
    coordination: {
      enableMultiAgent: boolean;
      maxAgents: number;
      coordinationType: 'parallel' | 'sequential' | 'hierarchical';
      autoCollaboration: boolean;
    };
    backgroundJobs: {
      enabled: boolean;
      maxConcurrentJobs: number;
      schedule: string;
      autoRetry: boolean;
    };
  };
  gitIntegration: {
    enabled: boolean;
    autoCommit: boolean;
    autoPR: boolean;
    branchPrefix: string;
    commitTemplate: string;
    repositories: string[];
  };
  performance: {
    reactScanEnabled: boolean;
    metricsCollection: boolean;
    autoOptimization: boolean;
  };
  privacy: {
    analytics: boolean;
    errorReporting: boolean;
    usageData: boolean;
  };
}

export default function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { user } = useUser();
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    notifications: {
      email: true,
      push: false,
      taskCompletion: true,
      systemAlerts: true
    },
    aiAgent: {
      enabled: true,
      mode: 'auto',
      triggers: ['error_detected', 'performance_issue'],
      restrictions: ['no_destructive_changes', 'require_approval'],
      coordination: {
        enableMultiAgent: true,
        maxAgents: 4,
        coordinationType: 'parallel',
        autoCollaboration: true
      },
      backgroundJobs: {
        enabled: true,
        maxConcurrentJobs: 3,
        schedule: '0 */1 * * *', // Every hour
        autoRetry: true
      }
    },
    gitIntegration: {
      enabled: false,
      autoCommit: true,
      autoPR: false,
      branchPrefix: 'ai-feature/',
      commitTemplate: '🤖 AI-Generated: {description}',
      repositories: []
    },
    performance: {
      reactScanEnabled: true,
      metricsCollection: true,
      autoOptimization: false
    },
    privacy: {
      analytics: true,
      errorReporting: true,
      usageData: true
    }
  });
  
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'git' | 'performance' | 'privacy'>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserSettings();
    }
  }, [isOpen]);

  const loadUserSettings = async () => {
    try {
      // In real implementation, load from API
      console.log('Loading user settings...');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In real implementation, save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <nav className="space-y-2">
              {[
                { id: 'general', label: 'General', icon: User },
                { id: 'ai', label: 'AI Agent', icon: Zap },
                { id: 'git', label: 'Git Integration', icon: GitBranch },
                { id: 'performance', label: 'Performance', icon: Gauge },
                { id: 'privacy', label: 'Privacy', icon: Shield }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                  
                  {/* User Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || 'U'}
                      </div>
                      <div>
                        <h4 className="font-medium">{user?.fullName || 'User'}</h4>
                        <p className="text-sm text-gray-600">{user?.emailAddresses[0]?.emailAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {String(user?.publicMetadata?.subscriptionType || 'Free')} Plan
                      </span>
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Palette className="w-4 h-4 inline mr-2" />
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['light', 'dark', 'system'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => updateSetting('theme', theme)}
                          className={`p-3 border rounded-lg text-center capitalize transition-colors ${
                            settings.theme === theme
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Bell className="w-4 h-4 inline mr-2" />
                      Notifications
                    </label>
                    <div className="space-y-3">
                      {Object.entries(settings.notifications).map(([key, value]) => (
                        <label key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <button
                            onClick={() => updateSetting(`notifications.${key}`, !value)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${
                              value ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </button>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AI Background Agent</h3>
                  
                  {/* Agent Enable/Disable */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-blue-900">Background AI Agent</h4>
                        <p className="text-sm text-blue-700">Let AI work autonomously in the background</p>
                      </div>
                      <button
                        onClick={() => updateSetting('aiAgent.enabled', !settings.aiAgent.enabled)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          settings.aiAgent.enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.aiAgent.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    {!settings.aiAgent.enabled && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Pro feature - upgrade to enable background AI</span>
                      </div>
                    )}
                  </div>

                  {settings.aiAgent.enabled && (
                    <>
                      {/* Agent Mode */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Agent Mode
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {(['manual', 'auto', 'scheduled'] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => updateSetting('aiAgent.mode', mode)}
                              className={`p-3 border rounded-lg text-center capitalize transition-colors ${
                                settings.aiAgent.mode === mode
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Triggers */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Auto Triggers
                        </label>
                        <div className="space-y-2">
                          {[
                            'error_detected',
                            'performance_issue',
                            'security_alert',
                            'deployment_failure',
                            'user_feedback'
                          ].map((trigger) => (
                            <label key={trigger} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.aiAgent.triggers.includes(trigger)}
                                onChange={(e) => {
                                  const newTriggers = e.target.checked
                                    ? [...settings.aiAgent.triggers, trigger]
                                    : settings.aiAgent.triggers.filter(t => t !== trigger);
                                  updateSetting('aiAgent.triggers', newTriggers);
                                }}
                                className="mr-3"
                              />
                              <span className="text-sm text-gray-700 capitalize">
                                {trigger.replace(/_/g, ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Restrictions */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Safety Restrictions
                        </label>
                        <div className="space-y-2">
                          {[
                            'no_destructive_changes',
                            'require_approval',
                            'read_only_mode',
                            'sandbox_only'
                          ].map((restriction) => (
                            <label key={restriction} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.aiAgent.restrictions.includes(restriction)}
                                onChange={(e) => {
                                  const newRestrictions = e.target.checked
                                    ? [...settings.aiAgent.restrictions, restriction]
                                    : settings.aiAgent.restrictions.filter(r => r !== restriction);
                                  updateSetting('aiAgent.restrictions', newRestrictions);
                                }}
                                className="mr-3"
                              />
                              <span className="text-sm text-gray-700 capitalize">
                                {restriction.replace(/_/g, ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Multi-Agent Coordination */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          <Users className="w-4 h-4 inline mr-2" />
                          Multi-Agent Coordination
                        </label>
                        
                        <div className="space-y-4">
                          <label className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Enable Multi-Agent</span>
                              <p className="text-xs text-gray-500">Allow multiple AI agents to collaborate on complex tasks</p>
                            </div>
                            <button
                              onClick={() => updateSetting('aiAgent.coordination.enableMultiAgent', !settings.aiAgent.coordination.enableMultiAgent)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                                settings.aiAgent.coordination.enableMultiAgent ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                settings.aiAgent.coordination.enableMultiAgent ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </button>
                          </label>

                          {settings.aiAgent.coordination.enableMultiAgent && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Max Agents: {settings.aiAgent.coordination.maxAgents}
                                </label>
                                <input
                                  type="range"
                                  min="2"
                                  max="8"
                                  value={settings.aiAgent.coordination.maxAgents}
                                  onChange={(e) => updateSetting('aiAgent.coordination.maxAgents', parseInt(e.target.value))}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>2</span>
                                  <span>8</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Coordination Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['parallel', 'sequential', 'hierarchical'] as const).map((type) => (
                                    <button
                                      key={type}
                                      onClick={() => updateSetting('aiAgent.coordination.coordinationType', type)}
                                      className={`p-2 text-xs border rounded text-center capitalize transition-colors ${
                                        settings.aiAgent.coordination.coordinationType === type
                                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      {type}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <label className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Auto Collaboration</span>
                                  <p className="text-xs text-gray-500">Automatically create collaborations for complex tasks</p>
                                </div>
                                <button
                                  onClick={() => updateSetting('aiAgent.coordination.autoCollaboration', !settings.aiAgent.coordination.autoCollaboration)}
                                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                                    settings.aiAgent.coordination.autoCollaboration ? 'bg-blue-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                    settings.aiAgent.coordination.autoCollaboration ? 'translate-x-6' : 'translate-x-0'
                                  }`} />
                                </button>
                              </label>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Background Jobs */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          <Clock className="w-4 h-4 inline mr-2" />
                          Background Jobs
                        </label>
                        
                        <div className="space-y-4">
                          <label className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Enable Background Jobs</span>
                              <p className="text-xs text-gray-500">Run AI tasks in the background on a schedule</p>
                            </div>
                            <button
                              onClick={() => updateSetting('aiAgent.backgroundJobs.enabled', !settings.aiAgent.backgroundJobs.enabled)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                                settings.aiAgent.backgroundJobs.enabled ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                settings.aiAgent.backgroundJobs.enabled ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </button>
                          </label>

                          {settings.aiAgent.backgroundJobs.enabled && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Max Concurrent Jobs: {settings.aiAgent.backgroundJobs.maxConcurrentJobs}
                                </label>
                                <input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={settings.aiAgent.backgroundJobs.maxConcurrentJobs}
                                  onChange={(e) => updateSetting('aiAgent.backgroundJobs.maxConcurrentJobs', parseInt(e.target.value))}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>1</span>
                                  <span>10</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Schedule (Cron Format)
                                </label>
                                <input
                                  type="text"
                                  value={settings.aiAgent.backgroundJobs.schedule}
                                  onChange={(e) => updateSetting('aiAgent.backgroundJobs.schedule', e.target.value)}
                                  placeholder="0 */1 * * * (every hour)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Examples: 0 */1 * * * (hourly), 0 0 * * * (daily), 0 0 * * 1 (weekly)
                                </p>
                              </div>

                              <label className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Auto Retry Failed Jobs</span>
                                  <p className="text-xs text-gray-500">Automatically retry failed background jobs</p>
                                </div>
                                <button
                                  onClick={() => updateSetting('aiAgent.backgroundJobs.autoRetry', !settings.aiAgent.backgroundJobs.autoRetry)}
                                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                                    settings.aiAgent.backgroundJobs.autoRetry ? 'bg-blue-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                    settings.aiAgent.backgroundJobs.autoRetry ? 'translate-x-6' : 'translate-x-0'
                                  }`} />
                                </button>
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'git' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Git Integration</h3>
                  
                  {/* Git Integration Enable/Disable */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-green-900">Git Workflow Automation</h4>
                        <p className="text-sm text-green-700">Clone repos, auto-commit changes, and create PRs</p>
                      </div>
                      <button
                        onClick={() => updateSetting('gitIntegration.enabled', !settings.gitIntegration.enabled)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          settings.gitIntegration.enabled ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.gitIntegration.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    {!settings.gitIntegration.enabled && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Requires GitHub CLI (gh) to be installed and authenticated</span>
                      </div>
                    )}
                  </div>

                  {settings.gitIntegration.enabled && (
                    <>
                      {/* Auto Actions */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Automation Settings
                        </label>
                        <div className="space-y-4">
                          <label className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Auto Commit</span>
                              <p className="text-xs text-gray-500">Automatically commit changes when background jobs complete</p>
                            </div>
                            <button
                              onClick={() => updateSetting('gitIntegration.autoCommit', !settings.gitIntegration.autoCommit)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                                settings.gitIntegration.autoCommit ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                settings.gitIntegration.autoCommit ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Auto Pull Requests</span>
                              <p className="text-xs text-gray-500">Automatically create PRs for completed features</p>
                            </div>
                            <button
                              onClick={() => updateSetting('gitIntegration.autoPR', !settings.gitIntegration.autoPR)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                                settings.gitIntegration.autoPR ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                settings.gitIntegration.autoPR ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </button>
                          </label>
                        </div>
                      </div>

                      {/* Branch Settings */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Branch Configuration
                        </label>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Branch Prefix
                            </label>
                            <input
                              type="text"
                              value={settings.gitIntegration.branchPrefix}
                              onChange={(e) => updateSetting('gitIntegration.branchPrefix', e.target.value)}
                              placeholder="ai-feature/"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Prefix for AI-generated branches (e.g., "ai-feature/")
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Commit Message Template
                            </label>
                            <input
                              type="text"
                              value={settings.gitIntegration.commitTemplate}
                              onChange={(e) => updateSetting('gitIntegration.commitTemplate', e.target.value)}
                              placeholder="🤖 AI-Generated: {description}"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Template for commit messages. Use {"{description}"} for dynamic content.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Repository Management */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Repository Management
                        </label>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              Connected Repositories: {settings.gitIntegration.repositories.length}
                            </span>
                            <Button size="sm" variant="outline">
                              Add Repository
                            </Button>
                          </div>
                          
                          {settings.gitIntegration.repositories.length === 0 ? (
                            <p className="text-sm text-gray-500">
                              No repositories connected. Use the main interface to clone and work with repositories.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {settings.gitIntegration.repositories.map((repo, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                                  <span>{repo}</span>
                                  <Button size="sm" variant="ghost">Remove</Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Monitoring</h3>
                  
                  {/* React Scan */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-green-900">React Scan</h4>
                        <p className="text-sm text-green-700">Monitor component performance and detect issues</p>
                      </div>
                      <button
                        onClick={() => updateSetting('performance.reactScanEnabled', !settings.performance.reactScanEnabled)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          settings.performance.reactScanEnabled ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.performance.reactScanEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    {settings.performance.reactScanEnabled && (
                      <div className="text-sm text-green-600">
                        <Monitor className="w-4 h-4 inline mr-1" />
                        Active in development mode
                      </div>
                    )}
                  </div>

                  {/* Other Performance Settings */}
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Metrics Collection</span>
                        <p className="text-xs text-gray-500">Collect performance metrics for analysis</p>
                      </div>
                      <button
                        onClick={() => updateSetting('performance.metricsCollection', !settings.performance.metricsCollection)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          settings.performance.metricsCollection ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.performance.metricsCollection ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Auto Optimization</span>
                        <p className="text-xs text-gray-500">Automatically apply safe performance optimizations</p>
                      </div>
                      <button
                        onClick={() => updateSetting('performance.autoOptimization', !settings.performance.autoOptimization)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          settings.performance.autoOptimization ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.performance.autoOptimization ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
                  
                  <div className="space-y-4">
                    {Object.entries(settings.privacy).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <p className="text-xs text-gray-500">
                            {key === 'analytics' && 'Help improve the product with usage analytics'}
                            {key === 'errorReporting' && 'Automatically report errors for faster fixes'}
                            {key === 'usageData' && 'Share anonymized usage patterns'}
                          </p>
                        </div>
                        <button
                          onClick={() => updateSetting(`privacy.${key}`, !value)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${
                            value ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </label>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Data Export</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Download all your data including projects, settings, and usage history.
                    </p>
                    <Button size="sm" variant="outline">
                      Export My Data
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            {saved && (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Settings saved!</span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
