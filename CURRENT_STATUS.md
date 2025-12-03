# SoundsGood Software - Client Portal

## Overview & Purpose

**SoundsGood Software** is a client portal/admin hub designed to streamline communication and asset management between you (the developer) and your clients during web development projects.

### Core Strategy
- **Multi-tenant architecture**: One app to manage multiple client projects
- **Client self-service**: Clients can upload photos, view documents, and track project status
- **Project transparency**: Real-time visibility into project progress, milestones, and deliverables
- **Asset management**: Organized photo/document uploads with SEO tagging for website builds

### Current Client: Vetted Trainers
The first client using this portal is **Vetted Trainers**, a personal training business platform project.

---

## Current Features

### ✅ Authentication System
- Email/password login via Better Auth
- Session management with middleware protection
- Role-based access (admin vs client)
- **Dev Tools**: Localhost-only admin mode toggle for testing

### ✅ Dashboard
- Overview of project progress
- Current phase indicator with progress bar
- Photo/document upload counts
- Recent activity feed (real data from DB)
- Quick action links

### ✅ Photo Management
- **Drag & drop uploads** to Cloudflare R2
- **Staged upload flow**: Add multiple files → review → save all at once
- **Category system**: Uncategorized, Trainer, Facility, Event, Marketing, Team, Other
- **SEO tagging system**:
  - Custom tags (comma-separated, add on Enter)
  - Industry-specific suggested tags (personal training focused)
  - Tags become alt-text for accessibility/SEO
- **Notes field** for additional context
- Photo gallery with delete functionality

### ✅ Document Management
- Document uploads to Cloudflare R2
- Document types: Contract, Invoice, Proposal, Report, Other
- Description field for each document
- View/download/delete functionality
- List view with file details

### ✅ Project Status Page
- **Real-time project data** from database
- Overview cards: Progress %, Current Phase, Timeline, Target Launch
- **Interactive timeline** with 8 phases:
  1. Discovery & Planning ✓
  2. Content Collection (in progress)
  3. Foundation & Database
  4. Core Features Development
  5. Working Demo
  6. Admin Dashboard & Polish
  7. Review & Revisions
  8. Launch & Deployment
- **Expandable deliverables checklist** per phase
- **Admin-only editing**: Toggle deliverable completion (localhost dev mode)
- Action items / client tasks
- Key dates with deadlines
- Milestone badges

### ✅ Dev Admin Bar
- Orange banner at top (localhost only)
- Toggle admin mode to edit deliverables
- Persists via cookie for session

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Auth | Better Auth |
| Database | Neon PostgreSQL + Drizzle ORM |
| File Storage | Cloudflare R2 |
| Styling | Tailwind CSS + shadcn/ui |
| Monorepo | Turborepo + pnpm |
| Deployment | Vercel (target) |

### Project Structure
```
soundsgoodsoftware/
├── apps/
│   └── web/                    # Next.js application
│       └── src/
│           ├── app/
│           │   ├── (auth)/     # Login page
│           │   ├── (portal)/   # Protected pages
│           │   │   ├── dashboard/
│           │   │   ├── photos/
│           │   │   ├── documents/
│           │   │   └── project-status/
│           │   └── api/        # API routes
│           ├── lib/            # R2 utilities
│           └── middleware.ts   # Auth protection
├── packages/
│   ├── auth/                   # Better Auth config
│   ├── db/                     # Drizzle schema & client
│   └── ui/                     # Shared UI components
└── scripts/                    # Seed scripts
```

---

## Database Schema

### Core Tables
- `users` - User accounts with roles
- `organizations` - Client organizations
- `photos` - Photo metadata (fileUrl, category, tags, notes)
- `documents` - Document metadata

### Project Management Tables (NEW)
- `projects` - Project info, timeline, status
- `project_phases` - Timeline phases with deliverables
- `project_tasks` - Action items for clients
- `project_deadlines` - Key dates

---

## Environment Variables Required

For Vercel deployment, you'll need:

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=https://your-domain.vercel.app

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-r2-public-url
```

---

## Deployment Checklist for Vercel

### Pre-deployment
- [ ] Ensure all env vars are set in Vercel dashboard
- [ ] Update `BETTER_AUTH_URL` to production domain
- [ ] Configure R2 CORS for production domain
- [ ] Run database migrations on production DB

### Vercel Settings
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `pnpm build` (or use Turborepo)
- **Install Command**: `pnpm install`

### Post-deployment
- [ ] Create admin user on production
- [ ] Create client user for Vetted Trainers
- [ ] Seed project data (or create manually)
- [ ] Test login flow
- [ ] Test photo/document uploads

---

## Known Issues / TODOs

### Authentication
- [ ] Login sometimes returns 400 - may need to recreate users
- [ ] Password reset flow not implemented
- [ ] No email verification

### Photo Management
- [ ] No image optimization/resizing
- [ ] No bulk delete
- [ ] No photo editing (crop, rotate)

### Document Management
- [ ] No document preview (PDF viewer)
- [ ] No version history

### Project Status
- [ ] Phase click → detailed view (planned for future)
- [ ] Task completion by client (read-only currently)
- [ ] Email notifications for deadlines

### General
- [ ] Mobile navigation drawer not functional
- [ ] No dark mode
- [ ] No settings page (hidden)
- [ ] No notifications system

---

## Future Enhancements (Roadmap)

### Phase 1: Polish for Demo
- Fix any login issues
- Ensure all uploads work on production
- Test with real client data

### Phase 2: Client Features
- Client task completion
- Comments on deliverables
- Email notifications

### Phase 3: Admin Features
- Admin dashboard for managing all clients
- Project creation wizard
- Billing/invoice integration

### Phase 4: Automation
- Integration with project management tools (Linear, Notion)
- Automated status updates
- Webhook support

---

## Quick Commands

```bash
# Development
pnpm dev --filter @soundsgood/web

# Database
cd packages/db
pnpm dotenv -e ../../apps/web/.env.local -- drizzle-kit push
pnpm dotenv -e ../../apps/web/.env.local -- drizzle-kit studio

# Seed data
pnpm dotenv -e apps/web/.env.local -- npx tsx scripts/seed-vt-project.ts

# Build
pnpm build --filter @soundsgood/web
```

---

## Notes for Client Demo

### Demo Flow
1. **Login** as client (client@vettedtrainers.com)
2. **Dashboard** - Show project progress overview
3. **Project Status** - Walk through timeline, explain phases
4. **Photos** - Demo upload flow with tagging
5. **Documents** - Show how they can access contracts/docs

### Key Talking Points
- "This is your hub for the entire project"
- "You can upload photos here and we'll use them for your website"
- "Tags help with SEO - your photos will rank better in Google"
- "Track progress in real-time - see exactly where we are"
- "Action items show what we need from you"

---

*Last updated: December 2024*

