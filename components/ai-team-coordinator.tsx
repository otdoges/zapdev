"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, 
  Users, 
  Sparkles, 
  Code, 
  Loader,
  MessageSquare,
  Zap,
  Settings
} from 'lucide-react'
import WebContainerComponent from './web-container'

interface AITeamCoordinatorProps {
  onTeamStart?: (instructions: string) => void
  className?: string
}

interface ProjectRequest {
  description: string
  requirements: string[]
  techStack: string[]
  complexity: 'simple' | 'moderate' | 'complex'
}

export default function AITeamCoordinator({ onTeamStart, className }: AITeamCoordinatorProps) {
  const [userRequest, setUserRequest] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [projectRequest, setProjectRequest] = useState<ProjectRequest | null>(null)
  const [aiInstructions, setAiInstructions] = useState('')
  const [showWebContainer, setShowWebContainer] = useState(false)

  // Process user input and extract project requirements
  const processUserRequest = useCallback(async (request: string) => {
    setIsProcessing(true)
    
    try {
      // Call real AI team coordination API
      const response = await fetch('/api/ai-team/coordinate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest: request,
          step: 'analyze'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze request')
      }
      
      const analysisResult = await response.json()
      const analysis = analysisResult.result
      
      // Convert AI analysis to our format
      const processed: ProjectRequest = {
        description: request,
        requirements: analysis.requirements?.functional || ['Modern UI', 'Responsive design'],
        techStack: analysis.techStack || ['React', 'TypeScript', 'Tailwind CSS'],
        complexity: analysis.complexity || 'moderate'
      }
      
      setProjectRequest(processed)
      
      // Generate comprehensive instructions for the AI team
      const instructions = generateAIInstructions(processed)
      setAiInstructions(instructions)
      
      // Start the AI team development process
      setShowWebContainer(true)
      if (onTeamStart) {
        onTeamStart(instructions)
      }
      
    } catch (error) {
      console.error('Failed to process request:', error)
      // Fallback to local processing if API fails
      const processed = await analyzeUserRequest(request)
      setProjectRequest(processed)
      
      const instructions = generateAIInstructions(processed)
      setAiInstructions(instructions)
      
      setShowWebContainer(true)
      if (onTeamStart) {
        onTeamStart(instructions)
      }
    } finally {
      setIsProcessing(false)
    }
  }, [onTeamStart])

  // Analyze user request to extract project details
  const analyzeUserRequest = async (request: string): Promise<ProjectRequest> => {
    const lowerRequest = request.toLowerCase()
    
    // Extract tech stack preferences
    const techStack = []
    if (lowerRequest.includes('react')) techStack.push('React')
    if (lowerRequest.includes('vue')) techStack.push('Vue.js')
    if (lowerRequest.includes('angular')) techStack.push('Angular')
    if (lowerRequest.includes('typescript')) techStack.push('TypeScript')
    if (lowerRequest.includes('tailwind')) techStack.push('Tailwind CSS')
    if (lowerRequest.includes('express')) techStack.push('Express')
    if (lowerRequest.includes('node')) techStack.push('Node.js')
    if (lowerRequest.includes('api')) techStack.push('REST API')
    if (lowerRequest.includes('database')) techStack.push('Database')
    
    // Default to React + TypeScript + Tailwind if no tech stack specified
    if (techStack.length === 0) {
      techStack.push('React', 'TypeScript', 'Tailwind CSS')
    }

    // Extract requirements
    const requirements = []
    if (lowerRequest.includes('form')) requirements.push('Interactive forms')
    if (lowerRequest.includes('chart') || lowerRequest.includes('graph')) requirements.push('Data visualization')
    if (lowerRequest.includes('auth') || lowerRequest.includes('login')) requirements.push('Authentication')
    if (lowerRequest.includes('responsive')) requirements.push('Responsive design')
    if (lowerRequest.includes('api')) requirements.push('API integration')
    if (lowerRequest.includes('real-time') || lowerRequest.includes('websocket')) requirements.push('Real-time features')
    
    // Default requirements
    if (requirements.length === 0) {
      requirements.push('Modern UI', 'Responsive design', 'Interactive components')
    }

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
    if (lowerRequest.includes('simple') || lowerRequest.includes('basic')) {
      complexity = 'simple'
    } else if (lowerRequest.includes('complex') || lowerRequest.includes('advanced') || 
               lowerRequest.includes('enterprise')) {
      complexity = 'complex'
    }

    return {
      description: request,
      requirements,
      techStack,
      complexity
    }
  }

  // Generate comprehensive instructions for AI team
  const generateAIInstructions = (project: ProjectRequest): string => {
    return `
Build a ${project.complexity} web application with the following specifications:

PROJECT DESCRIPTION:
${project.description}

TECHNICAL REQUIREMENTS:
${project.requirements.map(req => `- ${req}`).join('\n')}

TECHNOLOGY STACK:
${project.techStack.map(tech => `- ${tech}`).join('\n')}

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
`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userRequest.trim() && !isProcessing) {
      processUserRequest(userRequest.trim())
    }
  }

  const handleReset = () => {
    setUserRequest('')
    setProjectRequest(null)
    setAiInstructions('')
    setShowWebContainer(false)
    setIsProcessing(false)
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {!showWebContainer ? (
        // Initial request interface
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
          <div className="max-w-4xl w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <Users className="w-12 h-12 text-blue-400" />
                <Sparkles className="w-8 h-8 text-yellow-400" />
                <Code className="w-12 h-12 text-green-400" />
              </div>
              
              <h1 className="text-5xl font-bold text-white mb-4">
                AI Development Team
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Describe what you want to build, and our AI team will collaborate to create it for you.
                Our architects, developers, and engineers work together to bring your vision to life.
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-lg"></div>
                <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300 font-medium">Project Description</span>
                    </div>
                  </div>
                  <textarea
                    value={userRequest}
                    onChange={(e) => setUserRequest(e.target.value)}
                    placeholder="Example: Build a modern todo app with React and TypeScript. I want drag-and-drop functionality, categories, and a clean design with dark mode support."
                    className="w-full h-32 p-4 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={!userRequest.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                         disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed
                         text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200
                         flex items-center justify-center gap-3 group"
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Starting AI Team...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 group-hover:animate-pulse" />
                    <span>Start AI Development Team</span>
                    <Send className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.form>

            {projectRequest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 bg-gray-800/50 rounded-lg p-6 border border-gray-700"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Project Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-gray-300 font-medium mb-2">Tech Stack</h4>
                    <div className="space-y-1">
                      {projectRequest.techStack.map((tech, i) => (
                        <div key={i} className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                          {tech}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-gray-300 font-medium mb-2">Requirements</h4>
                    <div className="space-y-1">
                      {projectRequest.requirements.map((req, i) => (
                        <div key={i} className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-gray-300 font-medium mb-2">Complexity</h4>
                    <div className={`text-sm px-2 py-1 rounded capitalize ${
                      projectRequest.complexity === 'simple' ? 'bg-green-500/20 text-green-400' :
                      projectRequest.complexity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {projectRequest.complexity}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, title: 'System Architect', desc: 'Plans structure' },
                { icon: Code, title: 'Frontend Dev', desc: 'Builds UI/UX' },
                { icon: Settings, title: 'Backend Dev', desc: 'Creates APIs' },
                { icon: Zap, title: 'DevOps Engineer', desc: 'Handles deployment' }
              ].map((agent, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/50"
                >
                  <agent.icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h4 className="text-white font-medium text-sm">{agent.title}</h4>
                  <p className="text-gray-400 text-xs">{agent.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // WebContainer with AI team
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold">AI Team Development in Progress</h2>
              <p className="text-gray-400 text-sm">{projectRequest?.description}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              New Project
            </button>
          </div>
          
          <div className="flex-1">
            <WebContainerComponent
              code=""
              aiTeamInstructions={aiInstructions}
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  )
} 