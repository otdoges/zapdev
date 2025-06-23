"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { WebContainer } from '@webcontainer/api'
import { motion } from 'framer-motion'
import { 
  Play, 
  Square, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Loader,
  Terminal,
  FileText,
  Code2,
  Users,
  Brain
} from 'lucide-react'

interface WebContainerProps {
  code: string
  onCodeChange?: (code: string) => void
  className?: string
  aiTeamInstructions?: string
}

interface FileSystemTree {
  [key: string]: {
    file?: {
      contents: string
    }
    directory?: FileSystemTree
  }
}

interface AIAgent {
  id: string
  name: string
  role: string
  status: 'idle' | 'working' | 'complete' | 'error'
  currentTask?: string
}

export default function WebContainerComponent({ 
  code, 
  onCodeChange, 
  className,
  aiTeamInstructions 
}: WebContainerProps) {
  const [container, setContainer] = useState<WebContainer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [fileSystemTree, setFileSystemTree] = useState<FileSystemTree>({})
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([
    { id: 'architect', name: 'System Architect', role: 'Project structure & dependencies', status: 'idle' },
    { id: 'frontend', name: 'Frontend Developer', role: 'UI/UX components', status: 'idle' },
    { id: 'backend', name: 'Backend Developer', role: 'Server logic & APIs', status: 'idle' },
    { id: 'devops', name: 'DevOps Engineer', role: 'Build & deployment', status: 'idle' }
  ])
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const webcontainerInstance = useRef<WebContainer | null>(null)

  // Initialize WebContainer
  useEffect(() => {
    const initContainer = async () => {
      try {
        setIsLoading(true)
        setError('')
        addTerminalOutput('🚀 Initializing WebContainer...')
        
        // Boot WebContainer
        const instance = await WebContainer.boot()
        webcontainerInstance.current = instance
        setContainer(instance)
        
        addTerminalOutput('✅ WebContainer initialized successfully')
        setIsLoading(false)
        
        // If we have code, set it up immediately
        if (code && code.trim()) {
          await setupCodeInContainer(instance, code)
        }
        
        // If we have AI instructions, start the AI team
        if (aiTeamInstructions) {
          await startAITeamDevelopment(aiTeamInstructions, instance)
        }
        
      } catch (error) {
        console.error('Failed to initialize WebContainer:', error)
        setError('Failed to initialize WebContainer')
        addTerminalOutput(`❌ Error: ${error}`)
        setIsLoading(false)
      }
    }

    initContainer()
    
    return () => {
      // Cleanup
      if (webcontainerInstance.current) {
        webcontainerInstance.current.teardown()
      }
    }
  }, []) // Only run once on mount

  // Handle code changes
  useEffect(() => {
    const setupCode = async () => {
      if (container && code && code.trim()) {
        await setupCodeInContainer(container, code)
      }
    }
    
    setupCode()
  }, [code, container])

  // Setup code in container
  const setupCodeInContainer = async (containerInstance: WebContainer, codeContent: string) => {
    try {
      addTerminalOutput('📄 Setting up code in WebContainer...')
      
      // Detect if it's HTML or React
      const isHTML = codeContent.includes('<!DOCTYPE html>') || codeContent.includes('<html');
      const isReact = codeContent.includes('import React') || codeContent.includes('from "react"');
      
      if (isHTML) {
        // Simple HTML setup
        const files = {
          'index.html': {
            file: { contents: codeContent }
          },
          'package.json': {
            file: {
              contents: JSON.stringify({
                name: 'webcontainer-app',
                type: 'module',
                scripts: {
                  dev: 'npx serve . -p 3000',
                  start: 'npx serve . -p 3000'
                },
                dependencies: {
                  serve: 'latest'
                }
              }, null, 2)
            }
          }
        }
        
        await containerInstance.mount(files)
        await startHTMLServer(containerInstance)
        
      } else if (isReact) {
        // React setup
        await setupReactProject(containerInstance, codeContent)
      } else {
        // Generic JavaScript/TypeScript
        await setupGenericProject(containerInstance, codeContent)
      }
      
    } catch (error) {
      console.error('Failed to setup code:', error)
      addTerminalOutput(`❌ Setup error: ${error}`)
    }
  }

  // Start HTML server
  const startHTMLServer = async (containerInstance: WebContainer) => {
    try {
      addTerminalOutput('📦 Installing dependencies...')
      
      const installProcess = await containerInstance.spawn('npm', ['install'])
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          addTerminalOutput(data)
        }
      }))
      
      await installProcess.exit
      
      addTerminalOutput('🚀 Starting server...')
      const serverProcess = await containerInstance.spawn('npm', ['run', 'dev'])
      
      serverProcess.output.pipeTo(new WritableStream({
        write(data) {
          addTerminalOutput(data)
        }
      }))
      
      // Wait for server to start and get URL
      containerInstance.on('server-ready', (port, url) => {
        setPreviewUrl(url)
        setIsRunning(true)
        addTerminalOutput(`✅ Server running at ${url}`)
      })
      
    } catch (error) {
      console.error('Failed to start HTML server:', error)
      addTerminalOutput(`❌ Server error: ${error}`)
    }
  }

  // Setup React project
  const setupReactProject = async (containerInstance: WebContainer, codeContent: string) => {
    try {
      const files = {
        'package.json': {
          file: {
            contents: JSON.stringify({
              name: 'react-app',
              type: 'module',
              scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview'
              },
              dependencies: {
                'react': 'latest',
                'react-dom': 'latest',
                'vite': 'latest',
                '@vitejs/plugin-react': 'latest'
              }
            }, null, 2)
          }
        },
        'vite.config.js': {
          file: {
            contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})`
          }
        },
        'index.html': {
          file: {
            contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
          }
        },
        'src': {
          directory: {
            'main.jsx': {
              file: {
                contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
              }
            },
            'App.jsx': {
              file: { contents: codeContent }
            }
          }
        }
      }
      
      await containerInstance.mount(files)
      await startDevelopmentServer(containerInstance)
      
    } catch (error) {
      console.error('Failed to setup React project:', error)
      addTerminalOutput(`❌ React setup error: ${error}`)
    }
  }

  // Setup generic project
  const setupGenericProject = async (containerInstance: WebContainer, codeContent: string) => {
    try {
      const files = {
        'index.js': {
          file: { contents: codeContent }
        },
        'package.json': {
          file: {
            contents: JSON.stringify({
              name: 'generic-app',
              type: 'module',
              scripts: {
                dev: 'node index.js',
                start: 'node index.js'
              }
            }, null, 2)
          }
        }
      }
      
      await containerInstance.mount(files)
      await startDevelopmentServer(containerInstance)
      
    } catch (error) {
      console.error('Failed to setup generic project:', error)
      addTerminalOutput(`❌ Generic setup error: ${error}`)
    }
  }

  // AI Team Development Process
  const startAITeamDevelopment = async (instructions: string, containerInstance: WebContainer) => {
    try {
      addTerminalOutput('🤖 Starting AI team development process...')
      
      // Step 1: Architect analyzes requirements
      await updateAgentStatus('architect', 'working', 'Analyzing project requirements')
      const projectStructure = await analyzeProjectRequirements(instructions)
      await updateAgentStatus('architect', 'complete')
      
      // Step 2: Set up project structure
      addTerminalOutput('📁 Setting up project structure...')
      await setupProjectStructure(containerInstance, projectStructure)
      
      // Step 3: Install dependencies
      await updateAgentStatus('devops', 'working', 'Installing dependencies')
      await installDependencies(containerInstance, projectStructure.dependencies)
      await updateAgentStatus('devops', 'complete')
      
      // Step 4: Frontend development
      if (projectStructure.needsFrontend) {
        await updateAgentStatus('frontend', 'working', 'Building frontend components')
        await buildFrontendComponents(containerInstance, instructions)
        await updateAgentStatus('frontend', 'complete')
      }
      
      // Step 5: Backend development
      if (projectStructure.needsBackend) {
        await updateAgentStatus('backend', 'working', 'Building backend services')
        await buildBackendServices(containerInstance, instructions)
        await updateAgentStatus('backend', 'complete')
      }
      
      // Step 6: Start development server
      await startDevelopmentServer(containerInstance)
      
      addTerminalOutput('🎉 AI team development complete!')
      
    } catch (error) {
      console.error('AI team development failed:', error)
      addTerminalOutput(`❌ AI team error: ${error}`)
      setError('AI team development failed')
    }
  }

  // Analyze project requirements (simulated AI decision making)
  const analyzeProjectRequirements = async (instructions: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate thinking time
    
    const lowerInstructions = instructions.toLowerCase()
    
    return {
      type: lowerInstructions.includes('react') || lowerInstructions.includes('component') ? 'react' : 
            lowerInstructions.includes('vue') ? 'vue' :
            lowerInstructions.includes('api') || lowerInstructions.includes('server') ? 'nodejs' : 'react',
      needsFrontend: !lowerInstructions.includes('api only') && !lowerInstructions.includes('backend only'),
      needsBackend: lowerInstructions.includes('api') || lowerInstructions.includes('server') || lowerInstructions.includes('backend'),
      dependencies: determineDependencies(lowerInstructions),
      complexity: lowerInstructions.includes('simple') ? 'simple' : 'standard'
    }
  }

  // Determine required dependencies based on instructions
  const determineDependencies = (instructions: string): string[] => {
    const deps = ['vite']
    
    if (instructions.includes('react')) deps.push('react', 'react-dom', '@types/react', '@types/react-dom')
    if (instructions.includes('typescript')) deps.push('typescript', '@types/node')
    if (instructions.includes('tailwind')) deps.push('tailwindcss', 'autoprefixer', 'postcss')
    if (instructions.includes('express')) deps.push('express', '@types/express')
    if (instructions.includes('api') || instructions.includes('server')) deps.push('express', '@types/express', 'cors')
    
    return deps
  }

  // Setup project structure
  const setupProjectStructure = async (containerInstance: WebContainer, structure: any) => {
    const files: FileSystemTree = {}
    
    if (structure.type === 'react') {
      files['package.json'] = {
        file: {
          contents: JSON.stringify({
            name: 'ai-generated-app',
            type: 'module',
            version: '1.0.0',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: structure.dependencies.reduce((acc: any, dep: string) => {
              acc[dep] = 'latest'
              return acc
            }, {}),
            devDependencies: {
              '@vitejs/plugin-react': 'latest'
            }
          }, null, 2)
        }
      }
      
      files['vite.config.js'] = {
        file: {
          contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000
  }
})`
        }
      }
      
      files['index.html'] = {
        file: {
          contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
        }
      }
      
      files['src'] = {
        directory: {
          'main.tsx': {
            file: {
              contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
            }
          },
          'App.tsx': {
            file: {
              contents: `import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🤖 AI Generated App
        </h1>
        <p className="text-gray-600">
          Built by AI team collaboration
        </p>
      </div>
    </div>
  )
}

export default App`
            }
          },
          'index.css': {
            file: {
              contents: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`
            }
          }
        }
      }
    }
    
    await containerInstance.mount(files as any) // WebContainer mount API expects this format
    setFileSystemTree(files)
    addTerminalOutput('📁 Project structure created')
  }

  // Install dependencies using pnpm
  const installDependencies = async (containerInstance: WebContainer, deps: string[]) => {
    addTerminalOutput('📦 Installing dependencies with pnpm...')
    
    try {
      // First try to enable pnpm in the container
      await containerInstance.spawn('corepack', ['enable'])
      await containerInstance.spawn('corepack', ['prepare', 'pnpm@latest', '--activate'])
      
      const installProcess = await containerInstance.spawn('pnpm', ['install', '--prefer-frozen-lockfile'])
      
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          addTerminalOutput(data)
        }
      }))
      
      const exitCode = await installProcess.exit
      if (exitCode !== 0) {
        throw new Error(`pnpm install failed with exit code ${exitCode}`)
      }
      
      addTerminalOutput('✅ Dependencies installed successfully with pnpm')
    } catch (error) {
      addTerminalOutput('⚠️ pnpm setup failed, falling back to npm...')
      
      const installProcess = await containerInstance.spawn('npm', ['install'])
      
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          addTerminalOutput(data)
        }
      }))
      
      const exitCode = await installProcess.exit
      if (exitCode !== 0) {
        throw new Error(`npm install failed with exit code ${exitCode}`)
      }
      
      addTerminalOutput('✅ Dependencies installed successfully with npm')
    }
  }

  // Build frontend components (enhanced by AI)
  const buildFrontendComponents = async (containerInstance: WebContainer, instructions: string) => {
    addTerminalOutput('🎨 Frontend developer is creating components...')
    
    try {
      // Call AI team coordinate API for frontend component generation
      const response = await fetch('/api/ai-team/coordinate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions: instructions,
          step: 'frontend'
        })
      })

      if (!response.ok) {
        throw new Error(`AI team API returned ${response.status}`)
      }

      const result = await response.json()
      
      // Extract the App.tsx component from the AI response
      if (result.components && result.components['App.tsx']) {
        await containerInstance.fs.writeFile('/src/App.tsx', result.components['App.tsx'])
        addTerminalOutput('✅ Frontend components created by AI team')
      } else {
        // Fallback to a simple component if AI doesn't return expected structure
        const fallbackApp = generateEnhancedApp(instructions)
        await containerInstance.fs.writeFile('/src/App.tsx', fallbackApp)
        addTerminalOutput('⚠️ Used fallback component (AI response missing App.tsx)')
      }
    } catch (error) {
      console.error('Failed to generate AI components:', error)
      addTerminalOutput(`❌ AI component generation failed: ${error}`)
      
      // Fallback to the original hardcoded template
      const fallbackApp = generateEnhancedApp(instructions)
      await containerInstance.fs.writeFile('/src/App.tsx', fallbackApp)
      addTerminalOutput('🔄 Using fallback component template')
    }
  }

  // Build backend services (if needed)
  const buildBackendServices = async (containerInstance: WebContainer, instructions: string) => {
    addTerminalOutput('🔧 Backend developer is setting up services...')
    
    // Create a simple Express server if backend is needed
    const serverCode = `const express = require('express')
const cors = require('cors')
const app = express()
const port = 3001

app.use(cors())
app.use(express.json())

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from AI-generated backend!' })
})

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`)
})
`
    
    await containerInstance.fs.writeFile('/server.js', serverCode)
    addTerminalOutput('✅ Backend services created')
  }

  // Generate enhanced App component based on instructions
  const generateEnhancedApp = (instructions: string): string => {
    const hasForm = instructions.toLowerCase().includes('form')
    const hasChart = instructions.toLowerCase().includes('chart') || instructions.toLowerCase().includes('graph')
    const hasList = instructions.toLowerCase().includes('list') || instructions.toLowerCase().includes('table')
    
    return `import React, { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🤖 AI Generated App
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built collaboratively by our AI development team based on your requirements
          </p>
        </header>

        <main className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${hasForm ? `
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Interactive Form</h2>
              <form className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Enter your name"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition"
                >
                  Submit
                </button>
              </form>
            </div>
            ` : ''}
            
            ${hasList ? `
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Data List</h2>
              <ul className="space-y-2">
                <li className="p-3 bg-gray-50 rounded border-l-4 border-green-500">Item 1</li>
                <li className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">Item 2</li>
                <li className="p-3 bg-gray-50 rounded border-l-4 border-purple-500">Item 3</li>
              </ul>
            </div>
            ` : ''}
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Features</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>AI-powered development</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Real-time collaboration</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Modern tech stack</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App`
  }

  // Start development server
  const startDevelopmentServer = async (containerInstance: WebContainer) => {
    addTerminalOutput('🚀 Starting development server...')
    
    try {
      const devProcess = await containerInstance.spawn('npm', ['run', 'dev'])
      
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          addTerminalOutput(data)
        }
      }))
      
      // Listen for the server to be ready
      containerInstance.on('server-ready', (port, url) => {
        setPreviewUrl(url)
        setIsRunning(true)
        addTerminalOutput(`✅ Server ready at ${url}`)
      })
      
    } catch (error) {
      console.error('Failed to start dev server:', error)
      addTerminalOutput(`❌ Failed to start server: ${error}`)
    }
  }

  // Helper function to add terminal output
  const addTerminalOutput = (output: string) => {
    setTerminalOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${output}`])
  }

  // Update AI agent status
  const updateAgentStatus = async (agentId: string, status: AIAgent['status'], task?: string) => {
    setAiAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, status, currentTask: task } : agent
    ))
    
    // Add some realistic delay for agent work
    if (status === 'working') {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    }
  }

  // Stop preview
  const stopPreview = useCallback(() => {
    setIsRunning(false)
    setPreviewUrl('')
    addTerminalOutput('🛑 Development server stopped')
  }, [])

  // Refresh preview
  const refreshPreview = useCallback(() => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = iframeRef.current.src
      addTerminalOutput('🔄 Preview refreshed')
    }
  }, [previewUrl])

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-gray-400">Initializing WebContainer...</p>
          <div className="mt-4 space-y-2">
            {terminalOutput.slice(-3).map((output, i) => (
              <p key={i} className="text-xs text-gray-500">{output}</p>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-gray-900 ${className}`}>
      {/* AI Team Status */}
      {aiTeamInstructions && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-medium">AI Development Team</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {aiAgents.map(agent => (
              <div key={agent.id} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-white">{agent.name}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{agent.role}</p>
                <div className="flex items-center gap-2">
                  {agent.status === 'idle' && <div className="w-2 h-2 bg-gray-500 rounded-full" />}
                  {agent.status === 'working' && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />}
                  {agent.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {agent.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <span className="text-xs text-gray-300 capitalize">{agent.status}</span>
                </div>
                {agent.currentTask && (
                  <p className="text-xs text-gray-400 mt-1">{agent.currentTask}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span className="text-white text-sm">
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          {previewUrl && (
            <span className="text-gray-400 text-sm">{previewUrl}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPreview}
            disabled={!previewUrl}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={stopPreview}
            disabled={!isRunning}
            className="p-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Preview */}
        <div className="flex-1 bg-white">
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Preview will appear here once the development server starts</p>
              </div>
            </div>
          )}
        </div>

        {/* Terminal */}
        <div className="w-1/3 bg-black text-green-400 font-mono text-sm flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span className="text-white">Terminal</span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-1">
            {terminalOutput.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                {line}
              </div>
            ))}
            {terminalOutput.length === 0 && (
              <div className="text-gray-500">Waiting for output...</div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900 border-t border-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-100">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
} 