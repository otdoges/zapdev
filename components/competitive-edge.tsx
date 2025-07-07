'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

interface ComparisonFeature {
  feature: string;
  zapdev: string;
  others: string;
  zapdevIcon: string;
  othersIcon: string;
}

const comparisonFeatures: ComparisonFeature[] = [
  {
    feature: "Design System Freedom",
    zapdev: "Pure Tailwind/React - your code, your style",
    others: "Locked into proprietary design systems",
    zapdevIcon: "🎨",
    othersIcon: "🔒"
  },
  {
    feature: "Code Ownership",
    zapdev: "Export clean, readable code you actually own",
    others: "Vendor lock-in with platform dependencies", 
    zapdevIcon: "💎",
    othersIcon: "⛓️"
  },
  {
    feature: "Development Environment",
    zapdev: "Full WebContainer with live preview & terminal",
    others: "Limited preview environments",
    zapdevIcon: "🚀",
    othersIcon: "👀"
  },
  {
    feature: "AI Team Approach", 
    zapdev: "Specialized AI agents (Architect, Frontend, DevOps)",
    others: "Single AI model for everything",
    zapdevIcon: "👥",
    othersIcon: "🤖"
  },
  {
    feature: "Production Ready",
    zapdev: "Production-grade code with best practices",
    others: "Prototype-quality code needing refactoring",
    zapdevIcon: "⚡",
    othersIcon: "🛠️"
  }
];

const differentiators = [
  {
    icon: "🎯",
    title: "No Vendor Lock-in",
    description: "Unlike v0 or Lovable, your code is completely portable. Pure React + Tailwind that works anywhere."
  },
  {
    icon: "🚀", 
    title: "Full Development Stack",
    description: "Not just UI generation - complete development environment with WebContainers, terminals, and live preview."
  },
  {
    icon: "👨‍💻",
    title: "AI Development Team",
    description: "Multiple specialized AI agents working together, not just a single model trying to do everything."
  },
  {
    icon: "💎",
    title: "Production Quality",
    description: "Code you'd actually ship to production, with proper architecture, error handling, and best practices."
  }
];

export default function CompetitiveEdge() {
  const router = useRouter();

  return (
    <section className="py-20 bg-gradient-to-b from-[#0D0D10] to-[#1A1A20]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose <span className="text-gradient">ZapDev</span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We're not just another AI UI builder. Here's what makes ZapDev fundamentally different 
            from tools like v0, Lovable, and other platforms.
          </p>
        </motion.div>

        {/* Key Differentiators */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {differentiators.map((item, index) => (
            <motion.div
              key={index}
              className="bg-[#1E1E24] rounded-xl border border-[#2A2A32] p-6 text-center hover:border-[#6C52A0] transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Detailed Comparison */}
        <motion.div
          className="bg-[#1E1E24] rounded-2xl border border-[#2A2A32] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="p-6 border-b border-[#2A2A32] text-center">
            <h3 className="text-2xl font-bold text-white mb-2">ZapDev vs. The Competition</h3>
            <p className="text-gray-400">See how we stack up against other AI UI builders</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0D0D10]">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">Feature</th>
                  <th className="text-center p-4 text-[#A0527C] font-semibold">ZapDev</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Others (v0, Lovable, etc.)</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <motion.tr
                    key={index}
                    className="border-t border-[#2A2A32] hover:bg-[#1A1A1F]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <td className="p-4">
                      <div className="font-medium text-white">{feature.feature}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-[#A0527C]">
                        <span className="text-lg">{feature.zapdevIcon}</span>
                        <span className="text-sm font-medium">{feature.zapdev}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <span className="text-lg">{feature.othersIcon}</span>
                        <span className="text-sm">{feature.others}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Code Freedom Section */}
        <motion.div 
          className="mt-20 grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div>
            <h3 className="text-3xl font-bold text-white mb-6">
              Your Code, <span className="text-gradient">Your Freedom</span>
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-[#A0527C] text-xl">✓</span>
                <div>
                  <p className="text-white font-medium">Pure React + Tailwind CSS</p>
                  <p className="text-gray-400 text-sm">No proprietary components or design systems</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#A0527C] text-xl">✓</span>
                <div>
                  <p className="text-white font-medium">Export & Deploy Anywhere</p>
                  <p className="text-gray-400 text-sm">Vercel, Netlify, your own servers - it just works</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#A0527C] text-xl">✓</span>
                <div>
                  <p className="text-white font-medium">Readable, Maintainable Code</p>
                  <p className="text-gray-400 text-sm">Code your team can actually understand and modify</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#A0527C] text-xl">✓</span>
                <div>
                  <p className="text-white font-medium">No Monthly Hosting Fees</p>
                  <p className="text-gray-400 text-sm">Build once, host anywhere, own forever</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => router.push('/#playground')}
                className="bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C]"
              >
                Try It Free
              </Button>
              <Button 
                onClick={() => router.push('/#examples')}
                variant="outline"
                className="border-[#2A2A32] text-gray-300 hover:border-[#6C52A0] hover:text-white"
              >
                See Examples
              </Button>
            </div>
          </div>

          <div className="bg-[#0D0D10] rounded-xl border border-[#2A2A32] p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm ml-2">components/Button.tsx</span>
            </div>
            <pre className="text-green-400 text-sm overflow-x-auto">
              <code>{`// Clean, readable React + Tailwind
export const Button = ({ 
  children, 
  variant = 'primary',
  ...props 
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
  };

  return (
    <button 
      className={\`\${baseClasses} \${variants[variant]}\`}
      {...props}
    >
      {children}
    </button>
  );
};`}</code>
            </pre>
            <div className="mt-4 text-center">
              <span className="text-[#A0527C] text-sm font-medium">
                ↑ This is what ZapDev generates - clean, portable code
              </span>
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-[#6C52A0]/10 to-[#A0527C]/10 rounded-2xl border border-[#6C52A0]/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Experience the ZapDev Difference
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Don't get locked into another platform. Build with freedom, deploy anywhere, 
              and own your code completely.
            </p>
            <Button 
              onClick={() => router.push('/#playground')}
              className="bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] px-8 py-3 text-lg"
            >
              Try ZapDev Free - No Signup Required
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 