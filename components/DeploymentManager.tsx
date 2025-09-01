'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { createId } from '@paralleldrive/cuid2';

interface DeploymentManagerProps {
  sandboxId?: string;
  chatId?: string;
  projectFiles?: any[];
  isOpen: boolean;
  onClose: () => void;
}

interface Deployment {
  _id: string;
  siteId: string;
  name: string;
  url: string;
  status: 'building' | 'ready' | 'error' | 'queued';
  createdAt: number;
  lastDeployedAt: number;
  framework?: string;
  buildLogs?: string;
  errorMessage?: string;
}

export default function DeploymentManager({
  sandboxId,
  chatId,
  projectFiles,
  isOpen,
  onClose
}: DeploymentManagerProps) {
  const { isSignedIn, user } = useUser();
  const [projectName, setProjectName] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState('nextjs');

  // Convex queries and mutations
  const deployments = useQuery(api.deployments.getUserDeployments, isSignedIn ? {} : 'skip');
  const deploymentStats = useQuery(api.deployments.getUserDeploymentStats, isSignedIn ? {} : 'skip');
  const createDeployment = useMutation(api.deployments.createDeployment);
  const deleteDeployment = useMutation(api.deployments.deleteDeployment);

  const frameworks = [
    { id: 'nextjs', name: 'Next.js', description: 'Full-stack React framework' },
    { id: 'react', name: 'React', description: 'Client-side React app' },
    { id: 'vue', name: 'Vue.js', description: 'Progressive framework' },
    { id: 'static', name: 'Static HTML', description: 'Plain HTML/CSS/JS' },
  ];

  const handleDeploy = async () => {
    if (!projectName.trim() || !sandboxId || isDeploying) return;
    
    if (!isSignedIn) {
      setDeploymentError('Please sign in to deploy projects');
      return;
    }

    // Check deployment limit
    if (deploymentStats && deploymentStats.deploymentSlots <= 0) {
      setDeploymentError('Deployment limit reached. Upgrade to Pro for unlimited deployments.');
      return;
    }

    setIsDeploying(true);
    setDeploymentError(null);

    try {
      const siteId = createId();
      
      // Call our API endpoint to handle the actual deployment
      const response = await fetch('/api/deployments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName.trim(),
          sandboxId,
          chatId,
          framework: selectedFramework,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Deployment failed');
      }

      // Create deployment record in Convex
      await createDeployment({
        siteId: result.deployment.siteId,
        name: projectName.trim(),
        url: result.deployment.url,
        vercelDeploymentId: result.deployment.deploymentId,
        sandboxId,
        chatId,
        framework: selectedFramework,
      });

      setProjectName('');
      setDeploymentError(null);
      
      // Start polling for deployment status
      pollDeploymentStatus(result.deployment.siteId);
      
    } catch (error: any) {
      console.error('Deployment failed:', error);
      setDeploymentError(error.message || 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const pollDeploymentStatus = (siteId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/deployments/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.deployment?.status === 'ready' || result.deployment?.status === 'error') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.warn('Failed to check deployment status:', error);
      }
    }, 5000); // Check every 5 seconds

    // Clear interval after 10 minutes
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
  };

  const handleDelete = async (siteId: string, vercelDeploymentId?: string) => {
    if (!confirm('Are you sure you want to delete this deployment? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from Vercel and our database
      await fetch('/api/deployments/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, vercelDeploymentId }),
      });

      // Delete from Convex
      await deleteDeployment({ siteId });

    } catch (error: any) {
      console.error('Failed to delete deployment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-400';
      case 'building': case 'queued': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'building':
      case 'queued':
        return (
          <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Deploy Project</h2>
                <p className="text-gray-400 mt-1">
                  Deploy your project to the web with one click
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Deployment stats */}
            {deploymentStats && (
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="text-gray-300">
                  <span className="text-white font-semibold">{deploymentStats.totalDeployments}</span> of{' '}
                  <span className="text-blue-400">{deploymentStats.deploymentLimit}</span> deployments used
                </div>
                <div className="text-gray-300">
                  <span className="text-green-400 font-semibold">{deploymentStats.activeDeployments}</span> active
                </div>
                <div className="text-gray-300">
                  <span className="text-yellow-400 font-semibold">{deploymentStats.buildingDeployments}</span> building
                </div>
                {deploymentStats.deploymentSlots <= 0 && (
                  <div className="text-red-400 text-sm">
                    ⚠️ Upgrade to Pro for unlimited deployments
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Deployment form */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">New Deployment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full"
                    disabled={isDeploying}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This will be used to generate your subdomain: {projectName ? `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-xxxxx.vercel.app` : 'your-project-xxxxx.vercel.app'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Framework
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {frameworks.map((framework) => (
                      <button
                        key={framework.id}
                        onClick={() => setSelectedFramework(framework.id)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedFramework === framework.id
                            ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        disabled={isDeploying}
                      >
                        <div className="text-white font-medium">{framework.name}</div>
                        <div className="text-gray-400 text-sm">{framework.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {deploymentError && (
                  <div className="p-3 bg-red-900 border border-red-700 text-red-100 text-sm rounded-lg">
                    {deploymentError}
                  </div>
                )}

                <Button
                  onClick={handleDeploy}
                  disabled={!projectName.trim() || isDeploying || (deploymentStats?.deploymentSlots || 0) <= 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isDeploying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Deploy Project
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Existing deployments */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Your Deployments</h3>
              
              {deployments === undefined ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading deployments...
                </div>
              ) : deployments && deployments.length > 0 ? (
                <div className="space-y-3">
                  {deployments.map((deployment: Deployment) => (
                    <motion.div
                      key={deployment._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(deployment.status)}
                            <div>
                              <h4 className="text-white font-medium">{deployment.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <span className={getStatusColor(deployment.status)}>
                                  {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                                </span>
                                <span>{deployment.framework || 'nextjs'}</span>
                                <span>{new Date(deployment.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {deployment.status === 'ready' && (
                            <a
                              href={deployment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                            >
                              Visit
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(deployment.siteId, deployment.vercelDeploymentId)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {deployment.errorMessage && (
                        <div className="mt-3 p-2 bg-red-900 border border-red-700 text-red-100 text-sm rounded">
                          <strong>Error:</strong> {deployment.errorMessage}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">No deployments yet</h3>
                  <p>Deploy your first project to get started!</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}