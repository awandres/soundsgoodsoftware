# Changelog

All notable changes to SoundsGood Software are documented in this file.

---

## [Unreleased]

### Added

#### Roadmap Page (December 5, 2024)
- **Dynamic roadmap display** based on user's organization
  - Vetted Trainers users see full detailed roadmap with real pricing ($6,000), timelines, and 1-year free support details
  - Demo/other users see generic version with `$XXXX` placeholders
- **Interactive features**: Collapsible sections, clickable feature cards with detailed descriptions
- **Contract overview**: Payment schedule, milestones, development timeline
- Added roadmap link to portal navigation sidebar

#### Brand Colors for Invitations (December 5, 2024)
- **Auto-populate brand colors** when selecting an existing project in invitation form
- **"Loaded from project" indicator** shows when colors come from existing org
- **Project dropdown enhancements**: Shows color dots for projects with existing branding
- **Email header preview** using brand colors (visible when not using custom email colors)
- **Brand color updates**: Changes to brand colors are saved to the organization when invitation is sent
- **Custom email colors** option preserved for cases where email-specific colors are needed

#### Invitation Flow Improvements (December 5, 2024)
- Invitations to existing projects now correctly inherit the project's organization
- New users accepting invitations are properly assigned to the existing project's organization
- No duplicate projects created when inviting to existing projects

### Fixed

#### Invitation Bugs (December 5, 2024)
- Fixed invitation failure when attaching invitee to existing project
- Fixed `organizationId` not being inherited from project during invitation creation
- Fixed duplicate variable declaration error in invitations API (`brandColors`)

#### Vetted Trainers Project
- Created and seeded Vetted Trainers project with correct MOU details:
  - Agreement date: November 21, 2025
  - Contract value: $6,000
  - Timeline: 2-3 months (12 weeks)
  - 3 milestones with payment triggers
  - Initial deliverables and phases

### Changed

#### API Enhancements
- `/api/projects`: Added `?includeOrg=true` parameter to fetch organization settings (brand colors, logo)
- `/api/invitations`: Now accepts `brandColors` parameter and updates organization settings

---

## Previous Updates

### November 2024

#### Foundation & Auth
- Initialized Turborepo monorepo with pnpm workspaces
- Created shared packages: `@soundsgood/config`, `@soundsgood/db`, `@soundsgood/ui`, `@soundsgood/auth`
- Better Auth integration with Drizzle adapter
- Session management with middleware protection
- Dev admin mode toggle (localhost only)

#### Client Portal UI
- Dashboard with project progress overview
- Photo management with R2 uploads, categories, SEO tagging
- Document management with upload/view/download
- Project status page with timeline and deliverables

#### Database Schema
- Users, organizations, photos, documents tables
- Project management tables: projects, project_phases, project_tasks, project_deadlines
- Invitations table with organization setup data

---

## Versioning

This project uses date-based versioning for tracking changes. Major features and fixes are logged with their implementation dates.

