'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ScoutFeaturesProps {
  onModeSelect?: (mode: 'fast' | 'deep') => void;
  onTemplateSelect?: (template: string) => void;
  currentMode?: 'fast' | 'deep';
}

export default function ScoutFeatures({ onModeSelect, onTemplateSelect, currentMode = 'fast' }: ScoutFeaturesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templates = [
    {
      id: 'research',
      name: 'Research',
      description: 'Gather information and analyze topics',
      icon: '🔍',
      prompt: 'Research this topic thoroughly and provide comprehensive insights'
    },
    {
      id: 'create',
      name: 'Create',
      description: 'Build applications and components',
      icon: '⚡',
      prompt: 'Create a modern, well-structured application'
    },
    {
      id: 'plan',
      name: 'Plan',
      description: 'Strategic planning and architecture',
      icon: '📋',
      prompt: 'Create a detailed plan and architecture for this project'
    },
    {
      id: 'analyze',
      name: 'Analyze',
      description: 'Deep analysis and code review',
      icon: '📊',
      prompt: 'Analyze this code/data and provide detailed insights'
    },
    {
      id: 'learn',
      name: 'Learn',
      description: 'Educational content and tutorials',
      icon: '🎓',
      prompt: 'Explain this concept and create educational examples'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* AI Mode Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">AI Agent Mode</h3>
        <div className="flex gap-3">
          <button
            onClick={() => onModeSelect?.('fast')}
            className={`px-4 py-3 rounded-lg border transition-all ${
              currentMode === 'fast'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="text-left">
              <div className="font-medium">⚡ Fast AF</div>
              <div className="text-sm opacity-75">Speed-first execution</div>
            </div>
          </button>
          <button
            onClick={() => onModeSelect?.('deep')}
            className={`px-4 py-3 rounded-lg border transition-all ${
              currentMode === 'deep'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="text-left">
              <div className="font-medium">🧠 Max Vibes</div>
              <div className="text-sm opacity-75">Deep reasoning mode</div>
            </div>
          </button>
        </div>
      </div>

      {/* Template System */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Jam Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((template) => (
            <motion.button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template.id);
                onTemplateSelect?.(template.prompt);
              }}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedTemplate === template.id
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{template.icon}</span>
                <span className="font-medium">{template.name}</span>
              </div>
              <p className="text-sm opacity-75">{template.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Features Info */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h4 className="text-white font-medium mb-2">🎯 Scout.new Features</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Virtual Ubuntu environment simulation</li>
          <li>• Autonomous task planning & execution</li>
          <li>• Real-time web browsing & research</li>
          <li>• Intelligent package detection</li>
          <li>• One-click deployment pipeline</li>
          <li>• Enhanced AI collaboration</li>
        </ul>
      </div>
    </div>
  );
}