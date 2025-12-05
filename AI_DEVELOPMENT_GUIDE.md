# AI-Assisted Development Guide

> A playbook for AI agents working on SoundsGood Software. Follow these conventions to enable coordinated, parallel development.

---

## 🎯 Purpose

This document enables **multiple AI agents** to work on this project simultaneously without conflicts. It defines:

1. How to chunk work into independent units
2. Clear module boundaries and ownership
3. Conventions all agents must follow
4. Context files to read before starting
5. Integration and handoff patterns

---

## 📖 Required Reading (For Every Agent)

Before working on ANY task, read these files in order:

```
1. README.md           → Project overview and vision
2. ARCHITECTURE.md     → Technical stack and structure
3. MVP.md              → Current phase and priorities
4. This file           → Development conventions
5. [Relevant module]   → Package-specific README
```

**Time investment:** ~10 minutes of context = hours of aligned work

---

## 🧩 Module Decomposition

The project is designed as independent packages that can be developed in parallel.

### Package Dependency Graph

```
                    ┌─────────────────────────────────────────┐
                    │              apps/web                    │
                    │         (Main Application)               │
                    └─────────────────┬───────────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
    ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
    │ packages/ui │           │ packages/db │           │packages/auth│
    │             │           │             │           │             │
    │ Components  │           │   Schema    │           │  Auth Utils │
    │ Primitives  │           │   Queries   │           │  Middleware │
    └─────────────┘           └─────────────┘           └─────────────┘
           │                          │                          │
           └──────────────────────────┼──────────────────────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │packages/    │
                              │  config     │
                              │             │
                              │ TS, ESLint  │
                              │ Tailwind    │
                              └─────────────┘
```

### Independence Rules

| Package | Can be developed independently? | Dependencies |
|---------|--------------------------------|--------------|
| `packages/config` | ✅ Yes (start here) | None |
| `packages/ui` | ✅ Yes | config |
| `packages/db` | ✅ Yes | config |
| `packages/auth` | ⚠️ Mostly | config, db |
| `apps/web` | ⚠️ After packages | All packages |

---

## 👥 Parallel Work Streams

### How to Split Work Across Agents

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PARALLEL WORK STREAMS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Stream A              Stream B              Stream C               │
│  (Agent 1)             (Agent 2)             (Agent 3)              │
│  ──────────            ──────────            ──────────             │
│                                                                     │
│  packages/ui           packages/db           packages/auth          │
│  ├── Button            ├── schema/           ├── config.ts          │
│  ├── Card              │   ├── users         ├── middleware.ts      │
│  ├── Input             │   ├── orgs          └── hooks.ts           │
│  ├── Modal             │   ├── documents                            │
│  └── ...               │   └── photos                               │
│                        └── queries/                                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Stream D              Stream E              Stream F               │
│  (Agent 4)             (Agent 5)             (Agent 6)              │
│  ──────────            ──────────            ──────────             │
│                                                                     │
│  apps/web              apps/web              apps/web               │
│  └── (auth)/           └── (portal)/         └── (portal)/          │
│      ├── login             dashboard/            photos/            │
│      ├── register          └── page.tsx          ├── page.tsx       │
│      └── forgot                                  └── upload.tsx     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Stream Ownership Rules

1. **One agent per stream** – Don't have two agents in the same directory
2. **Claim before starting** – Add a `// @agent: working` comment at file top
3. **Complete before handoff** – Finish your stream before dependencies use it
4. **Export interfaces first** – Define types/exports early so dependents can code against them

---

## 📋 Task Chunking Strategy

### Good Task Chunks (Can be parallelized)

```
✅ "Build the Button, Card, and Input components in packages/ui"
✅ "Create the database schema for users and organizations"
✅ "Build the login page UI (no auth logic yet)"
✅ "Create the photo upload API endpoint"
✅ "Build the document list component"
```

### Bad Task Chunks (Too coupled)

```
❌ "Build the login flow end-to-end" (spans auth, db, ui, app)
❌ "Create the dashboard" (vague, touches everything)
❌ "Fix bugs" (no clear scope)
```

