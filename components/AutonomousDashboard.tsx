'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, 
  GitBranch, 
  Activity, 
  Zap, 
  PlayCircle, 
  PauseCircle,
  StopCircle,
  CheckCircle, 
  AlertCircle,
  Clock,
  Users,
  GitPullRequest,
  BarChart3,
  TrendingUp,
  Server,
  Database,
  Settings,
  Monitor,
  Workflow
} from 'lucide-react';

interface AutonomousDashboardProps {
  className?: string;
}

interface TaskData {
  id: string;
  title: string;
  type: string;
  status: string;
  progress: number;
  priority: string;
  assignedAgent?: string;
  estimatedTime: number;
  createdAt: string;
}

interface JobData {
  id: string;
  name: string;
  type: string;
  status: string;
  priority: string;
  tasks: string[];
  runCount: number;
  createdAt: string;
}

interface PullRequestData {
  id: string;
  number: number;
  title: string;
  status: string;
  branch: string;
  author: string;
  createdAt: string;
  url: string;
}

interface SystemStats {
  pipeline: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    agentUtilization: number;
  };
  orchestrator: {
    totalJobs: number;
    runningJobs: number;
    completedJobs: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
  github: {
    totalPRs: number;
    openPRs: number;
    mergedPRs: number;
    automationRate: number;
  };
}

interface ProgressUpdate {
  id: string;
  type: 'task' | 'job' | 'pr' | 'system';
  entityId: string;
  status: string;
  progress: number;
  message: string;
  timestamp: string;
}

