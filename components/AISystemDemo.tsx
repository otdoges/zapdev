'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { 
  Brain, 
  Database, 
  Zap, 
  BarChart3, 
  CheckCircle, 
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface AISystemDemoProps {
  className?: string;
}

interface AIResponse {
  plan: {
    strategy: string;
    complexity: string;
    riskLevel: string;
    estimatedTime: number;
    steps: Array<{
      id: string;
      type: string;
      description: string;
      estimatedTime: number;
      priority: string;
    }>;
    recommendedModel: {
      modelId: string;
      confidence: number;
      reasoning: string;
    };
  };
  selectedModel: string;
  confidence: number;
  estimatedTime: number;
  steps: string[];
}

export default function AISystemDemo({ className = '' }: AISystemDemoProps) {
  const [userQuery, setUserQuery] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<'free' | 'pro'>('free');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!userQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ai-system/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery,
          subscriptionType,
          urgency,
          projectType: 'web-app',
          codebaseContext: 'Next.js 15 app with TypeScript, Tailwind CSS, and Drizzle ORM',
          currentFiles: ['app/page.tsx', 'components/DatabaseExplorer.tsx', 'lib/database/schema.ts']
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setResponse(data.data);
      } else {
        setError(data.error || 'Failed to process request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    'Create a user authentication system with login and signup',
    'Build a dashboard with charts and analytics',
    'Implement a shopping cart with payment integration',
    'Add real-time chat functionality',
    'Create a file upload system with drag and drop',
    'Build a data visualization component with filters'
  ];

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">AI System Demo</h2>
        <div className="flex gap-1 ml-auto">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">System Online</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subscription Type
          </label>
          <select
            value={subscriptionType}
            onChange={(e) => setSubscriptionType(e.target.value as 'free' | 'pro')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level
          </label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as 'low' | 'medium' | 'high')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Sample Queries */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Try a sample query:
        </label>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => setUserQuery(query)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Request
        </label>
        <Textarea
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="Describe what you want to build or implement..."
          className="resize-none"
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={loading || !userQuery.trim()}
        className="w-full mb-6"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Analyze & Plan
          </div>
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Analysis Complete</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Strategy:</span>
                <p className="text-blue-800 capitalize">{response.plan.strategy.replace('-', ' ')}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Complexity:</span>
                <p className="text-blue-800 capitalize">{response.plan.complexity}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Risk Level:</span>
                <p className="text-blue-800 capitalize">{response.plan.riskLevel}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Est. Time:</span>
                <p className="text-blue-800">{response.plan.estimatedTime} min</p>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">AI Model Selection</span>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-green-700 font-medium">Selected Model:</span>
                <p className="text-green-800">{response.selectedModel}</p>
              </div>
              <div>
                <span className="text-green-700 font-medium">Confidence:</span>
                <p className="text-green-800">{Math.round(response.confidence * 100)}%</p>
              </div>
              <div>
                <span className="text-green-700 font-medium">Reasoning:</span>
                <p className="text-green-800">{response.plan.recommendedModel.reasoning}</p>
              </div>
            </div>
          </div>

          {/* Execution Steps */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Execution Plan</span>
            </div>
            <div className="space-y-3">
              {response.plan.steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 capitalize">{step.type.replace('-', ' ')}</span>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        {step.estimatedTime} min
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{step.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        step.priority === 'high' ? 'bg-red-100 text-red-800' :
                        step.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {step.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Features Notice */}
          {subscriptionType === 'pro' && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Pro Features Enabled</span>
              </div>
              <ul className="text-purple-800 text-sm space-y-1">
                <li>• Enhanced multi-step analysis approach</li>
                <li>• Priority model selection for quality</li>
                <li>• Detailed reasoning and explanations</li>
                <li>• Advanced optimization recommendations</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
