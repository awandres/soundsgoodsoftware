# Task Plans for Agent Handoff

These plans are ready to be picked up by AI agents. Each task is self-contained with full context.

---

## Task 1: Email Preview with Adjustable Colors

### Overview
Allow admin users to preview invitation emails before sending and adjust email-specific colors without affecting the organization's brand colors.

### Current State
- Invitations are sent via `/api/invitations` POST route
- Email template is in `apps/web/src/lib/email.ts` (`sendInvitationEmail` function)
- Brand colors come from `organizationData.brandColors` or existing `organization.settings.brandColors`
- Client invitation form is at `apps/web/src/app/(portal)/clients/page.tsx`

### Requirements
1. **Email Preview Modal**
   - Show a rendered preview of the email HTML before sending
   - Display in an iframe or sanitized HTML container
   - Include both desktop and mobile preview options

2. **Adjustable Email Colors (Separate from Brand)**
   - Add color pickers specifically for the email (not stored as org brand colors)
   - Fields: `emailPrimaryColor`, `emailSecondaryColor`, `emailAccentColor`
   - Default to brand colors if set, otherwise use app defaults
   - Store temporarily in form state only (not persisted to org settings)

3. **Text Contrast Validation**
   - Calculate contrast ratio between text and background colors
   - Show warning if contrast is below WCAG AA standards (4.5:1 for normal text)
   - Suggest color adjustments if contrast is poor

### Implementation Steps

1. **Create Email Preview API** (`apps/web/src/app/api/email-preview/route.ts`)
   ```typescript
   // POST - Generate email HTML preview without sending
   // Input: { email, name, organizationName, brandColors, logoUrl, message }
   // Output: { html: string, warnings: string[] }
   ```

2. **Create Contrast Utility** (`apps/web/src/lib/colorUtils.ts`)
   ```typescript
   export function getContrastRatio(color1: string, color2: string): number;
   export function meetsWCAG(foreground: string, background: string): { aa: boolean, aaa: boolean };
   export function suggestAccessibleColor(background: string, preferLight?: boolean): string;
   ```

3. **Update Clients Page** (`apps/web/src/app/(portal)/clients/page.tsx`)
   - Add "Preview Email" button in the form
   - Add email-specific color overrides in Branding tab
   - Show contrast warnings next to color pickers
   - Add EmailPreviewDialog component

4. **Create EmailPreviewDialog Component** (`apps/web/src/components/EmailPreviewDialog.tsx`)
   ```typescript
   interface EmailPreviewDialogProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     emailHtml: string;
     warnings: string[];
     onSend: () => void;
   }
   ```

### Files to Create/Modify
- `apps/web/src/app/api/email-preview/route.ts` (new)
- `apps/web/src/lib/colorUtils.ts` (new)
- `apps/web/src/components/EmailPreviewDialog.tsx` (new)
- `apps/web/src/app/(portal)/clients/page.tsx` (modify)

### Testing
- Preview with various brand color combinations
- Verify contrast warnings appear for low-contrast colors
- Test email preview renders correctly in the modal
- Confirm send still works after preview

---

## Task 2: Data-Driven Project Entity System

### Overview
Transform Projects into a comprehensive, data-driven entity that powers the dashboard, project status, and timeline. Projects represent the custom software/service being delivered to clients.

### Context
Reference: The VT (Vetted Trainers) Roadmap shows what a delivered project includes:
- CRM functionality
- Booking system
- Marketing tools
- Admin functions
- Public-facing website

### Current State
- Project schema exists at `packages/db/src/schema/projects.ts`
- Projects have: name, description, clientName, status, dates, phases, tasks, deadlines
- Dashboard displays project info from `/api/dashboard`
- Project status page exists at `apps/web/src/app/(portal)/project-status/page.tsx`
- Demo data: "Vetted Trainers" project should be preserved

### Requirements

1. **Flexible Project Schema** - All attributes optional except name
   - Empty/null values display as "TBD", "Unassigned", "Not Set" etc.
   - Support partial project creation (name only initially)

2. **Project Dashboard Integration**
   - Dashboard reads from project data
   - Timeline/progress calculated from project phases
   - Handle projects with no phases gracefully

3. **Admin Project Management**
   - Admin can create projects with minimal info
   - Admin can edit project details later
   - Future: Wizard-based project setup

4. **Client Project Settings**
   - Clients can adjust SOME settings (future)
   - Read-only view of project status

5. **Preserve Demo Data**
   - Keep "Vetted Trainers" project in database
   - Use as reference for project structure

### Implementation Steps

#### Phase 1: Schema Updates

