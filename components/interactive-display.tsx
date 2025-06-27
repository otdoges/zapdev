'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonacoEditor } from '@/components/ui/monaco-editor';
import { Code, Eye } from 'lucide-react';

interface InteractiveDisplayProps {
  code: string;
}

export function InteractiveDisplay({ code }: InteractiveDisplayProps) {
  const [view, setView] = useState('preview');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Preview</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
      ${code}
    </body>
    </html>
  `;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="border-b p-2">
        <button
          onClick={() => setView('preview')}
          className={`rounded-md px-3 py-1 text-sm ${view === 'preview' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
        >
          <Eye className="mr-2 inline-block h-4 w-4" />
          Preview
        </button>
        <button
          onClick={() => setView('code')}
          className={`ml-2 rounded-md px-3 py-1 text-sm ${view === 'code' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
        >
          <Code className="mr-2 inline-block h-4 w-4" />
          Code
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'preview' ? (
            <iframe
              srcDoc={htmlContent}
              className="h-96 w-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <MonacoEditor
              height="24rem"
              defaultLanguage="html"
              value={code}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, readOnly: true }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
