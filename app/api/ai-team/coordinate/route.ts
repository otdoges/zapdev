import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { groqProvider, getGroqModelId } from '@/lib/groq-provider'

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
    model: groqProvider.chat(getGroqModelId('deepseek-r1-distill-qwen-32b')),
    prompt: `
    As a Senior Business Analyst with reasoning capabilities, analyze this project request:

    "${userRequest}"

    Think through this step by step and provide detailed analysis in JSON format:
    {
      "projectType": "web app | mobile app | api | desktop app",
      "complexity": "simple | medium | complex",
      "timeEstimate": "hours/days estimation",
      "technologies": ["list of recommended technologies"],
      "features": ["core features needed"],
      "challenges": ["potential challenges"],
      "requirements": {
        "functional": ["functional requirements"],
        "nonFunctional": ["performance, security, etc."]
      },
      "success_criteria": ["how to measure success"],
      "reasoning": "Your step-by-step analysis of why these recommendations make sense"
    }

    Use your reasoning abilities to:
    - Break down the request into component parts
    - Consider technical feasibility and constraints
    - Identify dependencies and critical path items
    - Suggest optimal technology choices based on requirements
    `,
    providerOptions: {
      groq: { reasoningFormat: 'parsed' }
    }
  })

  const analysis = JSON.parse(text)
  
  return NextResponse.json({
    step: 'analyze',
    agent: 'Senior Business Analyst',
    result: analysis,
    nextStep: 'architect'
  })
}

async function architectureDesign(userRequest: string) {
  const { text } = await generateText({
    model: groqProvider.chat(getGroqModelId('qwen-qwq-32b')),
    prompt: `
    As a Senior Software Architect with advanced reasoning, design the system architecture for:

    "${userRequest}"

    Think through the architecture systematically and respond in JSON format:
    {
      "architecture": {
        "pattern": "MVC | microservices | serverless | monolith",
        "frontend": {
          "framework": "React | Vue | Angular | Next.js",
          "styling": "Tailwind | styled-components | CSS modules",
          "stateManagement": "Redux | Zustand | Context | none"
        },
        "backend": {
          "framework": "Node.js | Python | Go | Java",
          "database": "PostgreSQL | MongoDB | SQLite",
          "api": "REST | GraphQL | tRPC"
        },
        "infrastructure": {
          "hosting": "Vercel | AWS | Netlify | Railway",
          "cdn": "Cloudflare | AWS CloudFront",
          "monitoring": "Sentry | LogRocket"
        }
      },
      "dataFlow": "description of how data flows through the system",
      "securityConsiderations": ["security measures needed"],
      "scalabilityPlan": "how the system can scale",
      "reasoning": "Your architectural reasoning and trade-offs considered"
    }

    Use reasoning to:
    - Consider scalability and performance implications
    - Evaluate different architectural patterns
    - Think about maintenance and development velocity
    - Plan for future extensibility
    `,
    providerOptions: {
      groq: { reasoningFormat: 'parsed' }
    }
  })

  const architecture = JSON.parse(text)
  
  return NextResponse.json({
    step: 'architect',
    agent: 'Senior Software Architect',
    result: architecture,
    nextStep: 'frontend'
  })
}

async function frontendDevelopment(userRequest: string) {
  const { text } = await generateText({
    model: groqProvider.chat(getGroqModelId('deepseek-r1-distill-qwen-32b')),
    prompt: `
    As a Senior Frontend Developer with reasoning capabilities, create the frontend implementation for:

    "${userRequest}"

    Think through the UI/UX design and provide detailed implementation in JSON format:
    {
      "components": [
        {
          "name": "ComponentName",
          "purpose": "what this component does",
          "props": ["list of props"],
          "code": "complete React/Next.js component code with Tailwind CSS"
        }
      ],
      "pages": [
        {
          "route": "/route-path",
          "name": "Page Name",
          "code": "complete page component code"
        }
      ],
      "styling": {
        "theme": "color scheme and design tokens",
        "responsive": "responsive design approach",
        "accessibility": "a11y considerations"
      },
      "interactions": ["user interactions and animations"],
      "testing": ["testing strategy for components"],
      "reasoning": "Your frontend design reasoning and UX considerations"
    }

    Use reasoning to:
    - Design intuitive user interfaces
    - Consider accessibility and usability
    - Plan component reusability and maintainability
    - Optimize for performance and loading times

    Make it modern, responsive, and production-ready with Tailwind CSS.
    `,
    providerOptions: {
      groq: { reasoningFormat: 'parsed' }
    }
  })

  const frontend = JSON.parse(text)
  
  return NextResponse.json({
    step: 'frontend',
    agent: 'Senior Frontend Developer',
    result: frontend,
    nextStep: 'backend'
  })
}