### Task Size Guidelines

| Size | Lines of Code | Time Estimate | Example |
|------|---------------|---------------|---------|
| Small | 50-150 | 15-30 min | Single component, single API route |
| Medium | 150-400 | 30-60 min | Feature slice, multiple related components |
| Large | 400+ | 60+ min | Full module, should be split |

**Ideal:** Medium tasks that can be completed in one session

---

## 🔧 Conventions All Agents Must Follow

### File Naming

```
components/           → PascalCase.tsx (Button.tsx)
hooks/               → camelCase.ts (useAuth.ts)
utils/               → camelCase.ts (formatDate.ts)
routes/pages/        → lowercase with dashes (photo-upload/)
types/               → PascalCase.ts (User.ts)
```

### Code Style

```typescript
// ✅ DO: Export types explicitly
export interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

// ✅ DO: Use function declarations for components
export function Button({ variant, children }: ButtonProps) {
  return <button className={cn(baseStyles, variants[variant])}>{children}</button>;
}

// ❌ DON'T: Use default exports (harder to refactor)
export default function Button() {}

// ❌ DON'T: Use any type
function handleClick(data: any) {}
```

### Import Order

```typescript
// 1. External packages
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal packages (monorepo)
import { Button } from '@soundsgood/ui';
import { db } from '@soundsgood/db';

// 3. Relative imports (same package)
import { formatDate } from '../utils/date';
import { useAuth } from '../hooks/useAuth';

// 4. Types (if separate)
import type { User } from '../types';
```

### Component Structure

```typescript
// 1. Imports
import { useState } from 'react';

// 2. Types/Interfaces
interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (id: string) => void;
}

// 3. Component
export function PhotoGallery({ photos, onDelete }: PhotoGalleryProps) {
  // 3a. Hooks first
  const [selected, setSelected] = useState<string | null>(null);
  
  // 3b. Derived state
  const hasPhotos = photos.length > 0;
  
  // 3c. Handlers
  const handleSelect = (id: string) => {
    setSelected(id);
  };
  
  // 3d. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Database Queries

```typescript
// ✅ DO: Create reusable query functions in packages/db
// packages/db/src/queries/photos.ts
export async function getPhotosByOrg(orgId: string) {
  return db.select().from(photos).where(eq(photos.organizationId, orgId));
}

// ✅ DO: Use in app via import
// apps/web/src/server/routers/photos.ts
import { getPhotosByOrg } from '@soundsgood/db/queries';
```

### API Routes (tRPC)

```typescript
// Consistent router structure
export const photosRouter = router({
  // List
  list: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return getPhotosByOrg(input.orgId);
    }),
  
  // Create
  create: protectedProcedure
    .input(createPhotoSchema)
    .mutation(async ({ input }) => {
      return createPhoto(input);
    }),
  
  // Delete
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deletePhoto(input.id);
    }),
});
```

---

## 🤝 Handoff Protocol

When completing work that another agent will build upon:

### 1. Document Your Exports

```typescript
// packages/ui/src/index.ts
// @status: complete
// @exports: Button, Card, Input, Modal, Spinner, Toast
// @usage: import { Button } from '@soundsgood/ui'

export { Button } from './components/Button';
export { Card } from './components/Card';
// ...
```

### 2. Write Interface Contracts

```typescript
// packages/db/src/types.ts
// @status: complete
// @consumers: apps/web, packages/auth

export interface User {
  id: string;
  email: string;
  name: string | null;
  organizationId: string;
  role: 'admin' | 'client';
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: 'lead' | 'active' | 'paused' | 'completed';
}
```

### 3. Add Status Comments

```typescript
// @agent: completed
// @ready-for: integration
// @tested: unit tests passing
// @notes: Uses R2 for storage, see env vars needed
```

---

## 📁 Stub Files for Parallel Development

When you need something that another agent is building, create a stub:

```typescript
// packages/auth/src/hooks/useAuth.ts
// @status: stub
// @owner: Agent handling auth
// @expected-by: 2024-12-01

