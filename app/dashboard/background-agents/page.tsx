"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

type BackgroundAgentTask = Doc<"backgroundAgentTasks">;
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  GitBranch, 
  Plus, 
  Settings, 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  PlayCircle,
  PauseCircle,
  Trash2,
  ExternalLink,
  Code2,
  Shield,
  Zap,
  FileSearch,
  Bug,
  TestTube,
  FileText,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { BackgroundAgentSwitch } from "@/components/ui/background-agent-switch";

const taskTypeIcons = {
  code_review: <Code2 className="w-4 h-4" />,
  dependency_update: <TrendingUp className="w-4 h-4" />,
  performance_optimization: <Zap className="w-4 h-4" />,
  security_scan: <Shield className="w-4 h-4" />,
  documentation: <FileText className="w-4 h-4" />,
  test_generation: <TestTube className="w-4 h-4" />,
  bug_fix: <Bug className="w-4 h-4" />,
  feature_enhancement: <Sparkles className="w-4 h-4" />
};

const taskTypeLabels = {
  code_review: "Code Review",
  dependency_update: "Dependency Update",
  performance_optimization: "Performance Optimization",
  security_scan: "Security Scan",
  documentation: "Documentation",
  test_generation: "Test Generation",
  bug_fix: "Bug Fix",
  feature_enhancement: "Feature Enhancement"
};

export default function BackgroundAgentsPage() {
  const { user } = useUser();
  const userId = user?.id || "";
  
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  
  const subscription = useQuery(api.billing.getUserSubscription, 
    user ? { userId } : "skip"
  );
  
  const settings = useQuery(api.backgroundAgents.getSettings,
    user ? { userId } : "skip"
  );
  
  const tasks = useQuery(api.backgroundAgents.getTasks,
    user ? { userId, limit: 50 } : "skip"
  );
  
  const stats = useQuery(api.backgroundAgents.getTaskStats,
    user ? { userId } : "skip"
  );
  
  const isPro = subscription?.planType === "pro" || subscription?.planType === "enterprise";
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isPro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Background AI Agents
            </h1>
            
            <p className="text-gray-600 mb-8">
              Upgrade to Pro to unlock autonomous AI agents that work on your code 24/7
            </p>
            
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Upgrade to Pro
              <Sparkles className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Background AI Agents</h1>
                <p className="text-gray-600">Autonomous AI working on your code 24/7</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <BackgroundAgentSwitch className="mr-4" />
              
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Tasks"
            value={stats?.total || 0}
            icon={<FileSearch className="w-5 h-5 text-orange-500" />}
            color="orange"
          />
          <StatsCard
            title="Active"
            value={(stats?.pending || 0) + (stats?.running || 0)}
            icon={<PlayCircle className="w-5 h-5 text-blue-500" />}
            color="blue"
          />
          <StatsCard
            title="Completed"
            value={stats?.completed || 0}
            icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
            color="green"
          />
          <StatsCard
            title="Today's Tasks"
            value={stats?.todayTasks || 0}
            icon={<Calendar className="w-5 h-5 text-purple-500" />}
            color="purple"
          />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("active")}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === "active"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Active Tasks
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === "history"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              History
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tasks List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {tasks && tasks.length > 0 ? (
            tasks
              .filter(task => {
                if (activeTab === "active") {
                  return task.status === "pending" || task.status === "running";
                }
                return task.status === "completed" || task.status === "failed" || task.status === "cancelled";
              })
              .map(task => (
                <TaskCard key={task._id} task={task} />
              ))
          ) : (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSearch className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-6">Create your first background agent task to get started</p>
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* New Task Modal */}
      <NewTaskModal 
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        userId={userId}
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userId={userId}
        settings={settings}
      />
    </div>
  );
}