async function backendDevelopment(userRequest: string) {
  const { text } = await generateText({
    model: groqProvider.chat(getGroqModelId('qwen-qwq-32b')),
    prompt: `
    As a Senior Backend Developer with reasoning abilities, design the backend for:

    "${userRequest}"

    Think through the backend architecture and provide implementation in JSON format:
    {
      "api": {
        "endpoints": [
          {
            "method": "GET|POST|PUT|DELETE",
            "path": "/api/endpoint",
            "purpose": "what this endpoint does",
            "parameters": ["required parameters"],
            "response": "response format",
            "code": "implementation code"
          }
        ],
        "middleware": ["authentication, validation, etc."],
        "errorHandling": "error handling strategy"
      },
      "database": {
        "schema": [
          {
            "table": "table_name",
            "fields": ["field definitions"],
            "relationships": ["foreign keys and relations"]
          }
        ],
        "migrations": "database setup code",
        "queries": ["optimized query examples"]
      },
      "services": [
        {
          "name": "Service Name",
          "purpose": "what this service handles",
          "code": "service implementation"
        }
      ],
      "security": {
        "authentication": "auth strategy",
        "authorization": "permissions handling",
        "dataValidation": "input validation approach"
      },
      "reasoning": "Your backend design reasoning and architecture decisions"
    }

    Use reasoning to:
    - Design scalable and maintainable APIs
    - Consider data consistency and integrity
    - Plan for security and performance
    - Design efficient database schemas and queries
    `,
    providerOptions: {
      groq: { reasoningFormat: 'parsed' }
    }
  })

  const backend = JSON.parse(text)
  
  return NextResponse.json({
    step: 'backend',
    agent: 'Senior Backend Developer',
    result: backend,
    nextStep: 'deploy'
  })
}

async function deploymentSetup(userRequest: string) {
  const { text } = await generateText({
    model: groqProvider.chat(getGroqModelId('llama-3.3-70b-versatile')),
    prompt: `
    As a Senior DevOps Engineer with reasoning capabilities, create deployment configuration for:

    "${userRequest}"

    Think through the deployment strategy and provide configuration files in JSON format:
    {
      "packageJson": {
        "name": "project-name",
        "scripts": {
          "dev": "next dev",
          "build": "next build",
          "start": "next start",
          "lint": "next lint"
        },
        "dependencies": {},
        "devDependencies": {}
      },
      "deployment": {
        "platform": "Vercel | Netlify | Railway",
        "environment": "environment variables needed",
        "buildCommand": "build command",
        "outputDirectory": "output directory"
      },
      "cicd": {
        "workflow": "CI/CD pipeline configuration",
        "testing": "automated testing setup",
        "deployment": "deployment automation"
      },
      "monitoring": {
        "analytics": "analytics setup",
        "errorTracking": "error monitoring",
        "performance": "performance monitoring"
      },
      "instructions": [
        "Step-by-step deployment instructions"
      ],
      "reasoning": "Your deployment strategy reasoning and considerations"
    }

    Use reasoning to:
    - Choose optimal deployment platforms
    - Design robust CI/CD pipelines
    - Plan for monitoring and observability
    - Consider scalability and cost optimization

    Focus on Next.js + TypeScript + Tailwind stack with modern deployment practices.
    `,
    providerOptions: {
      groq: { reasoningFormat: 'parsed' }
    }
  })

  const deployment = JSON.parse(text)
  
  return NextResponse.json({
    step: 'deploy',
    agent: 'Senior DevOps Engineer',
    result: deployment,
    nextStep: 'complete'
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Team Coordination API with Groq Reasoning Models',
    description: 'Complete project coordination with AI team specialists using advanced reasoning',
    models: {
      'Senior Business Analyst': 'deepseek-r1-distill-qwen-32b',
      'Senior Software Architect': 'qwen-qwq-32b', 
      'Senior Frontend Developer': 'deepseek-r1-distill-qwen-32b',
      'Senior Backend Developer': 'qwen-qwq-32b',
      'Senior DevOps Engineer': 'llama-3.3-70b-versatile'
    },
    features: [
      'Advanced reasoning capabilities',
      'Step-by-step problem solving',
      'Comprehensive architecture design',
      'Production-ready code generation',
      'Deployment automation'
    ]
  })
} 