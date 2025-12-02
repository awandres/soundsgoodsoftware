# SoundsGood Software – Technical Architecture

## Tech Stack Overview

This project uses the **Better T Stack** as its foundation, optimized for a monorepo structure.

### Core Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Monorepo** | Turborepo + pnpm | Workspace management, caching, parallel builds |
| **Framework** | Next.js 14+ (App Router) | Full-stack React framework |
| **Language** | TypeScript (strict) | Type safety across the entire stack |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with accessible components |
| **API** | tRPC | End-to-end type-safe APIs |
| **Auth** | Better Auth | Modern authentication library |
| **Database** | Neon Postgres + Drizzle ORM | Serverless Postgres with type-safe ORM |
| **File Storage** | Cloudflare R2 or AWS S3 | Document and media storage |
| **Email** | Resend | Transactional emails |
| **Deployment** | Vercel | Serverless deployment platform |

---

## Monorepo Structure

```
soundsgoodsoftware/
├── apps/
│   ├── web/                    # Main platform (admin + client portal)
│   ├── marketing/              # Public website and portfolio
│   └── clients/
│       ├── ritchie-royale/     # Example client app
│       ├── client-two/         
│       └── client-three/       
│
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/     # Button, Card, Modal, etc.
│   │   │   ├── primitives/     # Base shadcn/ui primitives
│   │   │   └── layouts/        # Common layout patterns
│   │   └── package.json
│   │
│   ├── db/                     # Database package
│   │   ├── src/
│   │   │   ├── schema/         # Drizzle schema definitions
│   │   │   ├── migrations/     # Database migrations
│   │   │   └── client.ts       # Database client
│   │   └── package.json
│   │
│   ├── auth/                   # Authentication utilities
│   │   ├── src/
│   │   │   ├── config.ts       # Better Auth configuration
│   │   │   ├── middleware.ts   # Auth middleware
│   │   │   └── hooks.ts        # useSession, useUser, etc.
│   │   └── package.json
│   │
│   ├── cms-core/               # CMS engine
│   │   ├── src/
│   │   │   ├── models/         # Content type definitions
│   │   │   ├── api/            # Content CRUD operations
│   │   │   └── editor/         # Editor components
│   │   └── package.json
│   │
│   ├── email/                  # Email templates and sending
│   │   ├── src/
│   │   │   ├── templates/      # React Email templates
│   │   │   └── send.ts         # Email sending utilities
│   │   └── package.json
│   │
│   └── config/                 # Shared configurations
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── tooling/
│   └── generators/             # App scaffolding tools
│
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
├── package.json                # Root package.json
└── .env.example                # Environment variables template
```

---

## Database Architecture

### Multi-Tenancy Strategy

We'll use a **single database with tenant isolation** approach:

```
┌────────────────────────────────────────────────────────────────┐
│                        Neon Postgres                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Platform Tables (shared)                                      │
│  ├── users                                                     │
│  ├── organizations (clients)                                   │
│  ├── projects                                                  │
│  ├── documents                                                 │
│  └── ...                                                       │
│                                                                │
│  Content Tables (per-client isolation via org_id)              │
│  ├── content_types                                             │
│  ├── content_entries                                           │
│  ├── media                                                     │
│  └── ...                                                       │
│                                                                │
│  Client App Tables (separate schemas or prefixed)              │
│  ├── client_ritchie_royale_*                                   │
│  ├── client_two_*                                              │
│  └── ...                                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Core Schema (Simplified)

```typescript
// packages/db/src/schema/users.ts
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role', { enum: ['admin', 'staff', 'client'] }).default('client'),
  organizationId: text('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// packages/db/src/schema/organizations.ts
export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: text('status', { enum: ['lead', 'active', 'paused', 'completed'] }).default('lead'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow(),
});

// packages/db/src/schema/projects.ts
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { enum: ['planning', 'in_progress', 'review', 'completed'] }),
  startDate: timestamp('start_date'),
  targetDate: timestamp('target_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// packages/db/src/schema/documents.ts
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id),
  projectId: text('project_id').references(() => projects.id),
  name: text('name').notNull(),
  type: text('type', { enum: ['contract', 'roadmap', 'invoice', 'proposal', 'other'] }),
  fileUrl: text('file_url').notNull(),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     Authentication System                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Admin Flow                    Client Flow                       │