export function useAuth() {
  // TODO: Implement actual auth hook
  // Expected interface:
  return {
    user: null as User | null,
    isLoading: false,
    signIn: async (email: string, password: string) => {},
    signOut: async () => {},
  };
}
```

This lets dependents code against the interface while implementation is in progress.

---

## 🧪 Testing Expectations

### Unit Tests (Per Agent)

Each agent is responsible for testing their work:

```
packages/ui/       → Component tests with Vitest + Testing Library
packages/db/       → Schema validation, query tests
packages/auth/     → Auth flow tests
apps/web/          → Integration tests for routes
```

### Test File Location

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx    ← Co-located
```

### Minimum Test Coverage

| Type | Requirement |
|------|-------------|
| Components | Renders without crashing, key interactions |
| API Routes | Happy path + error cases |
| Database | Schema validation |
| Utils | Pure functions fully tested |

---

## 🚨 Conflict Avoidance

### Files That Should NOT Be Edited in Parallel

```
⚠️  package.json (root)        → Coordinate dependency changes
⚠️  turbo.json                  → Single owner
⚠️  tsconfig.json (root)        → Single owner
⚠️  tailwind.config.ts          → Single owner for theme
⚠️  .env.example                → Coordinate env var additions
```

### Safe for Parallel Editing

```
✅  Any file in packages/ui/src/components/
✅  Any file in packages/db/src/schema/
✅  Any route in apps/web/src/app/
✅  Individual test files
```

### Conflict Resolution

If you encounter a conflict:
1. **Stop** – Don't force merge
2. **Check status comments** – See who owns the file
3. **Coordinate** – If same file, one agent takes over
4. **Rebase** – Pull latest, reapply your changes

---

## 📊 Progress Tracking

### Status Board (Update in PROGRESS.md)

```markdown
## Current Sprint

| Task | Agent | Status | Notes |
|------|-------|--------|-------|
| UI Components | Agent 1 | ✅ Complete | Ready for use |
| DB Schema | Agent 2 | 🔄 In Progress | 80% done |
| Auth Setup | Agent 3 | ⏳ Waiting | Needs DB schema |
| Login Page | Agent 4 | 🔄 In Progress | Using stubs |
```

### Status Labels

- ⏳ **Waiting** – Blocked on dependency
- 🔄 **In Progress** – Actively being worked on
- ✅ **Complete** – Done and tested
- 🔀 **In Review** – Needs verification
- ❌ **Blocked** – Has issues to resolve

---

## 🎯 MVP Task Breakdown for Agents

### Recommended Agent Assignments

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MVP PARALLEL EXECUTION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE 0: Foundation (Can start simultaneously)                     │
│  ─────────────────────────────────────────────                      │
│  Agent A: Initialize monorepo, configs, turbo.json                  │
│  Agent B: Set up packages/ui with shadcn components                 │
│  Agent C: Set up packages/db with Drizzle schema                    │
│  Agent D: Set up packages/auth with Better Auth                     │
│                                                                     │
│  PHASE 1: Core Features (After Phase 0)                             │
│  ──────────────────────────────────────                             │
│  Agent A: Login/Register pages (UI only, use auth stubs)            │
│  Agent B: Dashboard layout and navigation                           │
│  Agent C: Photo upload component + API                              │
│  Agent D: Document viewer component + API                           │
│                                                                     │
│  PHASE 2: Integration (After Phase 1)                               │
│  ────────────────────────────────────                               │
│  Agent A: Wire up auth to login pages                               │
│  Agent B: Connect dashboard to real data                            │
│  Agent C: Test full photo upload flow                               │
│  Agent D: Test full document flow                                   │
│                                                                     │
│  PHASE 3: Polish (All agents)                                       │
│  ─────────────────────────                                          │
│  All: Error handling, loading states, edge cases                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Task Templates

### Starting a New Task

