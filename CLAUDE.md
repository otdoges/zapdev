# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Use `bun` for all package management and script execution:

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production  
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run test:integration` - Run E2B integration tests (requires tests/ directory)
- `bun run test:api` - Run API endpoint tests (requires tests/ directory)
- `bun run test:code` - Run code execution tests (requires tests/ directory)
- `bun run test:all` - Run all test suites (requires tests/ directory)

Note: Test files are not currently present in the repository structu

## Architecture Overview

This is "Zapdev", a Next.js 15 app inspired by scout.new that enables AI-assisted React 

The application creates isolated development environments where users can chat with AI agents to# Claude Code Guidelines for ZapDev

## Implementation Best Practices

### 0 — Purpose  

These rules ensure maintainability, safety, and developer velocity for the ZapDev AI-assisted React development platform.
**MUST** rules are enforced by CI; **SHOULD** rules are strongly recommended.

---

### 1 — Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex work.  
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons.

---

### 2 — While Coding

- **C-1 (MUST)** Follow TDD: scaffold stub -> write failing test -> implement.
- **C-2 (MUST)** Name functions with existing domain vocabulary for consistency.  
- **C-3 (SHOULD NOT)** Introduce classes when small testable functions suffice.  
- **C-4 (SHOULD)** Prefer simple, composable, testable functions.
- **C-5 (MUST)** Prefer branded `type`s for IDs
  ```ts
  type SandboxId = Brand<string, 'SandboxId'>   // ✅ Good
  type ChatId = Brand<string, 'ChatId'>         // ✅ Good
  type UserId = string                          // ❌ Bad
  ```  
- **C-6 (MUST)** Use `import type { … }` for type-only imports.
- **C-7 (SHOULD NOT)** Add comments except for critical caveats; rely on self‑explanatory code.
- **C-8 (SHOULD)** Default to `type`; use `interface` only when more readable or interface merging is required. 
- **C-9 (SHOULD NOT)** Extract a new function unless it will be reused elsewhere, is the only way to unit-test otherwise untestable logic, or drastically improves readability of an opaque block.
- **C-10 (MUST NOT)** Use `any` type. Use `unknown` for truly unknown types, proper type unions, or generic constraints instead.

---

### 3 — Testing

- **T-1 (MUST)** For a simple function, colocate unit tests in `*.spec.ts` in same directory as source file.
- **T-2 (MUST)** For API routes, add/extend integration tests in `tests/` directory using appropriate test suite.
- **T-3 (MUST)** ALWAYS separate pure-logic unit tests from E2B sandbox integration tests.
- **T-4 (SHOULD)** Prefer integration tests over heavy mocking.  
- **T-5 (SHOULD)** Unit-test complex algorithms thoroughly, especially multi-agent coordination logic.
- **T-6 (SHOULD)** Test the entire structure in one assertion if possible
  ```ts
  expect(result).toEqual([sandboxData]) // Good

  expect(result).toHaveLength(1);       // Bad
  expect(result[0]).toBe(sandboxData);  // Bad
  ```
- **T-7 (MUST)** Mock E2B sandbox calls in unit tests; use real E2B integration only in integration tests.

---

### 4 — Database & External Services

- **D-1 (MUST)** Type Convex database helpers properly with generated types from `convex/_generated/`.  
- **D-2 (SHOULD)** Override incorrect generated types in appropriate type definition files.
- **D-3 (MUST)** Always handle E2B sandbox errors gracefully with proper error types.
- **D-4 (SHOULD)** Use branded types for external service IDs (E2B sandbox IDs, Convex document IDs).

---

### 5 — Code Organization

- **O-1 (MUST)** Place shared utilities in `lib/` only if used by ≥ 2 components or API routes.
- **O-2 (MUST)** Keep API route logic in `app/api/` with clear separation between sandbox management, AI processing, and autonomous workflows.
- **O-3 (SHOULD)** Group related API routes in subdirectories (e.g., `autonomous/`, `ai-system/`, `monitoring/`).

---

### 6 — Tooling Gates

- **G-1 (MUST)** `bun run lint` passes.  
- **G-2 (MUST)** TypeScript compilation passes with strict mode.
- **G-3 (SHOULD)** Run relevant test suites before committing (`bun run test:api`, `bun run test:integration`).

---

### 7 - Git

- **GH-1 (MUST)** Use Conventional Commits format when writing commit messages: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT)** Refer to Claude or Anthropic in commit messages.

---

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not, use this checklist:

1. Can you read the function and HONESTLY easily follow what it's doing? If yes, then stop here.
2. Does the function have very high cyclomatic complexity? (number of independent paths, or, in a lot of cases, number of nesting if if-else as a proxy). If it does, then it's probably sketchy.
3. Are there any common data structures and algorithms that would make this function much easier to follow and more robust? Parsers, trees, stacks / queues, etc.
4. Are there any unused parameters in the function?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Is the function easily testable without mocking core features (e.g. E2B sandboxes, Convex queries, AI providers)? If not, can this function be tested as part of an integration test?
7. Does it have any hidden untested dependencies or any values that can be factored out into the arguments instead? Only care about non-trivial dependencies that can actually change or affect the function.
8. Brainstorm 3 better function names and see if the current name is the best, consistent with rest of codebase.

IMPORTANT: you SHOULD NOT refactor out a separate function unless there is a compelling need, such as:
  - the refactored function is used in more than one place
  - the refactored function is easily unit testable while the original function is not AND you can't test it any other way
  - the original function is extremely hard to follow and you resort to putting comments everywhere just to explain it

## Writing Tests Best Practices

When evaluating whether a test you've implemented is good or not, use this checklist:

1. SHOULD parameterize inputs; never embed unexplained literals such as 42 or "foo" directly in the test.
2. SHOULD NOT add a test unless it can fail for a real defect. Trivial asserts (e.g., expect(2).toBe(2)) are forbidden.
3. SHOULD ensure the test description states exactly what the final expect verifies. If the wording and assert don't align, rename or rewrite.
4. SHOULD compare results to independent, pre-computed expectations or to properties of the domain, never to the function's output re-used as the oracle.
5. SHOULD follow the same lint, type-safety, and style rules as prod code (bun lint, strict TypeScript).
6. SHOULD express invariants or axioms (e.g., commutativity, idempotence, round-trip) rather than single hard-coded cases whenever practical. Use property-based testing libraries when appropriate.
7. Unit tests for a function should be grouped under `describe(functionName, () => ...`.
8. MUST NOT use `expect.any(...)` - use proper type assertions or specific matchers instead.
9. ALWAYS use strong assertions over weaker ones e.g. `expect(x).toEqual(1)` instead of `expect(x).toBeGreaterThanOrEqual(1)`.
10. SHOULD test edge cases, realistic input, unexpected input, and value boundaries.
11. SHOULD NOT test conditions that are caught by the TypeScript type checker.
12. SHOULD mock external services (E2B, AI providers, Convex) in unit tests; use real services only in integration tests.

## ZapDev-Specific Code Organization

### API Routes Structure
- `app/api/sandbox/` - E2B sandbox management (create, status, files, commands)
- `app/api/ai-system/` - AI processing and multi-agent coordination  
- `app/api/autonomous/` - Autonomous execution workflows and orchestration
- `app/api/monitoring/` - System monitoring, analytics, and feedback
- `app/api/integrations/` - External service integrations (GitHub, search, scraping)

### Core Libraries
- `lib/sandbox/` - E2B sandbox utilities and file management
- `lib/ai/` - Multi-provider AI client wrappers and streaming utilities
- `lib/autonomous/` - Autonomous pipeline management and coordination
- `lib/monitoring/` - Audit logging, analytics, and error tracking
- `lib/auth/` - Clerk authentication helpers and JWT utilities

### UI Components
- `app/components/ui/` - Shadcn/ui base components
- `app/components/sandbox/` - Sandbox-specific UI components
- `app/components/chat/` - Chat interface and AI interaction components
- `app/components/monitoring/` - Dashboard and monitoring UI

### Convex Schema
- `convex/chats.ts` - Chat history and conversation management
- `convex/users.ts` - User profiles and authentication
- `convex/sandboxes.ts` - Sandbox state and file tracking
- `convex/usage.ts` - Rate limiting and usage analytics

## Remember Shortcuts

Remember the following shortcuts which the user may invoke at any time.

### QNEW

When I type "qnew", this means:

```
Understand all BEST PRACTICES listed in this document.
Your code SHOULD ALWAYS follow these best practices.
Pay special attention to:
- No `any` types allowed - use `unknown`, proper unions, or generics
- Proper E2B sandbox error handling
- Branded types for IDs
- Separation of concerns between sandbox, AI, and autonomous systems
```

### QPLAN
When I type "qplan", this means:
```
Analyze similar parts of the ZapDev codebase and determine whether your plan:
- is consistent with existing API route patterns
- properly handles E2B sandbox lifecycle
- integrates well with Convex real-time updates
- follows established AI provider patterns
- introduces minimal changes
- reuses existing utilities in lib/
```

### QCODE

When I type "qcode", this means:

```
Implement your plan and make sure your new tests pass.
Always run `bun run test:all` or relevant test suites to ensure you didn't break anything.
Always run `bun run lint` on newly created files to ensure standard formatting.
Always ensure TypeScript compilation passes with no `any` types.
Test E2B sandbox integration if applicable.
```

### QCHECK

When I type "qcheck", this means:

```
You are a SKEPTICAL senior software engineer working on ZapDev.
Perform this analysis for every MAJOR code change you introduced (skip minor changes):

1. Writing Functions Best Practices checklist.
2. Writing Tests Best Practices checklist.
3. Implementation Best Practices checklist.
4. ZapDev-specific concerns:
   - Does this properly handle E2B sandbox errors?
   - Are AI provider calls properly typed and error-handled?
   - Does this integrate well with Convex real-time updates?
   - Are branded types used for all IDs?
   - No `any` types present?
```

### QCHECKF

When I type "qcheckf", this means:

```
You are a SKEPTICAL senior software engineer working on ZapDev.
Perform this analysis for every MAJOR function you added or edited (skip minor changes):

1. Writing Functions Best Practices checklist.
2. ZapDev-specific function concerns:
   - Proper error handling for E2B/AI provider failures?
   - Uses branded types for IDs?
   - No `any` types?
   - Follows established patterns for sandbox/AI/autonomous operations?
```

### QCHECKT

When I type "qcheckt", this means:

```
You are a SKEPTICAL senior software engineer working on ZapDev.
Perform this analysis for every MAJOR test you added or edited (skip minor changes):

1. Writing Tests Best Practices checklist.
2. ZapDev-specific test concerns:
   - Properly mocks E2B sandboxes in unit tests?
   - Uses integration tests for real E2B/AI provider interactions?
   - Tests error scenarios for external service failures?
   - No `expect.any()` usage?
```

### QUX

When I type "qux", this means:

```
Imagine you are a human UX tester of the ZapDev feature you implemented. 
Output a comprehensive list of scenarios you would test, sorted by highest priority.
Consider:
- Multi-chat functionality
- Sandbox creation and management
- AI provider switching
- Autonomous execution workflows
- Real-time updates and streaming
- Error states and recovery
- Authentication and rate limiting
```

### QGIT

When I type "qgit", this means:

```
Add all changes to staging, create a commit, and push to remote.

Follow this checklist for writing your commit message:
- MUST use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0
- MUST NOT refer to Claude or Anthropic in the commit message.
- SHOULD structure commit message as follows:
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]

Common types for ZapDev:
- feat: new features (sandbox management, AI integration, autonomous workflows)
- fix: bug fixes
- refactor: code improvements without behavior changes
- test: adding or updating tests
- docs: documentation updates
- chore: maintenance tasks

Common scopes for ZapDev:
- sandbox: E2B sandbox operations
- ai: AI provider integrations
- autonomous: autonomous execution features
- api: API route changes
- ui: frontend/UI components
- convex: database schema or functions
- monitoring: analytics and logging
``` generate and modify React applications in real-time, with autonomous execution capabilities and persistent chat history. 
