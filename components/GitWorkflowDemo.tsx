'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  GitBranch, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Zap,
  Code,
  Upload,
  Eye
} from 'lucide-react';

interface GitWorkflowDemoProps {
  className?: string;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  output?: string;
}

export default function GitWorkflowDemo({ className = '' }: GitWorkflowDemoProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [featureName, setFeatureName] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [repositoryId, setRepositoryId] = useState<string | null>(null);

  const demoSteps: WorkflowStep[] = [
    {
      id: 'clone',
      title: 'Clone Repository',
      description: 'Cloning repository using GitHub CLI',
      status: 'pending'
    },
    {
      id: 'analyze',
      title: 'Analyze Codebase',
      description: 'AI agents analyzing project structure and dependencies',
      status: 'pending'
    },
    {
      id: 'plan',
      title: 'Create Development Plan',
      description: 'Multi-agent collaboration creating implementation strategy',
      status: 'pending'
    },
    {
      id: 'implement',
      title: 'Implement Feature',
      description: 'Background agents working on feature implementation',
      status: 'pending'
    },
    {
      id: 'commit',
      title: 'Auto Commit',
      description: 'Automatically committing changes with AI-generated message',
      status: 'pending'
    },
    {
      id: 'pr',
      title: 'Create Pull Request',
      description: 'Creating PR with comprehensive description and testing notes',
      status: 'pending'
    }
  ];

  const executeWorkflow = async () => {
    if (!githubUrl || !featureName) {
      alert('Please provide both GitHub URL and feature name');
      return;
    }

    setIsRunning(true);
    setWorkflowSteps([...demoSteps]);

    try {
      // Step 1: Clone Repository
      await simulateStep('clone', async () => {
        const response = await fetch('/api/git/workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clone-repository',
            url: githubUrl
          })
        });
        
        const result = await response.json();
        if (result.success) {
          setRepositoryId(result.repositoryId);
          return `✅ Repository cloned successfully (ID: ${result.repositoryId})`;
        } else {
          throw new Error(result.error);
        }
      });

      // Step 2: Analyze Codebase
      await simulateStep('analyze', async () => {
        // In real implementation, this would trigger codebase analysis
        await new Promise(resolve => setTimeout(resolve, 2000));
        return '🔍 Codebase analyzed - React/TypeScript project detected with 23 components';
      });

      // Step 3: Create Development Plan
      await simulateStep('plan', async () => {
        // In real implementation, this would create multi-agent collaboration
        await new Promise(resolve => setTimeout(resolve, 3000));
        return '📋 Multi-agent plan created - 3 agents assigned (Architect, Developer, Reviewer)';
      });

      // Step 4: Implement Feature
      await simulateStep('implement', async () => {
        if (repositoryId) {
          await fetch('/api/git/workflow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create-branch',
              repositoryId,
              featureName
            })
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 4000));
        return `⚡ Feature "${featureName}" implemented - 5 files created/modified`;
      });

      // Step 5: Auto Commit
      await simulateStep('commit', async () => {
        if (repositoryId) {
          const commitResponse = await fetch('/api/git/workflow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'auto-commit',
              repositoryId,
              description: featureDescription,
              filesChanged: [`src/components/${featureName.replace(/\s+/g, '')}.tsx`]
            })
          });
          
          const result = await commitResponse.json();
          if (result.success && result.commitResult.success) {
            return `📝 Changes committed: ${result.commitResult.commitHash}`;
          } else {
            return '📝 Demo commit completed (simulated)';
          }
        }
        return '📝 Demo commit completed (simulated)';
      });

      // Step 6: Create PR
      await simulateStep('pr', async () => {
        if (repositoryId) {
          const prResponse = await fetch('/api/git/workflow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create-pr',
              repositoryId,
              title: `AI Feature: ${featureName}`,
              description: featureDescription
            })
          });
          
          const result = await prResponse.json();
          if (result.success && result.prResult?.success) {
            return `🔀 PR created: ${result.prResult.prUrl}`;
          } else {
            return '🔀 Demo PR creation completed (simulated)';
          }
        }
        return '🔀 Demo PR creation completed (simulated)';
      });

    } catch (error) {
      console.error('Workflow error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const simulateStep = async (stepId: string, operation: () => Promise<string>) => {
    // Update step to in_progress
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'in_progress' }
        : step
    ));

    try {
      const output = await operation();
      
      // Update step to completed
      setWorkflowSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: 'completed', output }
          : step
      ));
    } catch (error) {
      // Update step to error
      setWorkflowSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: 'error', output: error instanceof Error ? error.message : String(error) }
          : step
      ));
    }
  };

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'in_progress':
        return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <GitBranch className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Git Workflow Automation</h2>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
          Pro Feature
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Repository Setup</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isRunning}
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste any GitHub repository URL to get started
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feature Name
              </label>
              <input
                type="text"
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                placeholder="User Authentication System"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feature Description
              </label>
              <textarea
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                placeholder="Implement a complete user authentication system with login, signup, and password reset functionality using modern security practices."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                disabled={isRunning}
              />
            </div>

            <Button 
              onClick={executeWorkflow}
              disabled={isRunning || !githubUrl || !featureName}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Running Workflow...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Start Multi-Agent Workflow
                </>
              )}
            </Button>
          </div>

          {/* GitHub CLI Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              <Code className="w-4 h-4 inline mr-2" />
              GitHub CLI Setup
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>To use this feature, ensure GitHub CLI is installed:</p>
              <code className="block bg-gray-100 p-2 rounded mt-2 text-xs">
                # Install GitHub CLI<br/>
                brew install gh  # macOS<br/>
                # or: curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg<br/>
                <br/>
                # Authenticate<br/>
                gh auth login
              </code>
            </div>
          </div>
        </div>

        {/* Workflow Steps */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Progress</h3>
          
          <div className="space-y-3">
            {workflowSteps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border transition-all ${
                  step.status === 'completed' ? 'bg-green-50 border-green-200' :
                  step.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                  step.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium">
                    {index + 1}
                  </span>
                  {getStatusIcon(step.status)}
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                </div>
                
                <p className="text-sm text-gray-600 ml-9 mb-2">
                  {step.description}
                </p>
                
                {step.output && (
                  <div className="ml-9 text-xs font-mono bg-gray-100 p-2 rounded border">
                    {step.output}
                  </div>
                )}
              </div>
            ))}
          </div>

          {workflowSteps.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Enter a GitHub URL above to start the workflow</p>
            </div>
          )}
        </div>
      </div>

      {/* Features Showcase */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Multi-Agent Collaboration</h4>
          </div>
          <p className="text-sm text-blue-700">
            Multiple AI agents work together - architect plans, developer implements, reviewer validates
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-900">Auto Commit & PR</h4>
          </div>
          <p className="text-sm text-green-700">
            Automatically commits changes and creates pull requests with detailed descriptions
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-purple-600" />
            <h4 className="font-medium text-purple-900">Real-time Monitoring</h4>
          </div>
          <p className="text-sm text-purple-700">
            Live progress tracking with detailed logs and error handling
          </p>
        </div>
      </div>

      {/* Example URLs */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Example Repository URLs</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'https://github.com/vercel/next.js',
            'https://github.com/facebook/react',
            'https://github.com/microsoft/vscode',
            'https://github.com/tailwindlabs/tailwindcss'
          ].map((url) => (
            <button
              key={url}
              onClick={() => setGithubUrl(url)}
              disabled={isRunning}
              className="text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-3 h-3" />
              {url.replace('https://github.com/', '')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}