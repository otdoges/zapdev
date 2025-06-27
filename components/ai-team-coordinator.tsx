'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Sparkles, Code, Loader, MessageSquare, Zap, Settings } from 'lucide-react';
import dynamic from 'next/dynamic';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

const WebContainerComponent = dynamic(() => import('./web-container'), {
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-[#0A0A0F] text-white/40">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-lg bg-white/5">
          <Code className="h-8 w-8" />
        </div>
        <p className="text-sm">Loading WebContainer...</p>
      </div>
    </div>
  ),
  ssr: false,
});

interface AITeamCoordinatorProps {
  onTeamStart?: (instructions: string) => void;
  className?: string;
}

interface ProjectRequest {
  description: string;
  requirements: string[];
  techStack: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

export default function AITeamCoordinator({ onTeamStart, className }: AITeamCoordinatorProps) {
  const [userRequest, setUserRequest] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectRequest, setProjectRequest] = useState<ProjectRequest | null>(null);
  const [aiInstructions, setAiInstructions] = useState('');
  const [showWebContainer, setShowWebContainer] = useState(false);

  // Process user input and extract project requirements
  const processUserRequest = useCallback(
    async (request: string) => {
      setIsProcessing(true);

      try {
        // Call real AI team coordination API
        const response = await fetch('/api/ai-team/coordinate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userRequest: request,
            step: 'analyze',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze request');
        }

        const analysisResult = await response.json();
        const analysis = analysisResult.result;

        // Convert AI analysis to our format
        const processed: ProjectRequest = {
          description: request,
          requirements: analysis.requirements?.functional || ['Modern UI', 'Responsive design'],
          techStack: analysis.techStack || ['React', 'TypeScript', 'Tailwind CSS'],
          complexity: analysis.complexity || 'moderate',
        };

        setProjectRequest(processed);

        // Generate comprehensive instructions for the AI team
        const instructions = generateAIInstructions(processed);
        setAiInstructions(instructions);

        // Start the AI team development process
        setShowWebContainer(true);
        if (onTeamStart) {
          onTeamStart(instructions);
        }
      } catch (error) {
        errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to process request:', error);
        // Fallback to local processing if API fails
        const processed = await analyzeUserRequest(request);
        setProjectRequest(processed);

        const instructions = generateAIInstructions(processed);
        setAiInstructions(instructions);

        setShowWebContainer(true);
        if (onTeamStart) {
          onTeamStart(instructions);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [onTeamStart]
  );

  // Analyze user request to extract project details
  const analyzeUserRequest = async (request: string): Promise<ProjectRequest> => {
    const lowerRequest = request.toLowerCase();

    // Extract tech stack preferences
    const techStack = [];
    if (lowerRequest.includes('react')) techStack.push('React');
    if (lowerRequest.includes('vue')) techStack.push('Vue.js');
    if (lowerRequest.includes('angular')) techStack.push('Angular');
    if (lowerRequest.includes('typescript')) techStack.push('TypeScript');
    if (lowerRequest.includes('tailwind')) techStack.push('Tailwind CSS');
    if (lowerRequest.includes('express')) techStack.push('Express');
    if (lowerRequest.includes('node')) techStack.push('Node.js');
    if (lowerRequest.includes('api')) techStack.push('REST API');
    if (lowerRequest.includes('database')) techStack.push('Database');

    // Default to React + TypeScript + Tailwind if no tech stack specified
    if (techStack.length === 0) {
      techStack.push('React', 'TypeScript', 'Tailwind CSS');
    }

    // Extract requirements
    const requirements = [];
    if (lowerRequest.includes('form')) requirements.push('Interactive forms');
    if (lowerRequest.includes('chart') || lowerRequest.includes('graph'))
      requirements.push('Data visualization');
    if (lowerRequest.includes('auth') || lowerRequest.includes('login'))
      requirements.push('Authentication');
    if (lowerRequest.includes('responsive')) requirements.push('Responsive design');
    if (lowerRequest.includes('api')) requirements.push('API integration');
    if (lowerRequest.includes('real-time') || lowerRequest.includes('websocket'))
      requirements.push('Real-time features');

    // Default requirements
    if (requirements.length === 0) {
      requirements.push('Modern UI', 'Responsive design', 'Interactive components');
    }

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
    if (lowerRequest.includes('simple') || lowerRequest.includes('basic')) {
      complexity = 'simple';
    } else if (
      lowerRequest.includes('complex') ||
      lowerRequest.includes('advanced') ||
      lowerRequest.includes('enterprise')
    ) {
      complexity = 'complex';
    }

    return {
      description: request,
      requirements,
      techStack,
      complexity,
    };
  };

  // Generate comprehensive instructions for AI team
  const generateAIInstructions = (project: ProjectRequest): string => {
    return `
Build a ${project.complexity} web application with the following specifications:

PROJECT DESCRIPTION:
${project.description}

TECHNICAL REQUIREMENTS:
${project.requirements.map((req) => `- ${req}`).join('\n')}

TECHNOLOGY STACK:
${project.techStack.map((tech) => `- ${tech}`).join('\n')}

ARCHITECTURE GUIDELINES:
- Use modern development practices
- Implement responsive design
- Ensure accessibility standards
- Add error handling and loading states
- Use proper TypeScript types
- Follow component composition patterns
- Implement clean code principles

DEPLOYMENT REQUIREMENTS:
- Set up development environment with hot reload
- Use Vite for fast development and building
- Configure proper build optimization
- Ensure cross-browser compatibility

TEAM COORDINATION:
1. System Architect: Design overall structure and dependencies
2. Frontend Developer: Create UI components and interactions
3. Backend Developer: Set up APIs and server logic (if needed)
4. DevOps Engineer: Configure build tools and development environment

Make the application production-ready with proper error handling, loading states, and user feedback.
`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRequest.trim() && !isProcessing) {
      processUserRequest(userRequest.trim());
    }
  };

  const handleReset = () => {
    setUserRequest('');
    setProjectRequest(null);
    setAiInstructions('');
    setShowWebContainer(false);
    setIsProcessing(false);
  };

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {!showWebContainer ? (
        // Initial request interface
        <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
          <div className="w-full max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 text-center"
            >
              <div className="mb-6 flex items-center justify-center gap-3">
                <Users className="h-12 w-12 text-blue-400" />
                <Sparkles className="h-8 w-8 text-yellow-400" />
                <Code className="h-12 w-12 text-green-400" />
              </div>

              <h1 className="mb-4 text-5xl font-bold text-white">AI Development Team</h1>
              <p className="mx-auto max-w-2xl text-xl text-gray-300">
                Describe what you want to build, and our AI team will collaborate to create it for
                you. Our architects, developers, and engineers work together to bring your vision to
                life.
              </p>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-lg"></div>
                <div className="relative rounded-lg border border-gray-700 bg-gray-800/90 backdrop-blur-sm">
                  <div className="border-b border-gray-700 p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-300">Project Description</span>
                    </div>
                  </div>
                  <textarea
                    value={userRequest}
                    onChange={(e) => setUserRequest(e.target.value)}
                    placeholder="Example: Build a modern todo app with React and TypeScript. I want drag-and-drop functionality, categories, and a clean design with dark mode support."
                    className="h-32 w-full resize-none bg-transparent p-4 text-white placeholder-gray-400 focus:outline-none"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={!userRequest.trim() || isProcessing}
                className="group flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-600"
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Starting AI Team...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 group-hover:animate-pulse" />
                    <span>Start AI Development Team</span>
                    <Send className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </motion.form>

            {projectRequest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 rounded-lg border border-gray-700 bg-gray-800/50 p-6"
              >
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
                  <Settings className="h-5 w-5 text-blue-400" />
                  Project Analysis
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="mb-2 font-medium text-gray-300">Tech Stack</h4>
                    <div className="space-y-1">
                      {projectRequest.techStack.map((tech, i) => (
                        <div
                          key={i}
                          className="rounded bg-gray-700/50 px-2 py-1 text-sm text-gray-400"
                        >
                          {tech}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-gray-300">Requirements</h4>
                    <div className="space-y-1">
                      {projectRequest.requirements.map((req, i) => (
                        <div
                          key={i}
                          className="rounded bg-gray-700/50 px-2 py-1 text-sm text-gray-400"
                        >
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-gray-300">Complexity</h4>
                    <div
                      className={`rounded px-2 py-1 text-sm capitalize ${
                        projectRequest.complexity === 'simple'
                          ? 'bg-green-500/20 text-green-400'
                          : projectRequest.complexity === 'moderate'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {projectRequest.complexity}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Users, title: 'System Architect', desc: 'Plans structure' },
                { icon: Code, title: 'Frontend Dev', desc: 'Builds UI/UX' },
                { icon: Settings, title: 'Backend Dev', desc: 'Creates APIs' },
                { icon: Zap, title: 'DevOps Engineer', desc: 'Handles deployment' },
              ].map((agent, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4 text-center"
                >
                  <agent.icon className="mx-auto mb-2 h-8 w-8 text-blue-400" />
                  <h4 className="text-sm font-medium text-white">{agent.title}</h4>
                  <p className="text-xs text-gray-400">{agent.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // WebContainer with AI team
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
            <div>
              <h2 className="font-semibold text-white">AI Team Development in Progress</h2>
              <p className="text-sm text-gray-400">{projectRequest?.description}</p>
            </div>
            <button
              onClick={handleReset}
              className="rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
            >
              New Project
            </button>
          </div>

          <div className="flex-1">
            <WebContainerComponent code="" aiTeamInstructions={aiInstructions} className="h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
