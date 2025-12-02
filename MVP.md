# MVP: Vetted Trainers Portal

> **Goal:** Get a working client portal for Vetted Trainers where they can log in, upload photos, and view their documents.

## Target Client

**Vetted Trainers** – First client to use the SoundsGood Software portal

---

## MVP Scope

### ✅ In Scope (Must Have)

| Feature | Description |
|---------|-------------|
| **Client Login** | Secure authentication for Vetted Trainers team |
| **Photo Upload** | Upload trainer photos, facility images, etc. |
| **Document Viewing** | View contracts, roadmaps, and other documents you share |
| **Simple Dashboard** | Welcome screen with quick access to key features |

### 🚫 Out of Scope (Later)

- Full admin dashboard (use direct DB/Drizzle Studio for now)
- Ticket system (Phase 2)
- Brand info form (Phase 2)
- CMS functionality
- Multiple clients
- Project tracking views
- Public portfolio

---

## Technical MVP Stack

```
soundsgoodsoftware/
├── apps/
│   └── web/                      # Single Next.js app for MVP
│       ├── app/
│       │   ├── (auth)/           # Login, forgot password
│       │   ├── (portal)/         # Client portal (protected)
│       │   │   ├── dashboard/    # Main dashboard
│       │   │   ├── photos/       # Photo upload & gallery
│       │   │   └── documents/    # Document viewer
│       │   └── api/              # tRPC routes
│       └── ...
│
├── packages/
│   ├── db/                       # Drizzle schema
│   └── ui/                       # Shared components (minimal)
│
└── ...
```

---

## Database Schema (MVP)

```typescript
// Minimal schema for MVP

// Users (clients who can log in)
users = {
  id: string,
  email: string,
  name: string,
  passwordHash: string,
  organizationId: string,  // Links to Vetted Trainers
  createdAt: timestamp,
}

// Organizations (just Vetted Trainers for now)
organizations = {
  id: string,
  name: string,           // "Vetted Trainers"
  slug: string,           // "vetted-trainers"
  createdAt: timestamp,
}

// Documents (files you share with client)
documents = {
  id: string,
  organizationId: string,
  name: string,
  type: enum('contract', 'roadmap', 'invoice', 'proposal', 'other'),
  fileUrl: string,        // S3/R2 URL
  uploadedBy: string,     // Admin user ID
  createdAt: timestamp,
}

// Photos (files client uploads)
photos = {
  id: string,
  organizationId: string,
  uploadedBy: string,     // Client user ID
  fileName: string,
  fileUrl: string,        // S3/R2 URL
  fileSize: number,
  mimeType: string,
  category: enum('trainer', 'facility', 'event', 'marketing', 'other'),
  altText: string?,       // Optional description
  createdAt: timestamp,
}
```

---

## User Flows

### Flow 1: Client Login

```
┌─────────────────────────────────────────────────────┐
│                    Login Page                        │
│  ┌───────────────────────────────────────────────┐  │
│  │  Email: [________________________]            │  │
│  │  Password: [________________________]         │  │
│  │                                               │  │
│  │  [       Sign In       ]                      │  │
│  │                                               │  │
│  │  Forgot password?                             │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                   Dashboard                          │
│  Welcome back, [Name]!                              │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐                  │
│  │   📷        │  │   📄        │                  │
│  │   Photos    │  │  Documents  │                  │
│  │   12 files  │  │   3 files   │                  │
│  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────┘
```

### Flow 2: Upload Photos

```
┌─────────────────────────────────────────────────────┐
│                   Photos                             │
│  ┌───────────────────────────────────────────────┐  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │                                         │  │  │
│  │  │     📷 Drag & drop photos here          │  │  │
│  │  │        or click to browse               │  │  │
│  │  │                                         │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  Category: [ Trainer Photos      ▼ ]          │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Your Photos                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ 🖼️  │ │ 🖼️  │ │ 🖼️  │ │ 🖼️  │              │
│  │      │ │      │ │      │ │      │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
└─────────────────────────────────────────────────────┘
```

### Flow 3: View Documents

