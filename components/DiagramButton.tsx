'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { diagramTemplates } from '@/lib/diagram-utils';

interface DiagramButtonProps {
  onDiagramGenerated?: (files: Array<{ path: string; content: string; type: string }>) => void;
}

export default function DiagramButton({ onDiagramGenerated }: DiagramButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleDiagramSelect = (templateName: string) => {
    const template = diagramTemplates.find(t => t.name === templateName);
    if (!template) return;

    const files = [
      {
        path: 'docs/architecture.md',
        content: `# ${template.name}

${template.description}

\`\`\`mermaid
${template.template}
\`\`\`

## Description

This diagram illustrates ${template.description.toLowerCase()}.

## Usage

You can:
- Copy the Mermaid code to use in your documentation
- Export as SVG for presentations  
- Modify the diagram to fit your specific needs
- Share with your team for architectural discussions

## Mermaid Syntax

This diagram uses Mermaid.js syntax. Learn more at [mermaid-js.github.io](https://mermaid-js.github.io/mermaid/)
`,
        type: 'markdown'
      },
      {
        path: `diagrams/${templateName.toLowerCase().replace(/\s+/g, '-')}.mmd`,
        content: template.template,
        type: 'mermaid'
      }
    ];

    onDiagramGenerated?.(files);
    setShowModal(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Diagram
      </Button>

      {/* Diagram Templates Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Create Technical Diagram</h3>
                    <p className="text-gray-600 mt-1">Choose from professional diagram templates</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[75vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {diagramTemplates.map((template, index) => (
                    <motion.button
                      key={template.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDiagramSelect(template.name)}
                      className="p-6 border border-gray-200 rounded-xl text-left hover:border-purple-300 hover:shadow-lg transition-all duration-300 group bg-gradient-to-br from-white to-gray-50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                          {template.category === 'architecture' && '🏗️'}
                          {template.category === 'database' && '🗄️'}
                          {template.category === 'flow' && '🔄'}
                          {template.category === 'sequence' && '📞'}
                          {template.category === 'component' && '⚛️'}
                          {template.category === 'network' && '🌐'}
                        </div>
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full capitalize">
                          {template.category}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                        {template.name}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        {template.description}
                      </p>

                      {template.variables && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Customizable elements:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable) => (
                              <span
                                key={variable}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {variable.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-purple-600 font-medium group-hover:text-purple-700">
                        <svg className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Diagram
                      </div>
                    </motion.button>
                  ))}
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">💡 Pro Tip</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        You can also ask the AI to create custom diagrams by typing requests like:
                        <br />
                        <span className="font-mono text-purple-600 bg-white px-2 py-1 rounded mt-2 inline-block">
                          "Create a system architecture diagram for my e-commerce app"
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}