export default function AutonomousDashboard({ className = '' }: AutonomousDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'jobs' | 'prs' | 'monitoring'>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequestData[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskType, setNewTaskType] = useState<'feature-development' | 'bug-fix' | 'optimization'>('feature-development');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Parallel development form
  const [parallelFeatures, setParallelFeatures] = useState<string[]>(['']);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load stats
      const [pipelineRes, orchestratorRes, githubRes, monitorRes] = await Promise.all([
        fetch('/api/autonomous/pipeline?action=stats'),
        fetch('/api/autonomous/orchestrator?action=stats'),
        fetch('/api/github/automation?action=stats'),
        fetch('/api/monitor/realtime?action=dashboard')
      ]);

      if (pipelineRes.ok && orchestratorRes.ok && githubRes.ok) {
        const [pipelineData, orchestratorData, githubData, monitorData] = await Promise.all([
          pipelineRes.json(),
          orchestratorRes.json(),
          githubRes.json(),
          monitorRes.json()
        ]);

        setStats({
          pipeline: pipelineData.stats,
          orchestrator: orchestratorData.stats,
          github: githubData.stats
        });

        if (monitorData.success) {
          setRecentUpdates(monitorData.data.recentUpdates || []);
        }
      }

      // Load data based on active tab
      if (activeTab === 'tasks') {
        const tasksRes = await fetch('/api/autonomous/pipeline?action=tasks');
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.tasks || []);
        }
      } else if (activeTab === 'jobs') {
        const jobsRes = await fetch('/api/autonomous/orchestrator?action=jobs');
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.jobs || []);
        }
      } else if (activeTab === 'prs') {
        const prsRes = await fetch('/api/github/automation?action=pull-requests');
        if (prsRes.ok) {
          const prsData = await prsRes.json();
          setPullRequests(prsData.pullRequests || []);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    }
  };

  const submitTask = async () => {
    if (!newTaskTitle.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/autonomous/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit-task',
          title: newTaskTitle,
          description: newTaskDescription,
          type: newTaskType,
          priority: newTaskPriority,
          estimatedTime: 30,
          userQuery: `${newTaskType}: ${newTaskTitle}`,
          subscriptionType: 'pro' // Demo as pro user
        })
      });

      if (response.ok) {
        setNewTaskTitle('');
        setNewTaskDescription('');
        loadDashboardData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  const startParallelDevelopment = async () => {
    const features = parallelFeatures.filter(f => f.trim());
    if (features.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/autonomous/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parallel-development',
          features,
          subscriptionType: 'pro'
        })
      });

      if (response.ok) {
        setParallelFeatures(['']);
        loadDashboardData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start parallel development');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start parallel development');
    } finally {
      setLoading(false);
    }
  };

  const addParallelFeature = () => {
    setParallelFeatures([...parallelFeatures, '']);
  };

  const updateParallelFeature = (index: number, value: string) => {
    const updated = [...parallelFeatures];
    updated[index] = value;
    setParallelFeatures(updated);
  };

  const removeParallelFeature = (index: number) => {
    setParallelFeatures(parallelFeatures.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'merged': return 'text-green-600 bg-green-100';
      case 'running': case 'implementing': case 'open': return 'text-blue-600 bg-blue-100';
      case 'failed': case 'closed': return 'text-red-600 bg-red-100';
      case 'pending': case 'draft': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Autonomous Development Dashboard</h2>
          {stats && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(stats.orchestrator.systemHealth)}`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
              {stats.orchestrator.systemHealth.charAt(0).toUpperCase() + stats.orchestrator.systemHealth.slice(1)}
            </div>
          )}
        </div>
        <Button onClick={loadDashboardData} disabled={loading} size="sm">
          <Activity className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'tasks', label: 'Tasks', icon: Zap },
          { id: 'jobs', label: 'Jobs', icon: Workflow },
          { id: 'prs', label: 'Pull Requests', icon: GitPullRequest },
          { id: 'monitoring', label: 'Monitoring', icon: Monitor }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <Button onClick={() => setError(null)} size="sm" className="mt-2">
            Dismiss
          </Button>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-blue-900">Pipeline Status</h3>
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Active Tasks:</span>
                      <span className="font-medium">{stats.pipeline.activeTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Completed:</span>
                      <span className="font-medium">{stats.pipeline.completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Agent Utilization:</span>
                      <span className="font-medium">{Math.round(stats.pipeline.agentUtilization * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-green-900">Background Jobs</h3>
                    <Workflow className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Running Jobs:</span>
                      <span className="font-medium">{stats.orchestrator.runningJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Completed:</span>
                      <span className="font-medium">{stats.orchestrator.completedJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">System Health:</span>
                      <span className={`font-medium ${getHealthColor(stats.orchestrator.systemHealth)}`}>
                        {stats.orchestrator.systemHealth}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-purple-900">GitHub Integration</h3>
                    <GitBranch className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Open PRs:</span>
                      <span className="font-medium">{stats.github.openPRs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Merged:</span>
                      <span className="font-medium">{stats.github.mergedPRs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Automation Rate:</span>
                      <span className="font-medium">{Math.round(stats.github.automationRate)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Submit New Task */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-blue-600" />
                  Submit New Task
                </h3>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title..."
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <Textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Task description..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as any)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="feature-development">Feature Development</option>
                      <option value="bug-fix">Bug Fix</option>
                      <option value="optimization">Optimization</option>
                    </select>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <Button onClick={submitTask} disabled={loading || !newTaskTitle.trim()} className="w-full">
                    {loading ? 'Submitting...' : 'Submit Task'}
                  </Button>
                </div>
              </div>

              {/* Parallel Development */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Parallel Development (Pro)
                </h3>
                <div className="space-y-3">
                  {parallelFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateParallelFeature(index, e.target.value)}
                        placeholder={`Feature ${index + 1}...`}
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      />
                      {parallelFeatures.length > 1 && (
                        <Button
                          onClick={() => removeParallelFeature(index)}
                          size="sm"
                          variant="outline"
                          className="px-2"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button onClick={addParallelFeature} size="sm" variant="outline" className="flex-1">
                      Add Feature
                    </Button>
                    <Button
                      onClick={startParallelDevelopment}
                      disabled={loading || parallelFeatures.every(f => !f.trim())}
                      size="sm"
                      className="flex-1"
                    >
                      Start Development
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Active Tasks</h3>
              <Button onClick={() => setActiveTab('overview')} size="sm" variant="outline">
                Create New Task
              </Button>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-gray-600 capitalize">{task.type.replace('-', ' ')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Priority: {task.priority}</span>
                    <span>Progress: {task.progress}%</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No tasks found. Create a new task to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <h3 className="font-medium">Background Jobs</h3>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{job.name}</h4>
                      <p className="text-sm text-gray-600">{job.type} • {job.tasks.length} tasks</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Priority: {job.priority}</span>
                    <span>Runs: {job.runCount}</span>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No background jobs found.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prs' && (
          <div className="space-y-4">
            <h3 className="font-medium">Pull Requests</h3>
            <div className="space-y-3">
              {pullRequests.map((pr) => (
                <div key={pr.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">#{pr.number} {pr.title}</h4>
                      <p className="text-sm text-gray-600">{pr.branch} • by {pr.author}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(pr.status)}`}>
                      {pr.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Created: {new Date(pr.createdAt).toLocaleDateString()}</span>
                    <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View on GitHub
                    </a>
                  </div>
                </div>
              ))}
              {pullRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No pull requests found.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-4">
            <h3 className="font-medium">Real-time Updates</h3>
            <div className="space-y-3">
              {recentUpdates.map((update) => (
                <div key={update.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{update.message}</h4>
                      <p className="text-sm text-gray-600">{update.type} • {update.entityId}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(update.status)}`}>
                      {update.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Progress: {update.progress}%</span>
                    <span>{new Date(update.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {recentUpdates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No recent updates found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
