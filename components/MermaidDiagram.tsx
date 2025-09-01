'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface MermaidDiagramProps {
  diagram?: string;
  onDiagramGenerated?: (files: Array<{ path: string; content: string; type: string }>) => void;
}

export default function MermaidDiagram({ diagram, onDiagramGenerated }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const [currentDiagram, setCurrentDiagram] = useState(diagram || '');
  const [showExamples, setShowExamples] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  // Initialize Mermaid
  useEffect(() => {
    const initMermaid = async () => {
      try {
        const mermaid = await import('mermaid');
        
        // Configure Mermaid with beautiful white theme
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#e5e7eb',
            lineColor: '#6b7280',
            secondaryColor: '#f3f4f6',
            tertiaryColor: '#ffffff',
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#f8fafc',
            tertiaryBkg: '#f1f5f9',
            primaryBoxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            cScale0: '#3b82f6',
            cScale1: '#06b6d4',
            cScale2: '#10b981',
            cScale3: '#f59e0b',
            cScale4: '#ef4444',
            cScale5: '#8b5cf6',
            cScale6: '#ec4899',
            cScale7: '#6b7280',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px'
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          sequence: {
            useMaxWidth: true,
            wrap: true,
            messageFont: 'ui-sans-serif'
          },
          gantt: {
            useMaxWidth: true,
            bottomPadding: 10
          },
          er: {
            useMaxWidth: true
          },
          journey: {
            useMaxWidth: true
          }
        });
        
        setMermaidLoaded(true);
      } catch (error) {
        console.error('Failed to load Mermaid:', error);
      }
    };

    initMermaid();
  }, []);

  // Render diagram when content changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidLoaded || !currentDiagram || !containerRef.current) return;

      try {
        const mermaid = await import('mermaid');
        const uniqueId = `mermaid-${Date.now()}`;
        
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        // Create diagram
        const { svg } = await mermaid.default.render(uniqueId, currentDiagram);
        containerRef.current.innerHTML = svg;
        
        // Add some styling to the SVG
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = 'auto';
          svgElement.style.background = '#ffffff';
          svgElement.style.borderRadius = '8px';
          svgElement.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)';
        }
      } catch (error) {
        console.error('Failed to render Mermaid diagram:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
              <svg class="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="font-medium">Invalid Diagram Syntax</p>
              <p class="text-sm mt-1">Please check your Mermaid syntax and try again.</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [currentDiagram, mermaidLoaded]);

  // Update diagram when prop changes
  useEffect(() => {
    if (diagram && diagram !== currentDiagram) {
      setCurrentDiagram(diagram);
    }
  }, [diagram]);

  const diagramExamples = {
    'System Architecture': `graph TB
    Client[Client Application] --> LB[Load Balancer]
    LB --> API[API Gateway]
    API --> Auth[Authentication Service]
    API --> App[Application Server]
    App --> DB[(Database)]
    App --> Cache[(Redis Cache)]
    App --> Queue[Message Queue]
    Queue --> Worker[Background Workers]
    
    style Client fill:#3b82f6,color:#fff
    style API fill:#10b981,color:#fff
    style DB fill:#f59e0b,color:#fff
    style Cache fill:#ef4444,color:#fff`,

    'Database Schema': `erDiagram
    USERS {
        int id PK
        string name
        string email UK
        datetime created_at
        datetime updated_at
    }
    
    POSTS {
        int id PK
        string title
        text content
        int user_id FK
        boolean published
        datetime created_at
    }
    
    COMMENTS {
        int id PK
        text content
        int user_id FK
        int post_id FK
        datetime created_at
    }
    
    USERS ||--o{ POSTS : creates
    USERS ||--o{ COMMENTS : writes
    POSTS ||--o{ COMMENTS : has`,

    'User Flow': `journey
    title User Registration and Onboarding Flow
    section Account Creation
      Visit landing page: 5: User
      Click signup button: 4: User
      Fill registration form: 3: User
      Verify email: 2: User
      Account activated: 5: User, System
    section Onboarding
      Welcome tutorial: 4: User, System
      Profile setup: 3: User
      First project creation: 5: User
      Invite team members: 4: User`,

    'API Sequence': `sequenceDiagram
    participant C as Client
    participant A as API Gateway
    participant S as Service
    participant D as Database
    participant Q as Queue
    
    C->>A: POST /api/users
    A->>A: Validate request
    A->>S: Create user
    S->>D: Insert user record
    D-->>S: User created
    S->>Q: Send welcome email
    S-->>A: User response
    A-->>C: 201 Created
    
    Note over Q: Async email processing
    Q->>Q: Process email job`,

    'Data Flow': `graph LR
    Input[User Input] --> Validate{Validate?}
    Validate -->|Valid| Process[Process Data]
    Validate -->|Invalid| Error[Return Error]
    Process --> Transform[Transform Data]
    Transform --> Store[(Store in DB)]
    Store --> Index[Update Search Index]
    Store --> Cache[Update Cache]
    Index --> Complete[Complete]
    Cache --> Complete
    Complete --> Notify[Notify User]
    
    style Input fill:#e1f5fe
    style Process fill:#e8f5e8
    style Store fill:#fff3e0
    style Complete fill:#f3e5f5`,

    'Component Tree': `graph TD
    App[App Component] --> Header[Header]
    App --> Main[Main Content]
    App --> Footer[Footer]
    
    Header --> Nav[Navigation]
    Header --> Search[Search Bar]
    Header --> User[User Menu]
    
    Main --> Sidebar[Sidebar]
    Main --> Content[Content Area]
    
    Sidebar --> Menu[Menu Items]
    Sidebar --> Filters[Filter Panel]
    
    Content --> List[Item List]
    Content --> Detail[Detail View]
    
    List --> Item1[Item Component]
    List --> Item2[Item Component]
    List --> Item3[Item Component]
    
    style App fill:#3b82f6,color:#fff
    style Main fill:#10b981,color:#fff
    style Content fill:#f59e0b,color:#fff`
  };

  const handleExampleSelect = (exampleName: string) => {
    setCurrentDiagram(diagramExamples[exampleName as keyof typeof diagramExamples]);
    setSelectedExample(exampleName);
    setShowExamples(false);
  };

  const generateDiagramFiles = () => {
    const files = [
      {
        path: 'docs/diagrams/architecture.md',
        content: `# Architecture Diagrams

This document contains technical diagrams explaining the system architecture.

## Current Diagram

\`\`\`mermaid
${currentDiagram}
\`\`\`

## Usage

These diagrams are generated using Mermaid.js. You can:

1. **Edit diagrams** - Modify the Mermaid syntax to update diagrams
2. **Export diagrams** - Copy the SVG output for use in documentation
3. **Share diagrams** - Include in README files and documentation

## Mermaid Resources

- [Mermaid Documentation](https://mermaid-js.github.io/mermaid/)
- [Online Editor](https://mermaid.live/)
- [Syntax Reference](https://mermaid-js.github.io/mermaid/#/README)

## Examples

### Flowchart
\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

### Sequence Diagram
\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hello Alice
\`\`\`

### Entity Relationship Diagram
\`\`\`mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : includes
\`\`\`
`,
        type: 'markdown'
      },
      {
        path: 'src/components/DiagramViewer.tsx',
        content: `'use client';

import { useEffect, useRef } from 'react';

interface DiagramViewerProps {
  mermaidCode: string;
  className?: string;
}

export default function DiagramViewer({ mermaidCode, className = '' }: DiagramViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidCode || !containerRef.current) return;

      try {
        const mermaid = await import('mermaid');
        
        // Configure Mermaid
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            background: '#ffffff'
          }
        });
        
        const uniqueId = \`diagram-\${Date.now()}\`;
        const { svg } = await mermaid.default.render(uniqueId, mermaidCode);
        containerRef.current.innerHTML = svg;
        
        // Style the SVG
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = 'auto';
        }
      } catch (error) {
        console.error('Failed to render diagram:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = \`
            <div class="p-4 text-red-600 bg-red-50 rounded border border-red-200">
              Error rendering diagram. Please check the syntax.
            </div>
          \`;
        }
      }
    };

    renderDiagram();
  }, [mermaidCode]);

  return (
    <div 
      ref={containerRef}
      className={\`mermaid-container \${className}\`}
    />
  );
}`,
        type: 'tsx'
      },
      {
        path: 'docs/README.md',
        content: `# Project Documentation

## Architecture Overview

This project uses modern web technologies with a focus on performance and scalability.

\`\`\`mermaid
${currentDiagram}
\`\`\`

## Getting Started

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd project-directory
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

## Project Structure

\`\`\`
src/
├── components/     # React components
├── pages/         # Next.js pages
├── styles/        # CSS styles
├── utils/         # Utility functions
└── types/         # TypeScript types
\`\`\`

## Features

- 🚀 **Fast Development** - Hot reload and instant feedback
- 📱 **Responsive Design** - Works on all devices
- 🔒 **Type Safety** - Full TypeScript support
- 📊 **Diagrams** - Visual architecture documentation
- 🎨 **Modern UI** - Beautiful and intuitive interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
`,
        type: 'markdown'
      }
    ];

    onDiagramGenerated?.(files);
  };

  if (!mermaidLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Mermaid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Technical Diagrams
          </h2>
          {selectedExample && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {selectedExample}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExamples(true)}
            className="bg-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Examples
          </Button>
          
          {currentDiagram && (
            <Button
              variant="default"
              size="sm"
              onClick={generateDiagramFiles}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Docs
            </Button>
          )}
        </div>
      </div>

      {/* Diagram Content */}
      <div className="flex-1 p-6 overflow-auto">
        {currentDiagram ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <div ref={containerRef} className="w-full h-full min-h-96" />
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Diagram Yet</h3>
              <p className="text-gray-600 mb-4">
                Ask the AI to create a technical diagram to explain how your system works, or choose from our examples.
              </p>
              <Button
                onClick={() => setShowExamples(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                View Examples
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Examples Modal */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExamples(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Diagram Examples</h3>
                  <button
                    onClick={() => setShowExamples(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(diagramExamples).map((exampleName) => (
                    <motion.button
                      key={exampleName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExampleSelect(exampleName)}
                      className="p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{exampleName}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {exampleName === 'System Architecture' && 'Complete system overview with load balancer, API gateway, and services'}
                        {exampleName === 'Database Schema' && 'Entity relationship diagram showing table relationships'}
                        {exampleName === 'User Flow' && 'User journey from registration to onboarding'}
                        {exampleName === 'API Sequence' && 'API interaction flow with sequence diagram'}
                        {exampleName === 'Data Flow' && 'Data processing pipeline with validation and storage'}
                        {exampleName === 'Component Tree' && 'React component hierarchy and relationships'}
                      </p>
                      <div className="text-xs text-blue-600 font-medium">Click to load →</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}