function StatsCard({ title, value, icon, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "orange" | "blue" | "green" | "purple";
}) {
  const bgColors = {
    orange: "bg-orange-50",
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50"
  };
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 ${bgColors[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}

function TaskCard({ task }: { task: BackgroundAgentTask }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    running: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800"
  };
  
  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    running: <Loader2 className="w-4 h-4 animate-spin" />,
    completed: <CheckCircle2 className="w-4 h-4" />,
    failed: <XCircle className="w-4 h-4" />,
    cancelled: <AlertCircle className="w-4 h-4" />
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            {taskTypeIcons[task.type]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{task.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <a
                href={task.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <GitBranch className="w-3 h-3" />
                {task.githubRepo.replace("https://github.com/", "")}
              </a>
              {task.pullRequestUrl && (
                <a
                  href={task.pullRequestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View PR
                </a>
              )}
            </div>
          </div>
        </div>
        
        <div className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
          ${statusColors[task.status]}
        `}>
          {statusIcons[task.status]}
          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </div>
      </div>
      
      {task.result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{task.result.summary}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
            <span>{task.result.filesModified} files modified</span>
            <span className="text-green-600">+{task.result.linesAdded}</span>
            <span className="text-red-600">-{task.result.linesRemoved}</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
        {task.completedAt && (
          <span>Completed {new Date(task.completedAt).toLocaleDateString()}</span>
        )}
      </div>
    </motion.div>
  );
}

function NewTaskModal({ isOpen, onClose, userId }: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}) {
  const [taskType, setTaskType] = useState<string>("code_review");
  const [priority, setPriority] = useState<string>("medium");
  const [githubRepo, setGithubRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const createTask = useMutation(api.backgroundAgents.createTask);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!githubRepo || !title || !description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Validate GitHub URL
    const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
    if (!githubUrlRegex.test(githubRepo)) {
      toast.error("Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)");
      return;
    }
    
    setIsCreating(true);
    try {
      await createTask({
        userId,
        type: taskType as any,
        priority: priority as any,
        githubRepo,
        branch,
        title,
        description,
      });
      
      toast.success("Task created successfully!");
      onClose();
      
      // Reset form
      setTaskType("code_review");
      setPriority("medium");
      setGithubRepo("");
      setBranch("main");
      setTitle("");
      setDescription("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Task</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(taskTypeLabels).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTaskType(value)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-left
                      ${taskType === value
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded flex items-center justify-center
                        ${taskType === value ? "bg-orange-100" : "bg-gray-100"}
                      `}>
                        {taskTypeIcons[value]}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex gap-3">
                {["low", "medium", "high"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`
                      px-4 py-2 rounded-lg font-medium text-sm transition-all
                      ${priority === p
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* GitHub Repository */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Only GitHub repository URLs are supported
              </p>
            </div>
            
            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fix authentication bug"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what the AI agent should do..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className={`
                  px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg
                  hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2
                `}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SettingsModal({ isOpen, onClose, userId, settings }: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  settings: any;
}) {
  const [mode, setMode] = useState(settings?.mode || "manual");
  const [githubRepos, setGithubRepos] = useState<string[]>(settings?.githubRepos || []);
  const [newRepo, setNewRepo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const updateSettings = useMutation(api.backgroundAgents.updateSettings);
  const addRepo = useMutation(api.backgroundAgents.addGitHubRepo);
  const removeRepo = useMutation(api.backgroundAgents.removeGitHubRepo);

  // Keep local state in sync with latest server settings when modal opens or settings change
  useEffect(() => {
    if (!isOpen || !settings) return;
    setMode(settings.mode ?? "manual");
    setGithubRepos(settings.githubRepos ?? []);
  }, [isOpen, settings]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        userId,
        mode: mode as any,
      });
      toast.success("Settings saved successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddRepo = async () => {
    if (!newRepo) return;
    
    const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
    if (!githubUrlRegex.test(newRepo)) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }
    
    try {
      await addRepo({ userId, repoUrl: newRepo });
      setGithubRepos([...githubRepos, newRepo]);
      setNewRepo("");
      toast.success("Repository added successfully!");
    } catch (error) {
      toast.error("Failed to add repository");
    }
  };
  
  const handleRemoveRepo = async (repo: string) => {
    try {
      await removeRepo({ userId, repoUrl: repo });
      setGithubRepos(githubRepos.filter(r => r !== repo));
      toast.success("Repository removed successfully!");
    } catch (error) {
      toast.error("Failed to remove repository");
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Agent Settings</h2>
          
          <div className="space-y-6">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Execution Mode
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50">
                  <input
                    type="radio"
                    value="manual"
                    checked={mode === "manual"}
                    onChange={(e) => setMode(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Manual</div>
                    <div className="text-sm text-gray-600">Tasks run only when you create them</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50">
                  <input
                    type="radio"
                    value="auto"
                    checked={mode === "auto"}
                    onChange={(e) => setMode(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Automatic</div>
                    <div className="text-sm text-gray-600">AI detects when to run tasks based on repository activity</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50">
                  <input
                    type="radio"
                    value="scheduled"
                    checked={mode === "scheduled"}
                    onChange={(e) => setMode(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Scheduled</div>
                    <div className="text-sm text-gray-600">Run tasks on a regular schedule</div>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Allowed Repositories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed GitHub Repositories
              </label>
              <div className="space-y-2 mb-4">
                {githubRepos.length > 0 ? (
                  githubRepos.map((repo) => (
                    <div key={repo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <a
                        href={repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
                      >
                        <GitBranch className="w-4 h-4" />
                        {repo.replace("https://github.com/", "")}
                      </a>
                      <button
                        onClick={() => handleRemoveRepo(repo)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No repositories added yet
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRepo}
                  onChange={(e) => setNewRepo(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  onClick={handleAddRepo}
                  className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Restrictions
              </label>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <ul className="space-y-2 text-sm text-amber-800">
                  {settings?.restrictions?.map((restriction: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {restriction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg
                  hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
