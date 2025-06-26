"use client"

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  Play,
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import dynamic from 'next/dynamic'
import ProjectTemplates from './project-templates'
import AITeamRealtime from './ai-team-realtime'
import CodeDiffViewer from './code-diff-viewer'

// Dynamically import WebContainer to avoid SSR issues
const WebContainerComponent = dynamic(() => import('./web-container'), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0A0A0F] text-white/40">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/5 flex items-center justify-center animate-pulse">
          <Play className="w-8 h-8" />
        </div>
        <p className="text-sm">Loading WebContainer...</p>
      </div>
    </div>
  ),
  ssr: false
})

interface ProjectTemplate {
  id: string
  name: string
  description: string
  instructions: string
}

interface EnhancedAITeamCoordinatorProps {
  className?: string
}

type WorkflowStep = 'templates' | 'coordination' | 'review' | 'deployment' | 'complete'

export default function EnhancedAITeamCoordinator({ 
  className 
}: EnhancedAITeamCoordinatorProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [customRequest, setCustomRequest] = useState('')
  const [coordinationResults, setCoordinationResults] = useState<any>(null)
  const [projectFiles, setProjectFiles] = useState<Record<string, { file: { contents: string } }>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle template selection
  const handleTemplateSelect = useCallback((template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setCurrentStep('coordination')
  }, [])

  // Handle custom request
  const handleCustomRequest = useCallback(() => {
    setSelectedTemplate(null)
    setCurrentStep('coordination')
  }, [])

  // Handle coordination completion
  const handleCoordinationComplete = useCallback(async (results: any) => {
    try {
      setCoordinationResults(results)
      
      // Call the AI team build API to get the actual project files
      const response = await fetch('/api/ai-team/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest: selectedTemplate?.instructions || customRequest
        })
      })

      if (!response.ok) {
        throw new Error('Failed to build project')
      }

      const buildResult = await response.json()
      
      if (buildResult.success && buildResult.projectFiles) {
        setProjectFiles(buildResult.projectFiles)
        setCurrentStep('review')
      } else {
        throw new Error('Build completed but no project files generated')
      }
    } catch (error) {
      console.error('Build error:', error)
      setError(error instanceof Error ? error.message : 'Unknown build error')
    }
  }, [selectedTemplate, customRequest])

  // Handle coordination error
  const handleCoordinationError = useCallback((errorMessage: string) => {
    setError(errorMessage)
  }, [])

  // Handle code approval
  const handleCodeApproval = useCallback((approvedFiles: Record<string, string>) => {
    // Convert approved files to the format expected by WebContainer
    const convertedFiles: Record<string, { file: { contents: string } }> = {}
    Object.entries(approvedFiles).forEach(([path, content]) => {
      convertedFiles[path] = { file: { contents: content } }
    })
    
    setProjectFiles(convertedFiles)
    setCurrentStep('deployment')
  }, [])

  // Handle code rejection
  const handleCodeRejection = useCallback(() => {
    setCurrentStep('templates')
    setSelectedTemplate(null)
    setCoordinationResults(null)
    setProjectFiles({})
    setError(null)
  }, [])

  // Handle deployment completion
  const handleDeploymentComplete = useCallback(() => {
    setCurrentStep('complete')
  }, [])

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setCurrentStep('templates')
    setSelectedTemplate(null)
    setCustomRequest('')
    setCoordinationResults(null)
    setProjectFiles({})
    setError(null)
    setIsProcessing(false)
  }, [])

  // Go back to previous step
  const goBack = useCallback(() => {
    switch (currentStep) {
      case 'coordination':
        setCurrentStep('templates')
        break
      case 'review':
        setCurrentStep('coordination')
        break
      case 'deployment':
        setCurrentStep('review')
        break
      case 'complete':
        setCurrentStep('deployment')
        break
    }
  }, [currentStep])

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { id: 'templates', label: 'Templates', completed: ['coordination', 'review', 'deployment', 'complete'].includes(currentStep) },
      { id: 'coordination', label: 'AI Team', completed: ['review', 'deployment', 'complete'].includes(currentStep) },
      { id: 'review', label: 'Review', completed: ['deployment', 'complete'].includes(currentStep) },
      { id: 'deployment', label: 'Deploy', completed: ['complete'].includes(currentStep) }
    ]

    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                ${step.completed 
                  ? 'bg-green-500 text-white' 
                  : currentStep === step.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-400'
                }
              `}>
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`ml-2 text-sm ${
                step.completed || currentStep === step.id ? 'text-white' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${
                step.completed ? 'bg-green-500' : 'bg-gray-700'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-gray-900 ${className}`}>
      {/* Header with step indicator */}
      <div className="p-6 border-b border-gray-700">
        {renderStepIndicator()}
        
        {/* Navigation */}
        {currentStep !== 'templates' && (
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            <button
              onClick={resetWorkflow}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              Start Over
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <h4 className="text-red-300 font-medium">Error occurred</h4>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-500/20 rounded"
          >
            <ArrowLeft className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentStep === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <ProjectTemplates
                onSelectTemplate={handleTemplateSelect}
                onCustomRequest={handleCustomRequest}
                className="h-full"
              />
            </motion.div>
          )}

          {currentStep === 'coordination' && (
            <motion.div
              key="coordination"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full p-6"
            >
              <AITeamRealtime
                userRequest={selectedTemplate?.instructions || customRequest}
                onComplete={handleCoordinationComplete}
                onError={handleCoordinationError}
                className="h-full"
              />
            </motion.div>
          )}

          {currentStep === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full p-6"
            >
              <CodeDiffViewer
                projectFiles={projectFiles}
                onApprove={handleCodeApproval}
                onReject={handleCodeRejection}
                className="h-full"
              />
            </motion.div>
          )}

          {currentStep === 'deployment' && (
            <motion.div
              key="deployment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <WebContainerComponent
                code=""
                aiTeamInstructions={selectedTemplate?.instructions || customRequest}
                className="h-full"
              />
            </motion.div>
          )}

          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">Project Complete!</h2>
                <p className="text-gray-400 mb-6">
                  Your AI team has successfully built and deployed your project.
                </p>
                <button
                  onClick={resetWorkflow}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200"
                >
                  Start New Project
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 