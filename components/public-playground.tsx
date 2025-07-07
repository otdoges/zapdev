'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useRouter } from 'next/navigation';

interface DemoResult {
  prompt: string;
  preview: string;
  description: string;
  code: string;
}

const demoResults: DemoResult[] = [
  {
    prompt: "A modern SaaS pricing page with three tiers and testimonials",
    preview: "/api/placeholder/600/400", // We'll replace with actual screenshots
    description: "Clean pricing page with gradient cards, testimonials carousel, and responsive design",
    code: `<div className="max-w-7xl mx-auto px-4 py-16">
  <div className="text-center mb-16">
    <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
    <p className="text-gray-600 text-lg">Start free, scale as you grow</p>
  </div>
  <div className="grid md:grid-cols-3 gap-8">
    {plans.map((plan) => (
      <PricingCard key={plan.name} {...plan} />
    ))}
  </div>
</div>`
  },
  {
    prompt: "A sleek dashboard with charts and analytics",
    preview: "/api/placeholder/600/400",
    description: "Data dashboard with interactive charts, metrics cards, and sidebar navigation",
    code: `<div className="flex h-screen bg-gray-50">
  <Sidebar />
  <main className="flex-1 p-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
    <ChartSection />
  </main>
</div>`
  },
  {
    prompt: "A beautiful landing page for a coffee shop",
    preview: "/api/placeholder/600/400", 
    description: "Warm landing page with hero image, menu preview, and location details",
    code: `<div className="min-h-screen bg-amber-50">
  <HeroSection />
  <MenuPreview />
  <AboutSection />
  <LocationSection />
  <Footer />
</div>`
  }
];

export default function PublicPlayground() {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<DemoResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!currentPrompt.trim()) return;

    setIsGenerating(true);
    setShowResult(false);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find the best matching demo result or use the first one
    const matchingResult = demoResults.find(result => 
      currentPrompt.toLowerCase().includes('pricing') && result.prompt.includes('pricing') ||
      currentPrompt.toLowerCase().includes('dashboard') && result.prompt.includes('dashboard') ||
      currentPrompt.toLowerCase().includes('coffee') && result.prompt.includes('coffee')
    ) || demoResults[0];

    setCurrentResult(matchingResult);
    setIsGenerating(false);
    setShowResult(true);
  };

  const tryExamplePrompt = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  return (
    <section id="playground" className="relative py-20 bg-gradient-to-b from-[#0D0D10] to-[#1A1A20]">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Try ZapDev <span className="text-gradient">Right Now</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Type any UI prompt below and see how ZapDev would generate production-ready code. 
            No signup required for this demo!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Input Section */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Describe your UI:
              </label>
              <Textarea
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                placeholder="e.g., A modern SaaS pricing page with three tiers and testimonials"
                className="min-h-[120px] bg-[#1E1E24] border-[#2A2A32] text-white placeholder-gray-400 focus:border-[#6C52A0] resize-none"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!currentPrompt.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] py-3 text-lg font-medium"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating UI...
                </>
              ) : (
                'Generate UI Preview'
              )}
            </Button>

            {/* Example Prompts */}
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {demoResults.map((result, index) => (
                  <Button
                    key={index}
                    onClick={() => tryExamplePrompt(result.prompt)}
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#2A2A32] text-gray-300 hover:border-[#6C52A0] hover:text-white"
                  >
                    {result.prompt.substring(0, 30)}...
                  </Button>
                ))}
              </div>
            </div>

            {/* CTA for full access */}
            <div className="p-4 bg-[#1E1E24] rounded-lg border border-[#2A2A32]">
              <p className="text-sm text-gray-300 mb-3">
                Love what you see? Get unlimited generations and full WebContainer development environment:
              </p>
              <Button
                onClick={() => router.push('/auth')}
                className="w-full bg-gradient-to-r from-[#A0527C] to-[#6C52A0] hover:from-[#B0627C] hover:to-[#7C62B0]"
              >
                Sign Up for Full Access
              </Button>
            </div>
          </motion.div>

          {/* Output Section */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-[#1E1E24] rounded-lg border border-[#2A2A32] overflow-hidden">
              <div className="p-4 border-b border-[#2A2A32]">
                <h3 className="text-lg font-semibold text-white">Generated Result</h3>
              </div>
              
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      <div className="animate-spin mx-auto mb-4 h-8 w-8 border-2 border-[#6C52A0] border-t-transparent rounded-full"></div>
                      <p className="text-gray-400">Analyzing your prompt...</p>
                    </motion.div>
                  ) : showResult && currentResult ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {/* Preview Image */}
                      <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
                        <div className="text-gray-500 text-center">
                          <div className="text-2xl mb-2">🎨</div>
                          <p className="text-sm">UI Preview</p>
                          <p className="text-xs text-gray-400 mt-1">{currentResult.description}</p>
                        </div>
                      </div>

                      {/* Generated Code Preview */}
                      <div className="bg-[#0D0D10] rounded-lg p-4 border border-[#2A2A32]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Generated React/Tailwind Code:</span>
                          <Button size="sm" variant="outline" className="text-xs border-[#2A2A32]">
                            Copy Code
                          </Button>
                        </div>
                        <pre className="text-sm text-green-400 overflow-x-auto">
                          <code>{currentResult.code}</code>
                        </pre>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      <div className="text-4xl mb-4">⚡</div>
                      <p className="text-gray-400">Enter a prompt to see ZapDev in action</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 