│  ──────────                    ───────────                       │
│  Email/Password ──►            Invitation Email ──►              │
│       │                              │                           │
│       ▼                              ▼                           │
│  Better Auth ◄────────────────► Magic Link / Password            │
│       │                              │                           │
│       ▼                              ▼                           │
│  Admin Dashboard               Client Portal                     │
│  (full access)                 (scoped to their org)             │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Session Storage: Secure HTTP-only cookies                       │
│  Token Strategy: JWT with refresh tokens                         │
│  MFA: Optional, enabled per-account                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## API Architecture

### tRPC Router Structure

```typescript
// apps/web/src/server/routers/_app.ts
export const appRouter = router({
  // Admin routes
  admin: router({
    clients: clientsRouter,      // CRUD for organizations
    projects: projectsRouter,    // Project management
    documents: documentsRouter,  // Document management
    analytics: analyticsRouter,  // Dashboard metrics
  }),
  
  // Client portal routes
  portal: router({
    profile: profileRouter,      // Client profile management
    projects: clientProjectsRouter, // View their projects
    documents: clientDocumentsRouter, // Access their documents
    content: contentRouter,      // CMS operations
    messages: messagesRouter,    // Communication
  }),
  
  // Public routes
  public: router({
    contact: contactRouter,      // Contact form
    portfolio: portfolioRouter,  // Public case studies
  }),
});
```

---

## CMS Architecture

### Content Model System

```typescript
// packages/cms-core/src/models/types.ts
interface ContentType {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  fields: ContentField[];
  settings: {
    singleton: boolean;  // Single entry or collection
    publishable: boolean;
    versionable: boolean;
  };
}

interface ContentField {
  id: string;
  name: string;
  slug: string;
  type: 'text' | 'richtext' | 'number' | 'boolean' | 'date' | 'media' | 'relation' | 'json';
  required: boolean;
  validation?: ValidationRule[];
  settings?: Record<string, any>;
}

interface ContentEntry {
  id: string;
  contentTypeId: string;
  organizationId: string;
  data: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  version: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Content API

Each client app can fetch content via:

```typescript
// In a client app
import { createCMSClient } from '@soundsgood/cms-core';

const cms = createCMSClient({
  organizationId: 'ritchie-royale',
  apiKey: process.env.CMS_API_KEY,
});

// Fetch published content
const shows = await cms.collection('shows').find({ status: 'published' });
const siteSettings = await cms.singleton('site-settings').get();
```

---

## Deployment Strategy

### Environment Structure

```
Production
├── web.soundsgoodsoftware.com        # Main platform
├── soundsgoodsoftware.com            # Marketing site
└── [client].soundsgoodsoftware.com   # Client app previews

Client Deployments (when shipped)
├── ritchieroyale.com                 # Client's own domain
├── clienttwo.com
└── ...
```

### Vercel Configuration

```json
// vercel.json (root)
{
  "buildCommand": "turbo build --filter=web",
  "framework": "nextjs"
}
```

Each app can be deployed independently or together via Turborepo's filtering.

---

## Security Considerations

1. **Row-Level Security (RLS)** – Postgres policies ensure clients only access their data
2. **API Authentication** – All tRPC routes protected by Better Auth middleware
3. **Input Validation** – Zod schemas for all API inputs
4. **File Uploads** – Signed URLs, file type validation, size limits
5. **Rate Limiting** – Protect against abuse
6. **Audit Logging** – Track sensitive operations

---

## Performance Optimizations

1. **Turborepo Caching** – Shared computation across builds
2. **Database Connection Pooling** – Neon's serverless driver
3. **Edge Caching** – Vercel Edge for static content
4. **Image Optimization** – Next.js Image component
5. **Code Splitting** – Automatic with Next.js App Router
6. **Incremental Static Regeneration** – For portfolio pages

---

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start all apps in development
pnpm dev

# Start specific app
pnpm dev --filter=web

# Build all
pnpm build

# Run tests
pnpm test

# Generate new client app
pnpm generate:app --name="new-client"

# Database operations
pnpm db:push      # Push schema changes
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

---

## Next Steps

See [ROADMAP.md](./ROADMAP.md) for the implementation timeline.

