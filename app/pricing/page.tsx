"use client";

import { PricingTable } from "@/app/components/AutumnFallback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap, Sparkles } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <Zap className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              ZapDev Pricing
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the full power of AI-assisted React development. 
            Choose a plan that fits your needs and start building amazing apps instantly.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-2">
                <Sparkles className="h-8 w-8 text-yellow-500" />
              </div>
              <CardTitle>AI-Powered Development</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat with AI agents to build React applications with advanced features and real-time code generation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle>Isolated Sandboxes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Each project runs in its own secure E2B sandbox environment with persistent file storage.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-2">
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle>Autonomous Execution</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced autonomous workflows that can execute complex development tasks independently.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Autumn Pricing Table */}
        <div className="mb-16">
          <PricingTable />
        </div>

        {/* Usage Limits Information */}
        <Card className="bg-amber-50 border-amber-200 mb-8">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Usage-Based Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-800">
            <p className="mb-4">
              ZapDev uses a usage-based pricing model to ensure you only pay for what you use:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">What Counts as Usage</h4>
                <ul className="space-y-1 text-sm">
                  <li>• AI chat messages and code generations</li>
                  <li>• Sandbox creation and execution time</li>
                  <li>• Autonomous agent workflows</li>
                  <li>• File operations and storage</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">When You Hit Limits</h4>
                <ul className="space-y-1 text-sm">
                  <li>• You'll be automatically redirected here</li>
                  <li>• Upgrade instantly to continue working</li>
                  <li>• No interruption to your development flow</li>
                  <li>• All your work is safely preserved</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">What happens if I exceed my usage limits?</h4>
                <p className="text-sm text-gray-600">
                  When you reach your plan's usage limits, you'll be automatically redirected to this pricing page 
                  where you can instantly upgrade to continue your work without losing any progress.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Can I change plans anytime?</h4>
                <p className="text-sm text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                  and billing is prorated automatically.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Is my code and data secure?</h4>
                <p className="text-sm text-gray-600">
                  Absolutely. Each sandbox is isolated, your code is encrypted, and we follow industry-standard 
                  security practices to keep your projects safe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}