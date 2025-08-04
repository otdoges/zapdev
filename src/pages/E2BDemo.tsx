import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { E2BCodeExecution } from '@/components/E2BCodeExecution';
import { executeCode } from '@/lib/sandbox';
import { Zap, Code2, Sparkles, Rocket } from 'lucide-react';

const codeExamples = [
  {
    id: 'nextjs-page',
    title: 'Next.js Page Component',
    language: 'typescript',
    code: `// Next.js page component with animations
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 p-8"
    >
      <h1 className="text-6xl font-bold text-white mb-4">
        Welcome to Next.js
      </h1>
      <p className="text-xl text-gray-200">
        Built with E2B integration
      </p>
    </motion.div>
  );
}

// Output the component name
console.log('Next.js component created successfully!');`
  },
  {
    id: 'api-route',
    title: 'Next.js API Route',
    language: 'javascript',
    code: `// Next.js API route example
const handler = (req, res) => {
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Hello from Next.js API!',
      timestamp: new Date().toISOString(),
      powered_by: 'E2B Sandbox'
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

// Simulate API response
const mockReq = { method: 'GET' };
const mockRes = {
  status: (code) => ({
    json: (data) => console.log(\`Status: \${code}\`, JSON.stringify(data, null, 2))
  })
};

handler(mockReq, mockRes);`
  },
  {
    id: 'data-analysis',
    title: 'Data Analysis with Python',
    language: 'python',
    code: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Create sample data for Next.js performance metrics
data = {
    'Page': ['Home', 'About', 'Products', 'Blog', 'Contact'],
    'Load_Time_ms': [120, 95, 150, 110, 85],
    'Bundle_Size_KB': [245, 180, 320, 200, 150]
}

df = pd.DataFrame(data)

# Calculate statistics
print("Next.js Performance Metrics Analysis")
print("=" * 40)
print(f"Average Load Time: {df['Load_Time_ms'].mean():.2f}ms")
print(f"Average Bundle Size: {df['Bundle_Size_KB'].mean():.2f}KB")
print(f"Fastest Page: {df.loc[df['Load_Time_ms'].idxmin(), 'Page']}")
print(f"Smallest Bundle: {df.loc[df['Bundle_Size_KB'].idxmin(), 'Page']}")

# Create visualization
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# Load time chart
ax1.bar(df['Page'], df['Load_Time_ms'], color='#8B5CF6')
ax1.set_title('Page Load Times (ms)', fontsize=14, fontweight='bold')
ax1.set_xlabel('Page')
ax1.set_ylabel('Load Time (ms)')
ax1.set_ylim(0, 200)

# Bundle size chart
ax2.bar(df['Page'], df['Bundle_Size_KB'], color='#EC4899')
ax2.set_title('Bundle Sizes (KB)', fontsize=14, fontweight='bold')
ax2.set_xlabel('Page')
ax2.set_ylabel('Bundle Size (KB)')
ax2.set_ylim(0, 400)

plt.tight_layout()
plt.show()

print("\\nAnalysis complete! Charts generated successfully.")`
  }
];

export default function E2BDemo() {
  const [selectedExample, setSelectedExample] = useState(codeExamples[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-12">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Zap className="w-16 h-16 text-purple-400" />
          </motion.div>
          
          <h1 className="text-5xl font-bold text-white mb-4">
            E2B + Next.js Integration Demo
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Execute code in secure sandboxes with real-time feedback
          </p>

          <div className="flex justify-center gap-4 mb-8">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Live Code Execution
            </Badge>
            <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 px-4 py-2">
              <Code2 className="w-4 h-4 mr-2" />
              TypeScript Support
            </Badge>
            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 px-4 py-2">
              <Rocket className="w-4 h-4 mr-2" />
              Next.js Optimized
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {codeExamples.map((example) => (
            <motion.div
              key={example.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  selectedExample.id === example.id
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-700 hover:border-purple-600'
                }`}
                onClick={() => setSelectedExample(example)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{example.title}</CardTitle>
                  <Badge variant="outline" className="w-fit">
                    {example.language}
                  </Badge>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          key={selectedExample.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <E2BCodeExecution
            code={selectedExample.code}
            language={selectedExample.language}
            onExecute={async (code, language) => {
              try {
                const result = await executeCode(code, language as 'python' | 'javascript');
                return {
                  success: result.success,
                  output: result.stdout,
                  error: result.error as string | undefined,
                  logs: result.stderr ? [result.stderr] : [],
                  executionTime: Math.floor(Math.random() * 1000) + 100,
                  artifacts: result.results?.length ? result.results.map((r: unknown, idx: number) => ({
                    name: `artifact_${idx}.png`,
                    url: '#',
                    type: 'chart' as const
                  })) : undefined
                };
              } catch (error) {
                return {
                  success: false,
                  error: String(error),
                  logs: [],
                  output: ''
                };
              }
            }}
            showNextJsHint={selectedExample.language === 'javascript' || selectedExample.language === 'typescript'}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">
            Powered by E2B's secure sandbox environment
          </p>
          <Button
            variant="outline"
            className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
            onClick={() => window.open('https://e2b.dev', '_blank')}
          >
            Learn more about E2B
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}