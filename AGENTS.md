# AI Agents System Documentation

## Overview

ZapDev now runs a streamlined single-agent workflow. A framework selector chooses the right starter template, then one production-grade coding agent builds the requested project inside an isolated E2B sandbox. Automated lint and build checks catch regressions before results are saved.

## Agent Architecture

### Framework Selector
- Reads the latest user message and recent project history
- Picks one of the supported frameworks (`nextjs`, `angular`, `react`, `vue`, `svelte`)
- Persists the selected framework on the project so subsequent runs reuse it

### Code Generation Agent
- Writes and updates files using sandbox file APIs
- Runs commands (install, lint, build) through the sandbox terminal
- Follows framework prompts that encode our conventions and guardrails
- Produces a `<task_summary>` describing what changed

**Code Standards**
- Strict TypeScript (avoid `any`)
- Modern framework patterns (Next.js App Router, React hooks, etc.)
- Accessibility and responsive design as defaults
- Never start a dev server; rely on `bun run lint` / `bun run build`

**Available Tools**
- `createOrUpdateFiles`
- `readFiles`
- `terminal`

## Workflow

1. **User Request** → message stored on the project
2. **Framework Selection** → `framework-selector` agent decides the framework if unset
3. **Coding Loop** → code agent iterates until a `<task_summary>` is produced
4. **Validation** → automatic lint and build checks run in the sandbox
5. **Persistence** → files and sandbox metadata saved to the project fragment

## Agent State

```typescript
interface AgentState {
  summary: string;
  files: Record<string, string>;
  selectedFramework?: 'nextjs' | 'angular' | 'react' | 'vue' | 'svelte';
}
```

## Configuration

```bash
AI_GATEWAY_API_KEY="your-api-key"
AI_GATEWAY_BASE_URL="https://ai-gateway.vercel.sh/v1/"
E2B_API_KEY="your-e2b-key"
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```

## Troubleshooting

1. **Framework Detection Errors**
   - Check `FRAMEWORK_SELECTOR_PROMPT`
   - Ensure recent messages exist for context

2. **Code Generation Failures**
   - Confirm E2B sandbox templates are available
   - Verify AI Gateway credentials
   - Review framework prompt instructions

3. **Build or Lint Failures**
   - Inspect sandbox command output logged by Inngest
   - Re-run `bun run lint` / `bun run build` locally if needed
