import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getGroqInstance } from '@/lib/groq-provider';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

// Helper to safely parse JSON from AI responses
function safeJsonParse(text: string, defaultValue: Record<string, unknown>) {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;

    return JSON.parse(jsonStr);
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'JSON parsing error', error);
    errorLogger.info(ErrorCategory.API, `Raw text that failed to parse: ${text.substring(0, 500)}`);
    return defaultValue;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userRequest, step = 'analyze' } = await req.json();

    if (!userRequest) {
      return NextResponse.json({ error: 'User request is required' }, { status: 400 });
    }

    errorLogger.info(
      ErrorCategory.API,
      `AI Team: Processing ${step} step for request: ${userRequest.substring(0, 100)}`
    );

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
    errorLogger.error(ErrorCategory.API, 'AI Team coordination error', error);
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
      model: getGroqInstance()('meta-llama/llama-4-maverick-17b-128e-instruct'), // Analysis uses maverick model
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
    errorLogger.error(ErrorCategory.API, 'Analysis error', error);
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
      model: getGroqInstance()('meta-llama/llama-4-maverick-17b-128e-instruct'), // Architecture uses maverick model
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
    errorLogger.error(ErrorCategory.API, 'Architecture error', error);
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
      model: getGroqInstance()('qwen-qwq-32b'), // Frontend uses qwen-qwq-32b
      messages: [
        {
          role: 'system',
          content:
            'You are a Senior Frontend Developer. Create frontend implementation and respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `
Create frontend implementation for:

"${userRequest}"

Return ONLY a JSON object with this exact structure:
{
  "components": ["list of React components needed"],
  "pages": ["list of pages/routes needed"],
  "hooks": ["custom hooks needed"],
  "utils": ["utility functions needed"],
  "styling": {
    "approach": "Tailwind CSS | styled-components | CSS modules",
    "theme": "theme configuration needed",
    "responsive": "responsive design considerations"
  },
  "state": {
    "management": "Redux | Zustand | Context | local",
    "structure": "state structure design"
  },
  "api": {
    "endpoints": ["API endpoints to call"],
    "client": "fetch | axios | SWR | React Query"
  },
  "testing": ["testing strategy"],
  "reasoning": "Your frontend development reasoning"
}
`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    const frontend = safeJsonParse(text, {
      components: ['App', 'Header', 'Main', 'Footer'],
      pages: ['Home', 'About', 'Contact'],
      hooks: ['useApi', 'useAuth'],
      utils: ['helpers', 'constants'],
      styling: {
        approach: 'Tailwind CSS',
        theme: 'Default theme',
        responsive: 'Mobile-first',
      },
      state: {
        management: 'Context',
        structure: 'Simple context state',
      },
      api: {
        endpoints: ['/api/data'],
        client: 'fetch',
      },
      testing: ['Jest', 'React Testing Library'],
      reasoning: 'Standard React application structure',
    });

    errorLogger.info(ErrorCategory.API, 'AI Team: Frontend development completed successfully');

    return NextResponse.json({
      step: 'frontend',
      agent: 'Senior Frontend Developer',
      result: frontend,
      nextStep: 'backend',
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Frontend error', error);
    return NextResponse.json(
      {
        step: 'frontend',
        agent: 'Senior Frontend Developer',
        error: 'Failed to develop frontend',
        result: {
          components: ['App', 'Main'],
          reasoning: 'Error occurred - using minimal frontend',
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
      model: getGroqInstance()('deepseek-r1-distill-llama-70b'), // Backend uses deepseek-r1-distill-llama-70b
      messages: [
        {
          role: 'system',
          content:
            'You are a Senior Backend Developer. Create backend implementation and respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `
Create backend implementation for:

"${userRequest}"

Return ONLY a JSON object with this exact structure:
{
  "api": {
    "framework": "Express | Fastify | Next.js API | Nest.js",
    "routes": ["list of API routes needed"],
    "middleware": ["middleware functions needed"],
    "validation": "validation strategy"
  },
  "database": {
    "type": "PostgreSQL | MongoDB | SQLite | MySQL",
    "schema": "database schema design",
    "migrations": ["migration files needed"],
    "queries": ["key database queries"]
  },
  "auth": {
    "strategy": "JWT | OAuth | Session | Custom",
    "providers": ["auth providers if needed"],
    "permissions": "authorization strategy"
  },
  "services": ["business logic services"],
  "utils": ["utility functions"],
  "testing": ["testing strategy"],
  "deployment": {
    "environment": "development setup",
    "production": "production considerations"
  },
  "reasoning": "Your backend development reasoning"
}
`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    const backend = safeJsonParse(text, {
      api: {
        framework: 'Next.js API',
        routes: ['/api/users', '/api/data'],
        middleware: ['auth', 'cors', 'validation'],
        validation: 'Zod schemas',
      },
      database: {
        type: 'SQLite',
        schema: 'Basic user and data tables',
        migrations: ['001_initial.sql'],
        queries: ['SELECT', 'INSERT', 'UPDATE'],
      },
      auth: {
        strategy: 'JWT',
        providers: ['local'],
        permissions: 'Role-based',
      },
      services: ['userService', 'dataService'],
      utils: ['database', 'auth'],
      testing: ['Jest', 'Supertest'],
      deployment: {
        environment: 'Local development',
        production: 'Vercel deployment',
      },
      reasoning: 'Standard Node.js API structure',
    });

    errorLogger.info(ErrorCategory.API, 'AI Team: Backend development completed successfully');

    return NextResponse.json({
      step: 'backend',
      agent: 'Senior Backend Developer',
      result: backend,
      nextStep: 'deploy',
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Backend error', error);
    return NextResponse.json(
      {
        step: 'backend',
        agent: 'Senior Backend Developer',
        error: 'Failed to develop backend',
        result: {
          api: { framework: 'Next.js API', routes: ['/api/health'] },
          reasoning: 'Error occurred - using minimal backend',
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
      model: getGroqInstance()('meta-llama/llama-4-scout-17b-16e-instruct'), // Senior backend uses scout model
      messages: [
        {
          role: 'system',
          content:
            'You are a Senior DevOps Engineer. Create deployment setup and respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `
Create deployment setup for:

"${userRequest}"

Return ONLY a JSON object with this exact structure:
{
  "platform": "Vercel | Netlify | AWS | Railway | Docker",
  "environment": {
    "variables": ["list of env vars needed"],
    "secrets": ["secrets management"],
    "config": "configuration setup"
  },
  "build": {
    "commands": ["build commands"],
    "artifacts": ["build outputs"],
    "optimization": "build optimizations"
  },
  "database": {
    "hosting": "database hosting solution",
    "backups": "backup strategy",
    "scaling": "scaling considerations"
  },
  "monitoring": {
    "logging": "logging setup",
    "metrics": "monitoring tools",
    "alerts": "alerting strategy"
  },
  "security": {
    "ssl": "SSL/TLS setup",
    "headers": "security headers",
    "auth": "authentication setup"
  },
  "ci_cd": {
    "pipeline": "CI/CD pipeline",
    "testing": "automated testing",
    "deployment": "deployment strategy"
  },
  "reasoning": "Your deployment reasoning"
}
`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    const deployment = safeJsonParse(text, {
      platform: 'Vercel',
      environment: {
        variables: ['NODE_ENV', 'DATABASE_URL', 'API_KEY'],
        secrets: 'Vercel environment variables',
        config: 'vercel.json configuration',
      },
      build: {
        commands: ['npm run build'],
        artifacts: ['.next', 'public'],
        optimization: 'Next.js optimizations',
      },
      database: {
        hosting: 'Vercel Postgres',
        backups: 'Automated backups',
        scaling: 'Connection pooling',
      },
      monitoring: {
        logging: 'Vercel logs',
        metrics: 'Vercel Analytics',
        alerts: 'Email notifications',
      },
      security: {
        ssl: 'Automatic HTTPS',
        headers: 'Security headers',
        auth: 'Environment-based auth',
      },
      ci_cd: {
        pipeline: 'GitHub Actions',
        testing: 'Automated tests on PR',
        deployment: 'Automatic deployment',
      },
      reasoning: 'Standard Vercel deployment setup',
    });

    errorLogger.info(ErrorCategory.API, 'AI Team: Deployment setup completed successfully');

    return NextResponse.json({
      step: 'deploy',
      agent: 'Senior DevOps Engineer',
      result: deployment,
      status: 'complete',
    });
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Deployment error', error);
    return NextResponse.json(
      {
        step: 'deploy',
        agent: 'Senior DevOps Engineer',
        error: 'Failed to setup deployment',
        result: {
          platform: 'Vercel',
          reasoning: 'Error occurred - using basic deployment',
        },
        status: 'complete',
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Team Coordination API',
    availableSteps: ['analyze', 'architect', 'frontend', 'backend', 'deploy'],
    usage: 'POST with { userRequest: "your request", step: "analyze" }',
  });
}
