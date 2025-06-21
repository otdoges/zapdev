import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openrouterProvider, getModelId } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  try {
    const { userRequest, step = 'analyze' } = await req.json()

    if (!userRequest) {
      return NextResponse.json({ error: 'User request is required' }, { status: 400 })
    }

    switch (step) {
      case 'analyze':
        return await analyzeRequirements(userRequest)
      case 'architect':
        return await architectureDesign(userRequest)
      case 'frontend':
        return await frontendDevelopment(userRequest)
      case 'backend':
        return await backendDevelopment(userRequest)
      case 'deploy':
        return await deploymentSetup(userRequest)
      default:
        return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
    }
  } catch (error) {
    console.error('AI Team coordination error:', error)
    return NextResponse.json(
      { error: 'Failed to coordinate AI team' },
      { status: 500 }
    )
  }
}

async function analyzeRequirements(userRequest: string) {
  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('deepseek/deepseek-r1-0528:free')),
    prompt: `
    As a Senior System Architect, analyze this project request and extract key requirements:

    User Request: "${userRequest}"

    Please provide a structured analysis in JSON format with:
    {
      "projectType": "web-app" | "api" | "library" | "tool",
      "techStack": ["technology1", "technology2", ...],
      "complexity": "simple" | "moderate" | "complex",
      "estimatedTimeHours": number,
      "features": ["feature1", "feature2", ...],
      "requirements": {
        "functional": ["req1", "req2", ...],
        "nonFunctional": ["req1", "req2", ...]
      },
      "architecture": {
        "pattern": "spa" | "mpa" | "api-only" | "fullstack",
        "database": boolean,
        "authentication": boolean,
        "realtime": boolean
      }
    }

    Focus on modern web development best practices.
    `,
  })

  let analysis
  try {
    analysis = JSON.parse(text)
  } catch (error) {
    console.error('Failed to parse AI response:', text)
    throw new Error('AI returned invalid JSON response')
  }

  return NextResponse.json({
    step: 'analyze',
    agent: 'System Architect',
    result: analysis,
    nextStep: 'architect'
  })}

async function architectureDesign(userRequest: string) {
  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('deepseek/deepseek-r1-0528:free')),
    prompt: `
    As a Senior System Architect, design the project architecture for:

    "${userRequest}"

    Provide a detailed technical specification in JSON format:
    {
      "projectStructure": {
        "folders": ["folder1", "folder2", ...],
        "keyFiles": ["file1.ext", "file2.ext", ...]
      },
      "dependencies": {
        "production": ["package1", "package2", ...],
        "development": ["devPackage1", "devPackage2", ...]
      },
      "buildTools": {
        "bundler": "vite" | "webpack" | "rollup",
        "packageManager": "pnpm" | "npm" | "yarn",
        "scripts": {
          "dev": "command",
          "build": "command",
          "preview": "command"
        }
      },
      "configuration": {
        "typescript": boolean,
        "linting": boolean,
        "testing": boolean,
        "styling": "css" | "scss" | "tailwind" | "styled-components"
      }
    }

    Prioritize modern tools and best practices. Use pnpm as package manager.
    `,
  })

  const architecture = JSON.parse(text)
  
  return NextResponse.json({
    step: 'architect',
    agent: 'System Architect',
    result: architecture,
    nextStep: 'frontend'
  })
}

async function frontendDevelopment(userRequest: string) {
  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('agentica-org/deepcoder-14b-preview:free')),
    prompt: `
    As a Senior Frontend Developer, create the main application component for:

    "${userRequest}"

    Generate React TypeScript code that includes:
    - Modern functional components with hooks
    - Responsive design with Tailwind CSS
    - Proper TypeScript types
    - Accessibility considerations
    - Error boundaries and loading states
    - Clean, maintainable code structure

    Provide the response in JSON format:
    {
      "components": {
        "App.tsx": "component code here",
        "main.tsx": "entry point code here",
        "index.css": "styles here"
      },
      "types": {
        "types.ts": "TypeScript types here"
      },
      "hooks": {
        "useCustomHook.ts": "custom hook if needed"
      }
    }

    Make it production-ready with proper error handling.
    `,
  })

  const frontend = JSON.parse(text)
  
  return NextResponse.json({
    step: 'frontend',
    agent: 'Frontend Developer',
    result: frontend,
    nextStep: 'backend'
  })
}

async function backendDevelopment(userRequest: string) {
  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('qwen/qwen3-32b:free')),
    prompt: `
    As a Senior Backend Developer, determine if this project needs backend services:

    "${userRequest}"

    If backend is needed, provide API specifications in JSON:
    {
      "needsBackend": boolean,
      "apis": [
        {
          "endpoint": "/api/example",
          "method": "GET|POST|PUT|DELETE",
          "description": "What this endpoint does",
          "requestBody": "type definition",
          "response": "type definition"
        }
      ],
      "serverCode": {
        "server.js": "Express server code if needed"
      },
      "middleware": ["cors", "express.json", ...],
      "environment": ["ENV_VAR1", "ENV_VAR2", ...]
    }

    If no backend needed, set needsBackend to false.
    `,
  })

  const backend = JSON.parse(text)
  
  return NextResponse.json({
    step: 'backend',
    agent: 'Backend Developer',
    result: backend,
    nextStep: 'deploy'
  })
}

async function deploymentSetup(userRequest: string) {
  const { text } = await generateText({
    model: openrouterProvider.chat(getModelId('microsoft/phi-4-reasoning-plus:free')),
    prompt: `
    As a DevOps Engineer, create deployment configuration for:

    "${userRequest}"

    Provide configuration files in JSON format:
    {
      "packageJson": {
        "name": "project-name",
        "scripts": {
          "dev": "vite",
          "build": "vite build",
          "preview": "vite preview"
        },
        "dependencies": {},
        "devDependencies": {}
      },
      "viteConfig": "vite.config.ts content",
      "tsConfig": "tsconfig.json content",
      "tailwindConfig": "tailwind.config.ts content if needed",
      "envExample": ".env.example content if needed",
      "instructions": [
        "Step 1: Install dependencies",
        "Step 2: Configure environment",
        "Step 3: Start development server"
      ]
    }

    Focus on Vite + React + TypeScript + Tailwind stack with pnpm.
    `,
  })

  const deployment = JSON.parse(text)
  
  return NextResponse.json({
    step: 'deploy',
    agent: 'DevOps Engineer',
    result: deployment,
    nextStep: 'complete'
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Team Coordination API',
    endpoints: {
      'POST /api/ai-team/coordinate': 'Coordinate AI team development',
    },
    agents: [
      'System Architect - Analyzes requirements and designs architecture',
      'Frontend Developer - Creates UI components and interactions',
      'Backend Developer - Builds APIs and server logic',
      'DevOps Engineer - Handles deployment and build configuration'
    ]
  })
} 