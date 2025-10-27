# Claude AI Integration Guide

## Overview

ZapDev is an AI-powered development platform that enables users to create web applications through conversational AI interactions. The platform leverages Claude AI (via Vercel AI Gateway) to generate production-ready code across multiple frameworks in real-time sandboxes.

## Architecture

### Core Components

1. **AI Gateway Integration**
   - Uses Vercel AI Gateway for Claude AI access
   - Supports multiple AI models (OpenAI, Anthropic, Grok)
   - Centralized API key management

2. **Multi-Agent System**
   - **Planner Agent**: Analyzes requirements and creates implementation plans
   - **Coder Agent**: Implements code based on plans
   - **Tester Agent**: Validates code quality and functionality
   - **Reviewer Agent**: Reviews code for best practices and improvements

3. **Framework Support**
   - **Next.js 15**: Full-stack React with SSR, Shadcn UI, Tailwind CSS
   - **Angular 19**: Enterprise apps with Angular Material, Tailwind CSS
   - **React 18**: SPA with Vite, Chakra UI, Tailwind CSS
   - **Vue 3**: Progressive apps with Vuetify, Tailwind CSS
   - **SvelteKit**: High-performance apps with DaisyUI, Tailwind CSS

4. **Real-time Development Environment**
   - E2B Code Interpreter sandboxes
   - Live preview and code editing
   - File explorer with syntax highlighting
   - Split-pane interface for code and preview

## AI Agent Workflow

### Single Agent Mode (Default)
```
User Request → Framework Selection → Code Generation → Preview
```

### Multi-Agent Mode
```
User Request → Framework Selection → Planner → Coder → Tester → Reviewer → Complete
```

## Configuration

### Environment Variables

```bash
# AI Gateway (Claude AI)
AI_GATEWAY_API_KEY="your-api-key"
AI_GATEWAY_BASE_URL="https://ai-gateway.vercel.sh/v1/"

# Agent Mode
AGENT_MODE="single"  # or "multi"

# E2B Sandboxes
E2B_API_KEY="your-e2b-key"

# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."

# Background Jobs
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```

### Agent Mode Selection

The system supports two agent modes:

- **Single Agent**: Traditional approach with one AI agent handling all tasks
- **Multi-Agent**: Collaborative system with specialized agents

Switch modes by setting `AGENT_MODE` environment variable.

## Framework Detection

The platform automatically detects the appropriate framework based on user input:

1. **Explicit Mentions**: If user specifies a framework, use it
2. **Default Selection**: Next.js for ambiguous requests
3. **Complexity Analysis**: Angular for enterprise apps
4. **UI Preferences**: Material Design → Angular/Vue
5. **Performance Needs**: Svelte for high-performance requirements

## Code Generation Process

### 1. Project Creation
- User describes desired application
- System creates project with unique ID
- Framework is automatically selected or detected

### 2. AI Processing
- Messages sent to Claude AI via Inngest background jobs
- Framework-specific prompts guide code generation
- Real-time progress updates to user interface

### 3. Sandbox Execution
- E2B sandbox created with framework-specific template
- Code generated and executed in isolated environment
- Live preview available at assigned port

### 4. Iteration & Refinement
- Users can request modifications
- AI agents can iterate based on feedback
- Multi-agent system provides quality assurance

## API Integration

### Message Processing
```typescript
// Single agent
await inngest.send({
  name: "code-agent/run",
  data: { projectId, value: userMessage }
});

// Multi-agent
await inngest.send({
  name: "multi-agent/run", 
  data: { projectId, value: userMessage }
});
```

### Framework Selection
```typescript
const frameworkSelectorAgent = createAgent({
  name: "framework-selector",
  system: FRAMEWORK_SELECTOR_PROMPT,
  model: openai({
    model: "google/gemini-2.5-flash-lite",
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: process.env.AI_GATEWAY_BASE_URL
  })
});
```

## Best Practices

### For AI Prompts
- Use framework-specific prompts for better code generation
- Include clear role definitions and responsibilities
- Specify output formats with structured tags
- Provide examples and guidelines

### For Code Quality
- Implement proper error handling
- Use TypeScript with strict types
- Follow framework conventions
- Include accessibility features
- Optimize for performance

### For User Experience
- Provide real-time feedback
- Show progress indicators
- Enable easy iteration
- Support multiple frameworks
- Maintain conversation history

## Monitoring & Analytics

### Agent Performance
- Track agent decision-making
- Monitor iteration cycles
- Measure code quality metrics
- Analyze framework selection accuracy

### User Engagement
- Message processing times
- Project completion rates
- Framework usage patterns
- Error rates and resolution

## Troubleshooting

### Common Issues

1. **Framework Detection Errors**
   - Check framework selector prompt
   - Verify user input parsing
   - Review framework mapping

2. **Code Generation Failures**
   - Validate AI Gateway connectivity
   - Check sandbox template availability
   - Review agent prompts

3. **Multi-Agent Loops**
   - Monitor iteration limits
   - Check agent routing logic
   - Validate state management

### Debug Mode

Enable detailed logging by setting:
```bash
DEBUG=true
```

## Future Enhancements

- **Custom Agent Roles**: User-defined specialized agents
- **Framework Extensions**: Support for additional frameworks
- **Collaborative Editing**: Multi-user real-time collaboration
- **Advanced Testing**: Automated test generation
- **Deployment Integration**: Direct deployment to cloud platforms

## Security Considerations

- **Sandbox Isolation**: All code execution in isolated environments
- **API Key Management**: Secure storage and rotation
- **Input Validation**: Sanitize user inputs
- **Rate Limiting**: Prevent abuse and overuse
- **Access Control**: User authentication and authorization

## Performance Optimization

- **Caching**: Cache framework templates and prompts
- **Parallel Processing**: Concurrent agent execution
- **Resource Management**: Efficient sandbox lifecycle
- **CDN Integration**: Fast asset delivery
- **Database Optimization**: Efficient queries and indexing
