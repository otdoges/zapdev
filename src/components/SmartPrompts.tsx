import React, { useState, useMemo } from 'react';
import { sanitizeText } from '@/components/ui/SafeText';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Lightbulb,
  Code2,
  Globe,
  Database,
  Cpu,
  Sparkles,
  Zap,
  Target,
  Rocket,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface SmartPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: React.ReactNode;
  tags: string[];
}

interface SmartPromptsProps {
  onPromptSelect: (prompt: string) => void;
  isVisible: boolean;
}

export function SmartPrompts({ onPromptSelect, isVisible }: SmartPromptsProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customPrompt, setCustomPrompt] = useState('');

  const smartPrompts = useMemo(() => [
    {
      id: 'react-component',
      title: 'React Component Builder',
      description: 'Create a modern React component with TypeScript support, proper props interface, and best practices.',
      prompt: 'Create a React TypeScript component with the following requirements: [describe your component]. Include proper prop types, default props, and follow React best practices.',
      category: 'web',
      difficulty: 'Beginner' as const,
      icon: <Code2 className="w-4 h-4" />,
      tags: ['React', 'TypeScript', 'Component']
    },
    {
      id: 'api-integration',
      title: 'API Integration Helper',
      description: 'Build robust API integration with error handling, loading states, and TypeScript support.',
      prompt: 'Create an API integration for [describe your API]. Include error handling, loading states, retry logic, and proper TypeScript types for the response.',
      category: 'web',
      difficulty: 'Intermediate' as const,
      icon: <Globe className="w-4 h-4" />,
      tags: ['API', 'HTTP', 'Error Handling']
    },
    {
      id: 'data-processor',
      title: 'Data Processing Pipeline',
      description: 'Build efficient data processing functions with validation, transformation, and filtering.',
      prompt: 'Create a data processing pipeline that [describe your data processing needs]. Include data validation, transformation functions, and error handling.',
      category: 'data',
      difficulty: 'Intermediate' as const,
      icon: <Database className="w-4 h-4" />,
      tags: ['Python', 'Data', 'Processing']
    },
    {
      id: 'algorithm-solver',
      title: 'Algorithm & Problem Solver',
      description: 'Implement efficient algorithms and data structures with optimal time and space complexity.',
      prompt: 'Solve this problem: [describe your problem]. Provide an efficient algorithm with explanation of time/space complexity and include test cases.',
      category: 'algorithm',
      difficulty: 'Advanced' as const,
      icon: <Cpu className="w-4 h-4" />,
      tags: ['Algorithm', 'Problem Solving', 'Optimization']
    },
    {
      id: 'ui-animation',
      title: 'UI Animation Creator',
      description: 'Design smooth animations and micro-interactions for better user experience.',
      prompt: 'Create smooth animations for [describe your UI element]. Use modern CSS animations or Framer Motion, include hover states and loading animations.',
      category: 'ui',
      difficulty: 'Intermediate' as const,
      icon: <Sparkles className="w-4 h-4" />,
      tags: ['CSS', 'Animation', 'UI/UX']
    },
    {
      id: 'automation-script',
      title: 'Automation Script Generator',
      description: 'Build automation scripts for repetitive tasks and workflow optimization.',
      prompt: 'Create an automation script that [describe your automation need]. Include error handling, logging, and make it configurable for different environments.',
      category: 'automation',
      difficulty: 'Advanced' as const,
      icon: <Zap className="w-4 h-4" />,
      tags: ['Automation', 'Scripting', 'Workflow']
    }
  ], []);

  const quickExamples = [
    'Create a todo list with drag and drop',
    'Build a responsive card component',
    'Implement user authentication flow',
    'Design a loading spinner animation',
    'Create a data visualization chart',
    'Build a file upload component'
  ];

  const categories = [
    { id: 'all', name: 'All', icon: <Target className="w-4 h-4" /> },
    { id: 'web', name: 'Web Dev', icon: <Globe className="w-4 h-4" /> },
    { id: 'data', name: 'Data', icon: <Database className="w-4 h-4" /> },
    { id: 'algorithm', name: 'Algorithms', icon: <Cpu className="w-4 h-4" /> },
    { id: 'ui', name: 'UI/UX', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'automation', name: 'Automation', icon: <Zap className="w-4 h-4" /> }
  ];

  const filteredPrompts = useMemo(() => {
    if (selectedCategory === 'all') return smartPrompts;
    return smartPrompts.filter(prompt => prompt.category === selectedCategory);
  }, [selectedCategory, smartPrompts]);

  const handlePromptClick = (prompt: SmartPrompt) => {
    onPromptSelect(sanitizeText(prompt.prompt).slice(0, 2000));
  };

  const handleQuickExample = (example: string) => {
    const clean = sanitizeText(example).replace(/\s+/g, ' ').trim();
    onPromptSelect(`Create ${clean} with modern design and best practices. Include proper styling, responsive design, and TypeScript support.`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 border-green-600';
      case 'Intermediate': return 'text-yellow-600 border-yellow-600';
      case 'Advanced': return 'text-red-600 border-red-600';
      default: return 'text-gray-600 border-gray-600';
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto p-6"
    >
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Lightbulb className="w-6 h-6 text-yellow-500" />
            </motion.div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                AI Code Generation Assistant
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Get started faster with smart prompts designed for better AI code generation
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`gap-2 transition-all duration-200 ${
                  selectedCategory === category.id 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'hover:bg-blue-50 dark:hover:bg-blue-900'
                }`}
              >
                {category.icon}
                {category.name}
              </Button>
            ))}
          </div>

          {/* Quick Examples */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Quick Examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {quickExamples.map((example, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickExample(example)}
                    className="h-auto p-2 justify-start text-left w-full"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <ArrowRight className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span className="text-xs">{example}</span>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Smart Prompts Grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Smart Prompts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrompts.map((prompt) => (
                <motion.div
                  key={prompt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => handlePromptClick(prompt)}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          {prompt.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1">
                            {prompt.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {prompt.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getDifficultyColor(prompt.difficulty)}`}
                            >
                              {prompt.difficulty}
                            </Badge>
                            {prompt.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Or write your own prompt:
            </h3>
            <div className="space-y-3">
              <Textarea
                placeholder="Describe what you want to build... e.g., 'Create a React component for a todo list with drag and drop functionality'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button
                onClick={() => {
                  const normalized = sanitizeText(customPrompt).trim();
                  if (normalized) {
                    onPromptSelect(normalized.slice(0, 4000));
                    setCustomPrompt('');
                  }
                }}
                disabled={!customPrompt.trim()}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}