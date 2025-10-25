# Multi-Agent System

## Overview

The multi-agent system enables collaborative AI agents to work together on code generation tasks. Instead of a single agent handling everything, specialized agents focus on their expertise areas.

## Architecture

### Agent Roles

1. **Planner Agent** (`planner`)
   - Analyzes user requirements
   - Creates detailed implementation plans
   - Designs architecture and component structure
   - Identifies potential challenges

2. **Coder Agent** (`coder`)
   - Implements code based on the plan
   - Creates and updates files
   - Runs terminal commands
   - Installs dependencies

3. **Tester Agent** (`tester`)
   - Runs lint checks
   - Executes build validation
   - Identifies errors and issues
   - Provides test results

4. **Reviewer Agent** (`reviewer`)
   - Reviews code quality
   - Checks best practices
   - Assesses architecture decisions
   - Suggests improvements

### Workflow

```
User Request
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

## Configuration

### Enabling Multi-Agent Mode

Set the environment variable in your `.env` file:

```bash
AGENT_MODE="multi"  # Use multi-agent system
# or
AGENT_MODE="single"  # Use traditional single agent (default)
```

### Event Triggers

- **Single Agent**: `code-agent/run`
- **Multi-Agent**: `multi-agent/run`

The system automatically routes to the correct event based on `AGENT_MODE`.

## Files Created

### Core Files

1. **`src/inngest/types.ts`**
   - Extended `AgentState` with multi-agent fields
   - Added `AgentRole`, `AgentDecision`, `TestResults`, `CodeReview` types

2. **`src/inngest/multi-agent.ts`**
   - Agent factory functions
   - Multi-agent router logic
   - State management for agent collaboration

3. **`src/prompts/agents/`**
   - `planner.ts` - Planner agent prompt
   - `coder.ts` - Coder agent prompt
   - `tester.ts` - Tester agent prompt
   - `reviewer.ts` - Reviewer agent prompt

4. **`src/inngest/functions.ts`**
   - Added `multiAgentFunction` for multi-agent workflows
   - Keeps existing `codeAgentFunction` for backward compatibility

5. **`src/lib/agent-mode.ts`**
   - Utility to determine agent mode
   - Event name resolver

### API Integration

Updated files:
- `src/app/api/inngest/route.ts` - Added `multiAgentFunction` to served functions
- `src/modules/messages/server/procedures.ts` - Routes to correct agent mode
- `src/modules/projects/server/procedures.ts` - Routes to correct agent mode

## Benefits

### Quality Improvements
- **Better Planning**: Dedicated planner creates comprehensive implementation plans
- **Code Quality**: Reviewer agent catches issues and suggests improvements
- **Testing**: Automated testing catches errors before completion
- **Iteration**: Agents can loop back to fix issues found during testing/review

### Observability
- **Agent Decisions**: Track which agent made which decision and why
- **Test Results**: Detailed breakdown of errors and warnings
- **Code Review**: Quality assessment with specific suggestions
- **Iterations**: Track how many iteration cycles were needed

### Flexibility
- **Framework Support**: Works with all supported frameworks (Next.js, React, Vue, Angular, Svelte)
- **Backward Compatible**: Original single-agent system still available
- **Easy Toggle**: Switch between modes with environment variable

## Limitations

- **Higher Token Usage**: Multiple agents mean more API calls
- **Longer Execution Time**: More comprehensive but takes longer than single agent
- **Max Iterations**: Capped at 20 iterations to prevent infinite loops

## Usage Example

1. Set environment variable:
```bash
AGENT_MODE="multi"
```

2. Create a project or send a message as usual - the system automatically uses multi-agent mode

3. Monitor agent progress through Inngest dashboard

4. View detailed metadata in Fragment records (includes `agentDecisions`, `testResults`, `codeReview`)

## Future Enhancements

- UI to show live agent collaboration
- Per-project agent mode selection
- Custom agent configurations
- Additional specialized agents (e.g., documentation agent, security agent)
- Agent collaboration metrics and analytics
