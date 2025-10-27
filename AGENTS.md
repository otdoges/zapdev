# AI Agents System Documentation

## Overview

ZapDev implements a sophisticated multi-agent system where specialized AI agents collaborate to generate high-quality web applications. Each agent has specific expertise and responsibilities, working together to ensure comprehensive code generation, testing, and review.

## Agent Architecture

### Agent Roles & Responsibilities

#### 1. Planner Agent
**Purpose**: Expert software architect that creates detailed implementation plans

**Responsibilities**:
- Analyze user requirements and break them into actionable tasks
- Design component structure and file organization
- Identify technical decisions and potential challenges
- Create comprehensive implementation roadmaps

**Output Format**:
```xml
<plan>
## Requirements
- [List all user requirements]

## Architecture  
- [Describe overall structure]
- [List main components/modules]

## Implementation Steps
1. [Step 1 - specific task]
2. [Step 2 - specific task]
3. [Step 3 - specific task]

## Technical Decisions
- [Technology/library choices and rationale]

## Potential Challenges
- [Risk 1 and mitigation strategy]
- [Risk 2 and mitigation strategy]
</plan>
```

**Model**: `google/gemini-2.5-flash-lite`
**Temperature**: 0.4

#### 2. Coder Agent
**Purpose**: Expert software developer that implements code based on plans

**Responsibilities**:
- Write clean, production-ready code following plans
- Follow framework-specific conventions and patterns
- Implement proper error handling and validation
- Install necessary dependencies

**Available Tools**:
- `createOrUpdateFiles`: Create or modify project files
- `readFiles`: Read existing files for context
- `terminal`: Run commands (install packages, build, etc.)

**Code Standards**:
- TypeScript with proper types (avoid 'any')
- Framework conventions (Next.js App Router, React hooks, etc.)
- Modern, idiomatic patterns
- Accessibility (ARIA labels, semantic HTML)
- Responsive design principles

**Output Format**:
```xml
<task_summary>
Implemented: [brief description of what was built]
Files created/modified: [list of files]
Packages installed: [list of packages, if any]
</task_summary>
```

#### 3. Tester Agent
**Purpose**: Expert QA engineer that validates implementations

**Responsibilities**:
- Verify implementation matches requirements
- Find bugs, errors, and edge cases
- Ensure code compiles and builds successfully
- Check for code quality issues

**Testing Approach**:
1. Read implemented files
2. Run linting: `bun run lint`
3. Run build: `bun run build`
4. Analyze output for errors or warnings
5. Check for common issues (missing imports, type errors, etc.)

**Output Format**:
```xml
<test_results>
## Build Status
[PASS/FAIL] - [details]

## Lint Status
[PASS/FAIL] - [details]

## Issues Found
### Critical
- [Issue 1]
- [Issue 2]

### Warnings
- [Warning 1]
- [Warning 2]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Overall Assessment
[PASS/NEEDS_FIX] - [summary]
</test_results>
```

#### 4. Reviewer Agent
**Purpose**: Senior code reviewer that evaluates code quality

**Responsibilities**:
- Evaluate code quality, structure, and patterns
- Check adherence to framework best practices
- Assess overall design and architecture decisions
- Identify performance issues and optimization opportunities

**Review Criteria**:
- **Code Quality**: Clean, readable code with proper naming
- **Type Safety**: Proper TypeScript types, no 'any' types
- **Framework Conventions**: Follows framework best practices
- **Performance**: Efficient algorithms and optimizations
- **Security**: Input validation and XSS prevention
- **User Experience**: Responsive design and accessibility

**Output Format**:
```xml
<code_review>
## Quality Rating
[EXCELLENT/GOOD/NEEDS_IMPROVEMENT]

## Strengths
- [Strength 1]
- [Strength 2]

## Areas for Improvement
### Critical Issues
- [Critical issue 1 with explanation]
- [Critical issue 2 with explanation]

### Suggestions
- [Suggestion 1 with rationale]
- [Suggestion 2 with rationale]

## Performance Notes
- [Performance observation or recommendation]

## Security Notes
- [Security observation or recommendation]

## Final Verdict
[APPROVE/REQUEST_CHANGES] - [summary]
</code_review>
```

## Multi-Agent Workflow

### Workflow Phases

```
User Request
    ↓
Framework Selection
    ↓
[Planner] → Creates implementation plan
    ↓
[Coder] → Implements the plan
    ↓
[Tester] → Tests the implementation
    ↓
[Reviewer] → Reviews code quality
    ↓
Complete (or loop back to Coder if issues found)
```

### State Management

The multi-agent system uses enhanced state tracking:

```typescript
interface AgentState {
  summary: string;
  files: { [path: string]: string };
  selectedFramework?: Framework;
  currentPhase?: 'planning' | 'coding' | 'testing' | 'reviewing' | 'complete';
  plan?: string;
  agentDecisions?: AgentDecision[];
  testResults?: TestResults;
  codeReview?: CodeReview;
  iterations?: number;
}
```

### Agent Routing Logic

The system intelligently routes between agents based on:

1. **Planning Phase**: Routes to Planner if no plan exists
2. **Coding Phase**: Routes to Coder for implementation or fixes
3. **Testing Phase**: Routes to Tester if no test results
4. **Reviewing Phase**: Routes to Reviewer after successful testing
5. **Iteration Control**: Maximum 15 iterations to prevent infinite loops

### Agent Decision Tracking

Each agent decision is logged with:
```typescript
interface AgentDecision {
  agent: AgentRole;
  decision: string;
  reasoning: string;
  timestamp: number;
}
```

