import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openrouterProvider, getModelId } from '@/lib/openrouter'

interface BuildRequest {
  userRequest: string
  chatId?: string
}

interface BuildResponse {
  success: boolean
  chatId?: string
  analysis: any
  architecture: any
  frontend: any
  backend: any
  deployment: any
  projectFiles: Record<string, { file: { contents: string } }>
  teamLog: string[]
}

export async function POST(req: NextRequest) {
  try {
    const { userRequest, chatId }: BuildRequest = await req.json()

    if (!userRequest) {
      return NextResponse.json({ error: 'User request is required' }, { status: 400 })
    }
    
    // Step 1: Analyze requirements
    console.log('🤖 System Architect analyzing requirements...')
    const analysisResult = await analyzeRequirements(userRequest)
    
    // Step 2: Design architecture
    console.log('🏗️ System Architect designing architecture...')
    const architectureResult = await architectureDesign(userRequest, analysisResult)
    
    // Step 3: Generate frontend code
    console.log('🎨 Frontend Developer creating components...')
    const frontendResult = await frontendDevelopment(userRequest, architectureResult)
    
    // Step 4: Generate backend code (if needed)
    console.log('⚙️ Backend Developer setting up services...')
    const backendResult = await backendDevelopment(userRequest, architectureResult)
    
    // Step 5: Create deployment configuration
    console.log('🚀 DevOps Engineer configuring deployment...')
    const deploymentResult = await deploymentSetup(userRequest, architectureResult, frontendResult, backendResult)

    // Combine all results into a complete project
    const projectFiles = await generateProjectFiles(
      analysisResult, 
      architectureResult, 
      frontendResult, 
      backendResult, 
      deploymentResult
    )

    return NextResponse.json({
      success: true,
      chatId,
      analysis: analysisResult,
      architecture: architectureResult,
      frontend: frontendResult,
      backend: backendResult,
      deployment: deploymentResult,
      projectFiles,
      teamLog: [
        '🤖 System Architect: Requirements analyzed and project structure designed',
        '🎨 Frontend Developer: React components and UI created',
        '⚙️ Backend Developer: APIs and server logic implemented',
        '🚀 DevOps Engineer: Build configuration and deployment setup complete',
        '✅ Project ready for WebContainer deployment'
      ]
    })
  } catch (error) {
    console.error('AI Team build error:', error)
    return NextResponse.json(
      { error: 'Failed to build project with AI team' },
      { status: 500 }
    )
  }
}

async function analyzeRequirements(userRequest: string) {
  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('deepseek/deepseek-r1-0528:free')),
    prompt: `
    As a Senior System Architect, analyze this project request:

    "${userRequest}"

    Respond in JSON format:
    {
      "projectType": "web-app" | "landing-page" | "dashboard" | "tool",
      "complexity": "simple" | "moderate" | "complex",
      "features": ["feature1", "feature2"],
      "techStack": ["React", "TypeScript", "Tailwind CSS"],
      "hasBackend": boolean,
      "hasDatabase": boolean,
      "hasAuth": boolean
    }
    `,
  })

  return JSON.parse(text)
}

async function architectureDesign(userRequest: string, analysis: any) {
  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('deepseek/deepseek-r1-0528-qwen3-8b:free')),
    prompt: `
    Design project architecture for: "${userRequest}"
    
    Analysis: ${JSON.stringify(analysis)}

    Respond in JSON format:
    {
      "folders": ["src", "public", "components"],
      "dependencies": ["react", "typescript", "@types/react"],
      "scripts": {
        "dev": "vite",
        "build": "vite build"
      }
    }
    `,
  })

  return JSON.parse(text)
}

async function frontendDevelopment(userRequest: string, architecture: any) {
  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('agentica-org/deepcoder-14b-preview:free')),
    prompt: `
    Create a React TypeScript application for: "${userRequest}"
    
    Architecture: ${JSON.stringify(architecture)}

    Generate clean, modern code with:
    - Functional components with hooks
    - Tailwind CSS for styling
    - Responsive design
    - TypeScript types
    - Error handling

    Respond in JSON format with file contents:
    {
      "App.tsx": "component code",
      "main.tsx": "entry point",
      "index.css": "styles",
      "components.tsx": "additional components if needed"
    }
    `,
  })

  return JSON.parse(text)
}

async function backendDevelopment(userRequest: string, architecture: any) {
  const needsBackend = architecture.hasBackend || userRequest.toLowerCase().includes('api')
  
  if (!needsBackend) {
    return { needsBackend: false }
  }

  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('qwen/qwen3-32b:free')),
    prompt: `
    Create backend services for: "${userRequest}"

    Generate Express.js server code with proper error handling and CORS.

    Respond in JSON format:
    {
      "needsBackend": true,
      "server.js": "express server code",
      "api": {
        "routes": ["GET /api/health", "POST /api/data"]
      }
    }
    `,
  })

  return JSON.parse(text)
}

async function deploymentSetup(userRequest: string, architecture: any, frontend: any, backend: any) {
  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('microsoft/phi-4-reasoning-plus:free')),
    prompt: `
    Create deployment configuration for a ${architecture.projectType} project.
    
    Frontend: ${Object.keys(frontend).join(', ')}
    Backend: ${backend.needsBackend ? 'Express server' : 'Static only'}

    Respond in JSON format:
    {
      "packageJson": {
        "name": "ai-generated-app",
        "scripts": { "dev": "vite", "build": "vite build" },
        "dependencies": {},
        "devDependencies": {}
      },
      "viteConfig": "vite configuration",
      "tsConfig": "typescript config"
    }
    `,
  })

  return JSON.parse(text)
}

async function generateProjectFiles(analysis: any, architecture: any, frontend: any, backend: any, deployment: any) {
  const files: Record<string, { file: { contents: string } }> = {}

  // Package.json
  files['package.json'] = {
    file: {
      contents: JSON.stringify(deployment.packageJson, null, 2)
    }
  }

  // Frontend files
  Object.entries(frontend).forEach(([filename, content]) => {
    if (typeof content === 'string') {
      files[filename] = {
        file: {
          contents: content as string
        }
      }
    }
  })

  // Backend files (if needed)
  if (backend.needsBackend && backend['server.js']) {
    files['server.js'] = {
      file: {
        contents: backend['server.js'] as string
      }
    }
  }

  // Configuration files
  if (deployment.viteConfig) {
    files['vite.config.ts'] = {
      file: {
        contents: deployment.viteConfig
      }
    }
  }

  if (deployment.tsConfig) {
    files['tsconfig.json'] = {
      file: {
        contents: deployment.tsConfig
      }
    }
  }

  // Index.html for Vite
  files['index.html'] = {
    file: {
      contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
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

  return files
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Team Build API',
    description: 'Complete project building with AI team coordination',
    models: {
      'System Architect': 'deepseek/deepseek-r1-0528:free',
      'Frontend Developer': 'agentica-org/deepcoder-14b-preview:free',
      'Backend Developer': 'qwen/qwen3-32b:free',
      'DevOps Engineer': 'microsoft/phi-4-reasoning-plus:free'
    }
  })
} 