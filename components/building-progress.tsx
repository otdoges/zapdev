"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Hammer, 
  Settings, 
  Palette, 
  Link, 
  TestTube, 
  CheckCircle, 
  Rocket,
  Code,
  Sparkles,
  Loader
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BuildStep {
  id: string
  label: string
  icon: React.ReactNode
  status: 'pending' | 'active' | 'complete'
  description?: string
}

interface BuildingProgressProps {
  isVisible: boolean
  currentStep?: string
  customSteps?: BuildStep[]
  onComplete?: () => void
  className?: string
}

const defaultSteps: BuildStep[] = [
  {
    id: 'analyze',
    label: 'Analyzing Requirements',
    icon: <Sparkles className="w-4 h-4" />,
    status: 'pending',
    description: 'Understanding your request...'
  },
  {
    id: 'build',
    label: 'Building Components',
    icon: <Hammer className="w-4 h-4" />,
    status: 'pending',
    description: 'Creating code and files...'
  },
  {
    id: 'style',
    label: 'Adding Styles',
    icon: <Palette className="w-4 h-4" />,
    status: 'pending',
    description: 'Designing the interface...'
  },
  {
    id: 'integrate',
    label: 'Integrating Features',
    icon: <Link className="w-4 h-4" />,
    status: 'pending',
    description: 'Connecting everything together...'
  },
  {
    id: 'test',
    label: 'Testing & Validation',
    icon: <TestTube className="w-4 h-4" />,
    status: 'pending',
    description: 'Ensuring everything works...'
  },
  {
    id: 'complete',
    label: 'Ready!',
    icon: <CheckCircle className="w-4 h-4" />,
    status: 'pending',
    description: 'Your project is complete!'
  }
]

export default function BuildingProgress({ 
  isVisible, 
  currentStep = 'analyze',
  customSteps,
  onComplete,
  className 
}: BuildingProgressProps) {
  const [steps, setSteps] = useState<BuildStep[]>(customSteps || defaultSteps)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    const stepIndex = steps.findIndex(step => step.id === currentStep)
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex)
    }
  }, [currentStep, steps, isVisible])

  useEffect(() => {
    if (!isVisible) return

    const updateSteps = () => {
      setSteps(prevSteps => 
        prevSteps.map((step, index) => ({
          ...step,
          status: index < currentStepIndex ? 'complete' : 
                 index === currentStepIndex ? 'active' : 'pending'
        }))
      )
    }

    updateSteps()

    // Auto-progress through steps
    const timer = setTimeout(() => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1)
      } else if (currentStepIndex === steps.length - 1) {
        // Completed all steps
        setTimeout(() => {
          onComplete?.()
        }, 1000)
      }
    }, 2000) // Each step takes 2 seconds

    return () => clearTimeout(timer)
  }, [currentStepIndex, steps.length, isVisible, onComplete])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm",
          "border border-slate-700/50 rounded-xl p-6 shadow-xl",
          "max-w-md mx-auto",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg"
          >
            <Code className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-white">ZapDev Building</h3>
            <p className="text-sm text-slate-400">Creating your project...</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                step.status === 'active' ? 'bg-violet-500/20 border border-violet-500/30' :
                step.status === 'complete' ? 'bg-green-500/20 border border-green-500/30' :
                'bg-slate-800/50 border border-slate-700/30'
              )}
            >
              {/* Step Icon */}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                step.status === 'active' ? 'bg-violet-500' :
                step.status === 'complete' ? 'bg-green-500' :
                'bg-slate-600'
              )}>
                {step.status === 'active' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader className="w-4 h-4 text-white" />
                  </motion.div>
                ) : (
                  <div className="text-white">
                    {step.icon}
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <p className={cn(
                  "font-medium transition-colors duration-300",
                  step.status === 'active' ? 'text-violet-300' :
                  step.status === 'complete' ? 'text-green-300' :
                  'text-slate-400'
                )}>
                  {step.label}
                </p>
                {step.status === 'active' && step.description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-slate-400 mt-1"
                  >
                    {step.description}
                  </motion.p>
                )}
              </div>

              {/* Status Indicator */}
              {step.status === 'complete' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400"
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Progress</span>
            <span>{Math.round((currentStepIndex / (steps.length - 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Completion Message */}
        {currentStepIndex === steps.length - 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-center"
          >
            <div className="flex items-center justify-center gap-2 text-green-300">
              <Rocket className="w-4 h-4" />
              <span className="font-medium">Project Ready!</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
} 