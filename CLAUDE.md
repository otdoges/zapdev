0 – Purpose
These rules drive consistency, safety, and fast iteration in ZapDev.
MUST rules are enforced by CI (bun run lint, bun run build:dev).
SHOULD rules you owe us a strong justification for skipping.

1 – Before Coding
BP‑1 (MUST) Ask whoever filed the ticket what “done” looks like. If you skip this you’ll land in endless review comments.

BP‑2 (SHOULD) For any new page or major feature, sketch a component/route tree in a Design Doc (e.g. in plan.md) and get it reviewed.

BP‑3 (SHOULD) If there are two ways to fetch or cache data (tanstack‑query vs raw fetch), list pros and cons in that Design Doc.

Question: do we actually review “plan.md” or does it live only in PR description?

2 – While Coding
C‑1 (MUST) Follow TDD with Vitest: create *.test.tsx or *.test.ts next to the new component or function, write the failing test first, then write the code.

C‑2 (MUST) Name React components and hooks using domain terms. E.g. LandingPage, useZapGeneration.

C‑3 (SHOULD NOT) Spin up a full <Page> component if you just need a small utility—use plain functions in src/lib/.

C‑4 (SHOULD) Prefer simple, composable helpers over one huge component. If bits can be broken out to src/components/featureX/, do it.

C‑5 (MUST) For any IDs (user, project, job), use branded types via Zod or utility Brand<string, “UserId”>. Don’t pass raw strings everywhere.

C‑6 (MUST) Import only types with import type { … } from “…”.

C‑7 (SHOULD NOT) Write comments except when you’re warning about a known framework bug (e.g. React Router v6 edge case). Let class and function names speak.

C‑8 (SHOULD) Default to type for TS definitions; use interface only when extending external types or doing declaration merging.

C‑9 (SHOULD NOT) Pull out a helper into src/lib/ unless it’s used at least twice or it simplifies testing significantly.

Flag: our “public/lovable‑uploads” folder has no code—so rules about colocating tests don’t apply there.

3 – Testing
T‑1 (MUST) Put unit tests in .test.tsx/.test.ts beside their source file in src/.

T‑2 (MUST) Any change to the Convex data model or API in convex/ needs an end‑to‑end integration example (see INTEGRATION_EXAMPLE.md).

T‑3 (MUST) Keep pure‑logic tests (in src/lib/ or src/hooks/) separate from tests that hit Convex or browser APIs.

T‑4 (SHOULD) Favor integration over heavy mocking when verifying data‑fetch flows via TanStack Query.

T‑5 (SHOULD) Thoroughly unit‑test any non‑trivial algorithm or transform in src/lib/.

T‑6 (SHOULD) When comparing arrays or objects, use one assertion on the whole value, not multiple partial checks.

4 – Database / Convex
D‑1 (MUST) Type Convex helpers as ConvexFetch | ConvexTransaction so they accept either the client or a transaction.

D‑2 (SHOULD) If Convex auto‑generated types are off (e.g. JSON vs Date), override them in convex/schema.ts.

Question: are we still using PLpgSQL in database/ or has Convex replaced it? We should remove unused raw‐SQL if not.

5 – Code Organization
O‑1 (MUST) Anything shared by more than one feature lives in src/components/shared/ or src/lib/.

O‑2 (SHOULD) UI primitives (Radix wrappers) go in ui/ only. Don’t scatter generic buttons and dialogs elsewhere.

6 – Tooling Gates
G‑1 (MUST) bun run lint passes (eslint.config.js rules).

G‑2 (MUST) bun run build:dev and bun run build succeed without type errors (tsconfig.json settings).

7 – Git
GH‑1 (MUST) Use Conventional Commits: feat(src/components): add X or fix(convex): correct mutation logic.

GH‑2 (SHOULD NOT) Ever mention Claude, Anthropic, or Lovable in commit messages. Make it all about ZapDev code.

Writing or Refactoring Functions
Use this checklist before you split or rewrite any function:

Read it. Can you actually trace every line in 10 seconds? If yes, leave it.

Is cyclomatic complexity > 5? If yes, seriously consider refactor.

Would a standard data structure (stack, map, tree) simplify it?

Any dead parameters or casts? Remove them.

Can you test it without mocking Convex or DOM? If not, maybe pull it into a helper.

Brainstorm 3 better names. If the current one loses, rename.

Writing Tests
Parameterize inputs with fixtures or fast‑check.

No “expect(2).toBe(2)” traps—tests must catch real defects.

Descriptions must match exactly what the assertion checks.

Compare to pre‑computed expected values, not the function under test.

Keep lint, types, and formatting rules in tests just like prod code.

Cover edge, happy, and error paths. Do not test type errors (TS already did that).

5 Git

I need you to commit everything you do when you are done. 

6 Behavior 

If I say "Good Job" or something along the lines you need to see that you did it well and nice so keep going on that path. 