## Framework-Specific Agents

### Framework Detection Agent

**Purpose**: Determines the best framework for user requests

**Selection Guidelines**:
- Explicit mentions: Use specified framework
- Ambiguous requests: Default to Next.js
- Complexity indicators: Enterprise → Angular
- UI library hints: Material Design → Angular/Vue
- Performance emphasis: High performance → Svelte

**Supported Frameworks**:
- **nextjs**: Next.js 15 with React, Shadcn UI, Tailwind CSS
- **angular**: Angular 19 with Angular Material, Tailwind CSS
- **react**: React 18 with Vite, Chakra UI, Tailwind CSS
- **vue**: Vue 3 with Vite, Vuetify, Tailwind CSS
- **svelte**: SvelteKit with DaisyUI, Tailwind CSS

### Framework-Specific Prompts

Each framework has tailored prompts that include:
- Framework-specific best practices
- Pre-installed libraries and tools
- File structure conventions
- Component patterns
- Styling approaches

## Configuration

### Environment Variables

```bash
# Agent Mode
AGENT_MODE="multi"  # Use multi-agent system
# or
AGENT_MODE="single"  # Use traditional single agent

# AI Gateway
AI_GATEWAY_API_KEY="your-api-key"
AI_GATEWAY_BASE_URL="https://ai-gateway.vercel.sh/v1"

# E2B Sandboxes
E2B_API_KEY="your-e2b-key"
```

### Event Triggers

- **Single Agent**: `code-agent/run`
- **Multi-Agent**: `multi-agent/run`

The system automatically routes to the correct event based on `AGENT_MODE`.

## Agent Lifecycle

### Agent Creation

```typescript
const plannerAgent = createPlannerAgent();
const coderAgent = createCoderAgent(sandboxId, frameworkPrompt);
const testerAgent = createTesterAgent(sandboxId);
const reviewerAgent = createReviewerAgent(sandboxId);
```

### Network Management

```typescript
const network = createNetwork<AgentState>({
  name: "multi-agent-coding-network",
  agents: [plannerAgent, coderAgent, testerAgent, reviewerAgent],
  maxIter: 20,
  defaultState: state,
  router: createMultiAgentRouter(plannerAgent, coderAgent, testerAgent, reviewerAgent),
});
```

### Response Handling

Each agent includes lifecycle hooks for:
- **onResponse**: Process agent output and update state
- **State Updates**: Modify network state based on agent decisions
- **Phase Transitions**: Move between workflow phases
- **Decision Logging**: Track agent decisions and reasoning

## Quality Assurance

### Iteration Control

- **Maximum Iterations**: 15 cycles to prevent infinite loops
- **Phase Validation**: Ensure proper phase transitions
- **State Consistency**: Maintain coherent state across agents
- **Error Recovery**: Handle agent failures gracefully

### Testing Integration

- **Build Validation**: Ensure code compiles successfully
- **Lint Checking**: Verify code quality standards
- **Error Detection**: Identify and report issues
- **Performance Testing**: Check for optimization opportunities

### Code Review Process

- **Quality Assessment**: Evaluate code against standards
- **Best Practices**: Check framework conventions
- **Security Review**: Identify potential vulnerabilities
- **Performance Analysis**: Suggest optimizations

## Monitoring & Analytics

### Agent Performance Metrics

- **Decision Accuracy**: Track correct agent choices
- **Iteration Efficiency**: Measure cycles to completion
- **Error Rates**: Monitor agent failure rates
- **Quality Scores**: Assess output quality

### User Experience Metrics

- **Completion Rates**: Track successful project completions
- **Framework Selection**: Monitor framework accuracy
- **User Satisfaction**: Measure user feedback
- **Processing Times**: Track agent response times

## Best Practices

### Agent Design

- **Clear Responsibilities**: Each agent has specific expertise
- **Structured Output**: Use XML tags for consistent parsing
- **Error Handling**: Graceful failure and recovery
- **State Management**: Maintain coherent state across agents

### Prompt Engineering

- **Role Definition**: Clear agent roles and responsibilities
- **Output Format**: Structured response formats
- **Examples**: Provide clear examples and guidelines
- **Context Awareness**: Include relevant context and constraints

### System Integration

- **Modular Design**: Independent agent components
- **Event-Driven**: Asynchronous agent communication
- **Scalable Architecture**: Support for additional agents
- **Monitoring**: Comprehensive logging and analytics

## Troubleshooting

### Common Issues

1. **Agent Loops**: Infinite iteration cycles
   - Check iteration limits
   - Validate phase transitions
   - Review routing logic

2. **State Inconsistency**: Conflicting agent states
   - Verify state management
   - Check agent communication
   - Review lifecycle hooks

3. **Framework Detection**: Incorrect framework selection
   - Review selection prompt
   - Check user input parsing
   - Validate framework mapping

### Debug Mode

Enable detailed logging:
```bash
DEBUG=true
```

Monitor agent decisions and state changes in real-time.

## Future Enhancements

### Planned Features

- **Custom Agents**: User-defined specialized agents
- **Agent Marketplace**: Community-contributed agents
- **Advanced Testing**: Automated test generation
- **Performance Optimization**: Agent-specific optimizations
- **Collaborative Agents**: Multi-user agent interactions

### Research Areas

- **Agent Learning**: Adaptive agent behavior
- **Quality Prediction**: Predictive quality assessment
- **Framework Evolution**: Dynamic framework support
- **User Intent**: Advanced requirement understanding
