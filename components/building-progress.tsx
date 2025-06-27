'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Loader,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuildStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'complete';
  description?: string;
}

interface BuildingProgressProps {
  isVisible: boolean;
  currentStep?: string;
  customSteps?: BuildStep[];
  onComplete?: () => void;
  className?: string;
}

const defaultSteps: BuildStep[] = [
  {
    id: 'analyze',
    label: 'Analyzing Requirements',
    icon: <Sparkles className="h-4 w-4" />,
    status: 'pending',
    description: 'Understanding your request...',
  },
  {
    id: 'build',
    label: 'Building Components',
    icon: <Hammer className="h-4 w-4" />,
    status: 'pending',
    description: 'Creating code and files...',
  },
  {
    id: 'style',
    label: 'Adding Styles',
    icon: <Palette className="h-4 w-4" />,
    status: 'pending',
    description: 'Designing the interface...',
  },
  {
    id: 'integrate',
    label: 'Integrating Features',
    icon: <Link className="h-4 w-4" />,
    status: 'pending',
    description: 'Connecting everything together...',
  },
  {
    id: 'test',
    label: 'Testing & Validation',
    icon: <TestTube className="h-4 w-4" />,
    status: 'pending',
    description: 'Ensuring everything works...',
  },
  {
    id: 'complete',
    label: 'Ready!',
    icon: <CheckCircle className="h-4 w-4" />,
    status: 'pending',
    description: 'Your project is complete!',
  },
];

export default function BuildingProgress({
  isVisible,
  currentStep = 'analyze',
  customSteps,
  onComplete,
  className,
}: BuildingProgressProps) {
  const [steps, setSteps] = useState<BuildStep[]>(customSteps || defaultSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const stepIndex = steps.findIndex((step) => step.id === currentStep);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
    }
  }, [currentStep, steps, isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const updateSteps = () => {
      setSteps((prevSteps) =>
        prevSteps.map((step, index) => ({
          ...step,
          status:
            index < currentStepIndex
              ? 'complete'
              : index === currentStepIndex
                ? 'active'
                : 'pending',
        }))
      );
    };

    updateSteps();

    // Auto-progress through steps
    const timer = setTimeout(() => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else if (currentStepIndex === steps.length - 1) {
        // Completed all steps
        setTimeout(() => {
          onComplete?.();
        }, 1000);
      }
    }, 2000); // Each step takes 2 seconds

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps.length, isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm',
          'rounded-xl border border-slate-700/50 p-6 shadow-xl',
          'mx-auto max-w-md',
          className
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 p-2"
          >
            <Code className="h-5 w-5 text-white" />
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
                'flex items-center gap-3 rounded-lg p-3 transition-all duration-300',
                step.status === 'active'
                  ? 'border border-violet-500/30 bg-violet-500/20'
                  : step.status === 'complete'
                    ? 'border border-green-500/30 bg-green-500/20'
                    : 'border border-slate-700/30 bg-slate-800/50'
              )}
            >
              {/* Step Icon */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300',
                  step.status === 'active'
                    ? 'bg-violet-500'
                    : step.status === 'complete'
                      ? 'bg-green-500'
                      : 'bg-slate-600'
                )}
              >
                {step.status === 'active' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader className="h-4 w-4 text-white" />
                  </motion.div>
                ) : (
                  <div className="text-white">{step.icon}</div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <p
                  className={cn(
                    'font-medium transition-colors duration-300',
                    step.status === 'active'
                      ? 'text-violet-300'
                      : step.status === 'complete'
                        ? 'text-green-300'
                        : 'text-slate-400'
                  )}
                >
                  {step.label}
                </p>
                {step.status === 'active' && step.description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-sm text-slate-400"
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
                  <CheckCircle className="h-5 w-5" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm text-slate-400">
            <span>Progress</span>
            <span>{Math.round((currentStepIndex / (steps.length - 1)) * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-700">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Completion Message */}
        {currentStepIndex === steps.length - 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 rounded-lg border border-green-500/30 bg-green-500/20 p-3 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-green-300">
              <Rocket className="h-4 w-4" />
              <span className="font-medium">Project Ready!</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