```markdown
## Task: [Name]

**Agent:** [Your identifier]
**Started:** [Date/Time]
**Status:** 🔄 In Progress

### Scope
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

### Dependencies
- Requires: [list packages/files needed]
- Blocks: [list what depends on this]

### Files Modified
- `path/to/file1.ts`
- `path/to/file2.ts`

### Notes
[Any context for future agents]
```

### Completing a Task

```markdown
## Task: [Name] ✅

**Completed:** [Date/Time]

### What Was Built
- Description of work done

### How to Use
```typescript
// Usage example
```

### Environment Variables Added
- `NEW_VAR` - Description

### Known Limitations
- Limitation 1
- Limitation 2

### Follow-Up Tasks
- [ ] Future improvement 1
- [ ] Future improvement 2
```

---

## 🔑 Key Principles

1. **Read before writing** – Understand context first
2. **Small, focused changes** – Easier to review and less conflict
3. **Export early** – Define interfaces before implementation
4. **Test your work** – Don't hand off broken code
5. **Document handoffs** – Next agent should understand immediately
6. **Communicate blockers** – Update status if waiting on something
7. **Don't touch shared files** – Unless you're the designated owner
8. **Prefer composition** – Build small pieces that combine

---

## 🆘 Troubleshooting

### "I need something another agent is building"
→ Create a stub with the expected interface, continue work

### "My code conflicts with another agent's changes"
→ Stop, check ownership, coordinate, one agent resolves

### "I'm not sure what conventions to use"
→ Look at existing code in the same package, follow patterns

### "The task is too big"
→ Break it into smaller chunks, update task board

### "I found a bug in another agent's code"
→ Document it clearly, don't fix unless you own that module

---

**Remember:** The goal is coordinated, parallel progress. When in doubt, leave clear documentation for the next agent.

---

## 📝 Prompt Templates for Spawning Agents

Use these templates when kicking off work with AI agents:

### Foundation Setup Agent

```
You are working on SoundsGood Software, a client management platform.

FIRST: Read these files in order:
1. /soundsgoodsoftware/README.md
2. /soundsgoodsoftware/ARCHITECTURE.md
3. /soundsgoodsoftware/AI_DEVELOPMENT_GUIDE.md

YOUR TASK: Initialize the Turborepo monorepo structure

Requirements:
- Use pnpm workspaces
- Create packages/config with shared TypeScript, ESLint, Tailwind configs
- Create empty package scaffolds for: ui, db, auth
- Set up turbo.json with proper task pipelines
- Add root package.json scripts

When complete:
- Update PROGRESS.md with your changes
- Add status comments to key files
- List any environment variables needed
```

### UI Components Agent

```
You are working on SoundsGood Software, a client management platform.

FIRST: Read these files in order:
1. /soundsgoodsoftware/README.md
2. /soundsgoodsoftware/AI_DEVELOPMENT_GUIDE.md
3. /soundsgoodsoftware/packages/ui/README.md (if exists)

YOUR TASK: Build the shared UI components in packages/ui

Requirements:
- Use shadcn/ui as the base
- Create these components: Button, Card, Input, Label, Modal, Spinner, Toast
- Follow the component structure conventions in AI_DEVELOPMENT_GUIDE.md
- Export all components from packages/ui/src/index.ts
- Include TypeScript types for all props

When complete:
- Update PROGRESS.md
- Add @status: complete comment to index.ts
- Document any usage examples
```

### Database Agent

```
You are working on SoundsGood Software, a client management platform.

FIRST: Read these files in order:
1. /soundsgoodsoftware/README.md
2. /soundsgoodsoftware/ARCHITECTURE.md (database section)
3. /soundsgoodsoftware/MVP.md (schema section)
4. /soundsgoodsoftware/AI_DEVELOPMENT_GUIDE.md

YOUR TASK: Set up packages/db with Drizzle ORM

Requirements:
- Configure Drizzle for Neon Postgres
- Create schema files: users, organizations, documents, photos
- Create query helper functions for common operations
- Export types for all tables
- Add migration scripts

When complete:
- Update PROGRESS.md
- Document environment variables needed
- Add example queries in comments
```

