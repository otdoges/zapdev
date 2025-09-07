"use client";

import { useState } from 'react';
import { useCustomer } from '@/app/components/AutumnFallback';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';

export default function TestUsagePage() {
  const { customer, check, track, usage } = useCustomer();
  const { checkUsageLimit } = useUsageLimits();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testFeatures = [
    { id: 'ai_messages', name: 'AI Messages', description: 'Chat messages with AI' },
    { id: 'sandbox_creation', name: 'Sandbox Creation', description: 'Creating development sandboxes' },
    { id: 'code_execution', name: 'Code Execution', description: 'Running code in sandboxes' },
    { id: 'file_operations', name: 'File Operations', description: 'File uploads and modifications' },
    { id: 'autonomous_agents', name: 'Autonomous Agents', description: 'AI autonomous workflows' },
  ];

  const testUsageCheck = async (featureId: string) => {
    setLoading(true);
    try {
      const result = await check({ featureId });
      const newResult = {
        featureId,
        timestamp: new Date().toLocaleTimeString(),
        result,
        type: 'check'
      };
      setResults(prev => [newResult, ...prev.slice(0, 9)]);
      
      // Test the redirect logic
      checkUsageLimit(result);
    } catch (error) {
      console.error('Usage check failed:', error);
      setResults(prev => [{
        featureId,
        timestamp: new Date().toLocaleTimeString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'check'
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const testUsageTrack = async (featureId: string, value: number = 1) => {
    setLoading(true);
    try {
      const result = await track({ featureId, value });
      const newResult = {
        featureId,
        timestamp: new Date().toLocaleTimeString(),
        result,
        value,
        type: 'track'
      };
      setResults(prev => [newResult, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Usage tracking failed:', error);
      setResults(prev => [{
        featureId,
        timestamp: new Date().toLocaleTimeString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'track'
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const getUsageInfo = async () => {
    setLoading(true);
    try {
      const result = await usage();
      const newResult = {
        featureId: 'all',
        timestamp: new Date().toLocaleTimeString(),
        result,
        type: 'usage'
      };
      setResults(prev => [newResult, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Usage info failed:', error);
      setResults(prev => [{
        featureId: 'all',
        timestamp: new Date().toLocaleTimeString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'usage'
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Zap className="h-10 w-10 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Usage Limits Testing
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Test Autumn usage limits and automatic redirects to pricing page
          </p>
        </div>

        {/* Customer Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Customer Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer ID</p>
                  <p className="font-mono text-xs">{customer.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-semibold">{customer.plan || 'Free'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-green-600">{customer.status || 'Active'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Customer data not loaded</p>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Usage Testing</CardTitle>
            <CardDescription>
              Test different features to see usage limits in action. When limits are exceeded, you'll be redirected to the pricing page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {testFeatures.map((feature) => (
                <Card key={feature.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{feature.name}</CardTitle>
                    <CardDescription className="text-xs">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <Button
                      onClick={() => testUsageCheck(feature.id)}
                      disabled={loading}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                    >
                      Check Limits
                    </Button>
                    <Button
                      onClick={() => testUsageTrack(feature.id)}
                      disabled={loading}
                      size="sm"
                      className="w-full text-xs"
                    >
                      Track Usage
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={getUsageInfo} disabled={loading} variant="secondary">
                Get Usage Summary
              </Button>
              <Button onClick={() => setResults([])} variant="outline">
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Recent API responses and usage check results</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No test results yet. Try testing some features above.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <Alert key={index} className={result.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                    <AlertCircle className={`h-4 w-4 ${result.error ? 'text-red-500' : 'text-green-500'}`} />
                    <AlertDescription>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">
                          {result.type.toUpperCase()}: {result.featureId}
                        </span>
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                      </div>
                      {result.error ? (
                        <p className="text-red-700 text-sm">{result.error}</p>
                      ) : (
                        <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}