```
┌─────────────────────────────────────────────────────┐
│                  Documents                           │
│                                                     │
│  📄 Project Roadmap                                 │
│     Added Dec 1, 2024 • PDF                         │
│     [ View ] [ Download ]                           │
│                                                     │
│  📄 Service Agreement                               │
│     Added Nov 15, 2024 • PDF                        │
│     [ View ] [ Download ]                           │
│                                                     │
│  📄 Brand Guidelines                                │
│     Added Nov 10, 2024 • PDF                        │
│     [ View ] [ Download ]                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## MVP Tasks Checklist

### Phase 0: Setup (Day 1-2)
- [ ] Initialize Turborepo with pnpm
- [ ] Set up Next.js 14 app with App Router
- [ ] Configure TypeScript (strict)
- [ ] Set up Tailwind CSS + shadcn/ui
- [ ] Set up Drizzle ORM
- [ ] Create Neon Postgres database
- [ ] Configure Better Auth
- [ ] Set up Cloudflare R2 for file storage
- [ ] Deploy to Vercel (empty shell)

### Phase 1: Authentication (Day 3-4)
- [ ] Create MVP database schema
- [ ] Run migrations
- [ ] Build login page UI
- [ ] Implement Better Auth login flow
- [ ] Build forgot password flow
- [ ] Create session middleware
- [ ] Seed Vetted Trainers organization
- [ ] Create first client user account

### Phase 2: Dashboard & Layout (Day 5)
- [ ] Create portal layout (header, sidebar, footer)
- [ ] Build dashboard page
- [ ] Add navigation between sections
- [ ] Implement logout functionality
- [ ] Mobile responsive layout

### Phase 3: Photo Upload (Day 6-8)
- [ ] Set up R2 bucket for uploads
- [ ] Create signed URL generation API
- [ ] Build drag & drop upload component
- [ ] Implement category selection
- [ ] Save photo metadata to database
- [ ] Build photo gallery view
- [ ] Add delete functionality
- [ ] Show upload progress

### Phase 4: Document Viewing (Day 9-10)
- [ ] Create documents table
- [ ] Build document list UI
- [ ] Implement PDF viewer (or link to download)
- [ ] Add document type icons
- [ ] Sort by date/type

### Phase 5: Polish & Deploy (Day 11-12)
- [ ] Error handling & loading states
- [ ] Toast notifications
- [ ] Empty states
- [ ] Final UI polish
- [ ] Test full flow
- [ ] Deploy production
- [ ] Send login credentials to Vetted Trainers

---

## Success Criteria

The MVP is complete when Vetted Trainers can:

1. ✅ **Log in** to their portal at `portal.soundsgoodsoftware.com`
2. ✅ **Upload photos** via drag & drop with category selection
3. ✅ **View their uploaded photos** in a gallery
4. ✅ **View documents** you've shared with them
5. ✅ **Download documents** to their computer

---

## Timeline

| Phase | Days | Target |
|-------|------|--------|
| Setup | 1-2 | Foundation working |
| Auth | 3-4 | Login functional |
| Dashboard | 5 | Navigation complete |
| Photos | 6-8 | Upload working |
| Documents | 9-10 | Viewing complete |
| Polish | 11-12 | Ready for client |

**Total: ~2 weeks to MVP**

---

## Post-MVP (Phase 2)

Once Vetted Trainers is live and happy:

1. **Add Ticket System** – Let them submit edit requests
2. **Add Brand Info Form** – Collect their brand details
3. **Build Admin Dashboard** – Your management interface
4. **Onboard Second Client** – Test multi-tenancy

---

## Environment Variables Needed

```bash
# .env.local

# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# File Storage (Cloudflare R2)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="soundsgood-uploads"
R2_PUBLIC_URL="https://..."

# Email (for password reset)
RESEND_API_KEY="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Design Notes

### Color Palette (Initial)
- **Primary:** Deep blue or teal (professional, trustworthy)
- **Accent:** Warm orange or coral (friendly, approachable)
- **Neutrals:** Slate grays
- **Background:** Off-white or subtle gradient

### Typography
- **Headings:** Inter or similar clean sans-serif
- **Body:** System font stack for performance

### Vibe
- Clean, professional, but not corporate
- Approachable for non-technical clients
- Clear visual hierarchy
- Generous whitespace

---

## Questions to Resolve

1. **Domain:** What subdomain? `portal.soundsgoodsoftware.com`?
2. **Branding:** Do you have a logo/colors for SoundsGood Software?
3. **Storage:** Cloudflare R2 (cheap) or AWS S3?
4. **Photo limits:** Any max file size or total storage per client?
5. **Document upload:** Admin-only for MVP, or should you also build an admin upload UI?

---

**Ready to start building! 🚀**

