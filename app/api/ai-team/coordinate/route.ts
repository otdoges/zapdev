import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { groqProvider, getGroqModelId } from '@/lib/groq-provider';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

// Helper to safely parse JSON from AI responses
function safeJsonParse(text: string, defaultValue: any) {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;

    return JSON.parse(jsonStr);
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'JSON parsing error:', error);
    errorLogger.info(ErrorCategory.API, 'Raw text that failed to parse:', text.substring(0, 500));
    return defaultValue;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userRequest, step = 'analyze' } = await req.json();

    if (!userRequest) {
      return NextResponse.json({ error: 'User request is required' }, { status: 400 });
    }

<<<<<<< HEAD
    errorLogger.info(
      ErrorCategory.API,
      `AI Team: Processing ${step} step for request:`,
      userRequest.substring(0, 100)
    );
=======
    console.log('AI Team: Processing %s step for request:', step, userRequest.substring(0, 100));
>>>>>>> refs/remotes/origin/master

    switch (step) {
      case 'analyze':
        return await analyzeRequirements(userRequest);
      case 'architect':
        return await architectureDesign(userRequest);
      case 'frontend':
        return await frontendDevelopment(userRequest);
      case 'backend':
        return await backendDevelopment(userRequest);
      case 'deploy':
        return await deploymentSetup(userRequest);
      default:
        return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'AI Team coordination error:', error);
    return NextResponse.json(
      {
        error: 'Failed to coordinate AI team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function analyzeRequirements(userRequest: string) {
  try {
    const { text } = await generateText({
      model: groqProvider.chat('llama-3.3-70b-versatile'), // Using available model
      messages: [
        {
          role: 'system',
          content:
            'You are a Senior Business Analyst. Analyze project requirements and respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `
Analyze this project request and provide detailed analysis in JSON format:

"${userRequest}"

Return ONLY a JSON object with this exact structure:
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
  "reasoning": "Your step-by-step analysis"
}
`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    const analysis = safeJsonParse(text, {
      projectType: 'web app',
      complexity: 'medium',
      timeEstimate: '1-2 weeks',
      technologies: ['React', 'TypeScript', 'Tailwind CSS'],
      features: ['User interface', 'Data management'],
      challenges: ['Technical implementation'],
      requirements: {
        functional: ['Core functionality'],
        nonFunctional: ['Performance', 'Security'],
      },
      success_criteria: ['Working application'],
      reasoning: 'Analysis based on user requirements',
    });

    errorLogger.info(ErrorCategory.API, 'AI Team: Analysis completed successfully');

    return NextResponse.json({
      step: 'analyze',
      agent: 'Senior Business Analyst',
      result: analysis,
      nextStep: 'architect',
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Analysis error:', error);
    return NextResponse.json(
      {
        step: 'analyze',
        agent: 'Senior Business Analyst',
        error: 'Failed to analyze requirements',
        result: {
          projectType: 'web app',
          complexity: 'medium',
          reasoning: 'Error occurred during analysis - using defaults',
        },
        nextStep: 'architect',
      },
      { status: 200 }
    ); // Return 200 to allow workflow to continue
  }
}

async function architectureDesign(userRequest: string) {
  try {
    const { text } = await generateText({
      model: groqProvider.chat('mixtral-8x7b-32768'), // Using available model
      messages: [
        {
          role: 'system',
          content:
            'You are a Senior Software Architect. Design system architecture and respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `
Design the system architecture for:

"${userRequest}"

Return ONLY a JSON object with this exact structure:
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
  "reasoning": "Your architectural reasoning"
}
`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    const architecture = safeJsonParse(text, {
      architecture: {
        pattern: 'monolith',
        frontend: {
          framework: 'React',
          styling: 'Tailwind CSS',
          stateManagement: 'Context',
        },
        backend: {
          framework: 'Node.js',
          database: 'SQLite',
          api: 'REST',
        },
        infrastructure: {
          hosting: 'Vercel',
          cdn: 'Cloudflare',
          monitoring: 'Sentry',
        },
      },
      dataFlow: 'Client -> API -> Database',
      securityConsiderations: ['Authentication', 'Input validation'],
      scalabilityPlan: 'Horizontal scaling',
      reasoning: 'Standard web application architecture',
    });

    errorLogger.info(ErrorCategory.API, 'AI Team: Architecture design completed successfully');

    return NextResponse.json({
      step: 'architect',
      agent: 'Senior Software Architect',
      result: architecture,
      nextStep: 'frontend',
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Architecture error:', error);
    return NextResponse.json(
      {
        step: 'architect',
        agent: 'Senior Software Architect',
        error: 'Failed to design architecture',
        result: {
          architecture: {
            pattern: 'monolith',
            frontend: { framework: 'React', styling: 'Tailwind CSS' },
          },
          reasoning: 'Error occurred - using default architecture',
        },
        nextStep: 'frontend',
      },
      { status: 200 }
    );
  }
}

async function frontendDevelopment(userRequest: string) {
  try {
    const { text } = await generateText({
      model: groqProvider.chat('llama-3.1-70b-versatile'), // Using available model
      messages: [
        {
          role: 'system',
          content:
            'You are a Senior Frontend Developer. Create frontend implementation and respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `
Create the frontend implementation for:

"${userRequest}"

Return ONLY a JSON object with this exact structure:
{
  "components": [
    {
      "name": "ComponentName",
      "purpose": "what this component does",
      "props": ["list of props"],
      "code": "complete React component code with TypeScript and Tailwind CSS"
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
  "testing": ["testing strategy"],
  "reasoning": "Your frontend design reasoning"
}

Make sure the code is complete and production-ready.
`,
        },
      ],
      temperature: 0.7,
      maxTokens: 4096, // Increased for code generation
    });

    const frontend = safeJsonParse(text, {
      components: [
        {
          name: 'App',
          purpose: 'Main application component',
          props: [],
          code: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-gray-50">\n      <h1 className="text-3xl font-bold text-center py-8">Welcome to ${userRequest}</h1>\n    </div>\n  );\n}`,
        },
      ],
      pages: [
        {
          route: '/',
          name: 'Home',
          code: `export default function Home() {\n  return <div>Home Page</div>;\n}`,
        },
      ],
      styling: {
        theme: 'Modern design with Tailwind CSS',
        responsive: 'Mobile-first approach',
        accessibility: 'WCAG 2.1 compliant',
      },
      interactions: ['Smooth transitions'],
      testing: ['Component testing with Jest'],
      reasoning: 'Simple starting structure',
    });

    errorLogger.info(ErrorCategory.API, 'AI Team: Frontend development completed successfully');

    return NextResponse.json({
      step: 'frontend',
      agent: 'Senior Frontend Developer',
      result: frontend,
      nextStep: 'backend',
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Frontend error:', error);
    return NextResponse.json(
      {
        step: 'frontend',
        agent: 'Senior Frontend Developer',
        error: 'Failed to develop frontend',
        result: {
          components: [
            {
              name: 'App',
              code: '// Error generating component',
            },
          ],
          reasoning: 'Error occurred - minimal component provided',
        },
        nextStep: 'backend',
      },
      { status: 200 }
    );
  }
}

async function backendDevelopment(userRequest: string) {
  try {
    const { text } = await generateText({
      model: groqProvider.chat('gemma2-9b-it'), // Using available model
      messages: [
        {
          role: 'system',
          content:
            'You are a Senior Backend Developer. Design the backend and respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `
Design the backend for:

"${userRequest}"

Return ONLY a JSON object with this exact structure:
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
  "reasoning": "Your backend design reasoning"
}
`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    const backend = safeJsonParse(text, {
      api: {
        endpoints: [
          {
            method: 'GET',
            path: '/api/health',
            purpose: 'Health check endpoint',
            parameters: [],
            response: "{ status: 'ok' }",
            code: "export default function handler(req, res) {\n  res.status(200).json({ status: 'ok' });\n}",
          },
        ],
        middleware: ['CORS', 'Rate limiting'],
        errorHandling: 'Centralized error handling',
      },
      database: {
        schema: [
          {
            table: 'users',
            fields: ['id', 'email', 'created_at'],
            relationships: [],
          },
        ],
        migrations: '// Database setup',
        queries: ['SELECT * FROM users'],
      },
      services: [],
      security: {
        authentication: 'JWT tokens',
        authorization: 'Role-based access control',
        dataValidation: 'Input sanitization',
      },
      reasoning: 'Basic backend structure',
    });

    errorLogger.info(ErrorCategory.API, 'AI Team: Backend development completed successfully');

    return NextResponse.json({
      step: 'backend',
      agent: 'Senior Backend Developer',
      result: backend,
      nextStep: 'deploy',
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Backend error:', error);
    return NextResponse.json(
      {
        step: 'backend',
        agent: 'Senior Backend Developer',
        error: 'Failed to develop backend',
        result: {
          api: { endpoints: [] },
          reasoning: 'Error occurred - minimal backend provided',
        },
        nextStep: 'deploy',
      },
      { status: 200 }
    );
  }
}

async function deploymentSetup(userRequest: string) {
  try {
    const { text } = await generateText({
      model: groqProvider.chat('llama-3.3-70b-versatile'), // Using available model
      messages: [
        {
          role: 'system',
          content:
            'You are a Senior DevOps Engineer. Create deployment configuration and respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `
Create deployment configuration for:

"${userRequest}"

Return ONLY a JSON object with this exact structure:
{
  "packageJson": {
    "name": "project-name",
    "version": "1.0.0",
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
  "reasoning": "Your deployment strategy reasoning"
}

Focus on Next.js + TypeScript + Tailwind stack.
`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    const deployment = safeJsonParse(text, {
      packageJson: {
        name: 'zapdev-project',
        version: '1.0.0',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
        },
        dependencies: {
          next: '14.0.0',
          react: '18.2.0',
          'react-dom': '18.2.0',
          typescript: '5.0.0',
        },
        devDependencies: {
          '@types/react': '18.2.0',
          '@types/node': '20.0.0',
          tailwindcss: '3.4.0',
          autoprefixer: '10.4.0',
          postcss: '8.4.0',
        },
      },
      deployment: {
        platform: 'Vercel',
        environment: 'NODE_ENV=production',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
      },
      cicd: {
        workflow: 'GitHub Actions',
        testing: 'Jest + React Testing Library',
        deployment: 'Automatic on push to main',
      },
      monitoring: {
        analytics: 'Vercel Analytics',
        errorTracking: 'Sentry',
        performance: 'Web Vitals',
      },
      instructions: [
        '1. Initialize git repository',
        '2. Connect to Vercel',
        '3. Configure environment variables',
        '4. Deploy',
      ],
      reasoning: 'Standard Next.js deployment',
    });

    errorLogger.info(ErrorCategory.API, 'AI Team: Deployment setup completed successfully');

    return NextResponse.json({
      step: 'deploy',
      agent: 'Senior DevOps Engineer',
      result: deployment,
      nextStep: 'complete',
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Deployment error:', error);
    return NextResponse.json(
      {
        step: 'deploy',
        agent: 'Senior DevOps Engineer',
        error: 'Failed to setup deployment',
        result: {
          packageJson: {
            name: 'project',
            scripts: { dev: 'next dev' },
          },
          reasoning: 'Error occurred - minimal deployment config provided',
        },
        nextStep: 'complete',
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Team Coordination API with Groq Models',
    description: 'Complete project coordination with AI team specialists',
    models: {
      'Senior Business Analyst': 'llama-3.3-70b-versatile',
      'Senior Software Architect': 'mixtral-8x7b-32768',
      'Senior Frontend Developer': 'llama-3.1-70b-versatile',
      'Senior Backend Developer': 'gemma2-9b-it',
      'Senior DevOps Engineer': 'llama-3.3-70b-versatile',
    },
    features: [
      'Step-by-step problem solving',
      'Comprehensive architecture design',
      'Production-ready code generation',
      'Deployment automation',
      'Error recovery and fallbacks',
    ],
  });
}