1. **Update Project Schema** (`packages/db/src/schema/projects.ts`)
   ```typescript
   // Make more fields nullable
   export const projects = pgTable("projects", {
     id: text("id").primaryKey().$defaultFn(() => createId()),
     organizationId: text("organization_id").references(() => organizations.id),
     
     // Required
     name: text("name").notNull(),
     
     // Optional - display as TBD/Unassigned when null
     description: text("description"),
     clientName: text("client_name"),          // Was required, now optional
     status: text("status", { enum: projectStatuses }).default("planning"),
     
     // Timeline - all optional
     startDate: timestamp("start_date", { withTimezone: true }),
     targetEndDate: timestamp("target_end_date", { withTimezone: true }),
     actualEndDate: timestamp("actual_end_date", { withTimezone: true }),
     totalWeeks: integer("total_weeks"),       // Removed default
     
     // Contract info - optional
     agreementDate: timestamp("agreement_date", { withTimezone: true }),
     contractValue: integer("contract_value"),
     
     // New: Project type/template
     projectType: text("project_type"),        // "full_platform", "website_only", "crm_only", etc.
     
     // New: Deliverables checklist (JSON)
     deliverables: jsonb("deliverables").$type<ProjectDeliverables>(),
     
     createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
     updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
   });
   
   // Type for project deliverables
   interface ProjectDeliverables {
     crm?: { enabled: boolean; status: "pending" | "in-progress" | "complete" };
     booking?: { enabled: boolean; status: "pending" | "in-progress" | "complete" };
     marketing?: { enabled: boolean; status: "pending" | "in-progress" | "complete" };
     admin?: { enabled: boolean; status: "pending" | "in-progress" | "complete" };
     website?: { enabled: boolean; status: "pending" | "in-progress" | "complete" };
   }
   ```

2. **Create Display Helpers** (`packages/db/src/utils/projectDisplay.ts`)
   ```typescript
   export function displayProjectValue(value: any, type: "date" | "text" | "number" | "status"): string;
   // Returns "TBD", "Unassigned", "Not Set", etc. for null values
   ```

#### Phase 2: API Updates

3. **Update Dashboard API** (`apps/web/src/app/api/dashboard/route.ts`)
   - Handle projects with no phases
   - Return meaningful defaults for missing data
   - Calculate progress even with partial data

4. **Create/Update Projects API** (`apps/web/src/app/api/projects/route.ts`)
   - Add POST for creating projects (admin only)
   - Update PUT for editing all project fields
   - Validate only `name` is required

5. **Create Admin Projects API** (`apps/web/src/app/api/admin/projects/route.ts`)
   ```typescript
   // GET - List all projects (admin only)
   // POST - Create new project with minimal data
   // PUT - Update any project field
   // DELETE - Delete project (with confirmation)
   ```

#### Phase 3: UI Updates

6. **Update Project Status Page** (`apps/web/src/app/(portal)/project-status/page.tsx`)
   - Handle null/undefined values gracefully
   - Show "TBD" placeholders for missing dates
   - Display "No phases defined yet" when no phases

7. **Create Admin Project Management Page** (`apps/web/src/app/(portal)/admin/projects/page.tsx`)
   - List all projects
   - Create new project (name only initially)
   - Edit project details
   - Future: Wizard-based setup

8. **Update Dashboard** (`apps/web/src/app/(portal)/dashboard/page.tsx`)
   - Handle projects without phases
   - Show "Project setup in progress" for incomplete projects
   - Graceful degradation when data missing

#### Phase 4: Seed Data

9. **Preserve Vetted Trainers Demo** (`scripts/seed.ts`)
   - Ensure "Vetted Trainers" project remains
   - Add as a fully populated example project
   - Include sample phases, tasks, deadlines

### Files to Create/Modify

**Schema:**
- `packages/db/src/schema/projects.ts` (modify)
- `packages/db/src/utils/projectDisplay.ts` (new)

**APIs:**
- `apps/web/src/app/api/dashboard/route.ts` (modify)
- `apps/web/src/app/api/projects/route.ts` (modify)
- `apps/web/src/app/api/admin/projects/route.ts` (new)

**UI:**
- `apps/web/src/app/(portal)/project-status/page.tsx` (modify)
- `apps/web/src/app/(portal)/dashboard/page.tsx` (modify)
- `apps/web/src/app/(portal)/admin/projects/page.tsx` (new)

**Seeds:**
- `scripts/seed.ts` (modify)

### Testing Checklist
- [ ] Create project with only name - verify displays correctly
- [ ] Dashboard handles project with no phases
- [ ] Project status page shows TBD for missing dates
- [ ] Admin can create and edit projects
- [ ] "Vetted Trainers" project preserved and functional
- [ ] Progress calculation works with partial data

---

## Notes for Agents

### Email Logo Not Displaying
The logo not displaying in the invitation email is likely because:
1. **Localhost URLs**: Email clients can't load `http://localhost:3000/...` URLs
2. **R2 Public URLs**: If using R2, the public URL should work, but make sure CORS is configured
3. **Testing**: Use a service like Mailtrap or send to a real email to test logo display

**Solution**: Logos should use the R2 public URL (`R2_PUBLIC_URL` env var) which is accessible from anywhere. The current code at `apps/web/src/lib/email.ts` passes `logoUrl` which should already be the R2 public URL if uploaded correctly.

### Common Patterns in This Codebase
- Auth: `auth.api.getSession({ headers: request.headers })`
- Admin check: `(session.user as any).role === "admin"`
- DB queries use Drizzle: `db.select().from(table).where(eq(...))`
- UI components from `@soundsgood/ui`
- API routes in `apps/web/src/app/api/`

### Running Locally
```bash
pnpm dev                    # Start dev server
pnpm db:push               # Push schema changes
pnpm tsx scripts/seed.ts   # Run seed script
```