### Feature Page Agent

```
You are working on SoundsGood Software, a client management platform.

FIRST: Read these files in order:
1. /soundsgoodsoftware/README.md
2. /soundsgoodsoftware/MVP.md
3. /soundsgoodsoftware/AI_DEVELOPMENT_GUIDE.md
4. /soundsgoodsoftware/apps/web/README.md (if exists)

YOUR TASK: Build the [FEATURE] page in apps/web

Requirements:
- Create route at apps/web/src/app/(portal)/[feature]/page.tsx
- Use components from @soundsgood/ui
- Follow the file structure conventions
- Add loading and error states
- Make it mobile responsive

Dependencies you can assume exist (use stubs if not):
- @soundsgood/ui components
- @soundsgood/db queries
- @soundsgood/auth hooks

When complete:
- Update PROGRESS.md
- Add status comment to page file
- List any new dependencies added
```

### Integration Agent

```
You are working on SoundsGood Software, a client management platform.

FIRST: Read these files in order:
1. /soundsgoodsoftware/README.md
2. /soundsgoodsoftware/PROGRESS.md (check what's complete)
3. /soundsgoodsoftware/AI_DEVELOPMENT_GUIDE.md

YOUR TASK: Integrate completed packages and test the full flow

Requirements:
- Connect [Feature A] to [Feature B]
- Replace any stubs with real implementations
- Test the happy path end-to-end
- Add error handling for edge cases
- Verify all environment variables are documented

When complete:
- Update PROGRESS.md with integration status
- Document any issues found
- List manual testing steps performed
```

### Bug Fix Agent

```
You are working on SoundsGood Software, a client management platform.

FIRST: Read these files in order:
1. /soundsgoodsoftware/AI_DEVELOPMENT_GUIDE.md
2. /soundsgoodsoftware/PROGRESS.md (check recent changes)

BUG REPORT:
[Describe the bug]

Expected behavior:
[What should happen]

Actual behavior:
[What's happening]

YOUR TASK: Investigate and fix this bug

Requirements:
- Identify the root cause
- Make the minimal change needed to fix it
- Don't refactor unrelated code
- Add a test if applicable

When complete:
- Document what caused the bug
- Document what you changed
- Update PROGRESS.md
```

---

## 🔄 Agent Handoff Checklist

Before finishing your session, ensure:

- [ ] All files saved and properly formatted
- [ ] Status comments added to key files (`@status: complete`)
- [ ] PROGRESS.md updated with your changes
- [ ] Any new environment variables documented
- [ ] No linting errors introduced
- [ ] Tests passing (if applicable)
- [ ] Clear notes for next agent

---

## 👤 User Preferences

These are specific preferences from the project owner that all AI agents should follow:

### UX Testing
- **Do NOT demo the UX in the browser** - The user prefers to test the UX themselves
- When features are complete, simply let the user know it's ready for testing
- Provide a summary of what was built and how to test it

### Feature Completion
When completing a feature:
1. Summarize what was built
2. List any new credentials, URLs, or environment variables
3. Note any manual steps needed (like running migrations or restarting the server)
4. Let the user know it's ready for them to test

---

## 💬 Communication Patterns

### Leaving Notes for Other Agents

```typescript
// @agent-note: This component expects the auth context to be set up.
// If you're seeing null user errors, check that AuthProvider wraps the app.

// @todo: Once packages/db is complete, replace this mock data
const MOCK_PHOTOS = [...];

// @decision: Using R2 instead of S3 for cost reasons. See ARCHITECTURE.md.

// @blocked: Waiting on auth package to implement protected routes
```

### Requesting Help

If stuck, leave a clear note:

```typescript
// @help-needed: Can't figure out how to handle file upload progress
// with the current R2 signed URL approach. Options considered:
// 1. Chunked upload - complex
// 2. Progress polling - extra API calls
// 3. Optimistic UI - poor UX
// 
// Recommendation: [Your suggestion]
// 
// @blocker-for: Photo upload feature
```

