import { db } from "@soundsgood/db/client";
import { 
  users, 
  organizations, 
  accounts, 
  sessions, 
  invitations, 
  documents, 
  photos,
  projects,
  projectPhases,
  projectTasks,
  projectDeadlines,
  businessTypes,
  getPhotoTagsForBusinessType,
} from "@soundsgood/db/schema";
import type { PhaseStatus } from "@soundsgood/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

// Default business type for the demo client
const DEFAULT_DEMO_BUSINESS_TYPE = "fitness";

async function seed() {
  console.log("🌱 Seeding database...");

  // Hash passwords using BetterAuth's scrypt-based hasher
  console.log("Hashing passwords...");
  const adminPasswordHash = await hashPassword("admin123");
  const demoPasswordHash = await hashPassword("demo123");

  // Get user IDs for the emails we'll seed
  console.log("Finding existing users to clean up...");
  const existingUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        eq(users.email, "admin@soundsgoodsoftware.com"),
        eq(users.email, "demo@yourbiz.com"),
        // Also clean up old Vetted Trainers user if exists
        eq(users.email, "client@vettedtrainers.com")
      )
    );
  
  if (existingUsers.length > 0) {
    console.log(`Cleaning up ${existingUsers.length} existing seed users...`);
    const userIds = existingUsers.map(u => u.id);
    
    // Delete in order of dependencies
    for (const userId of userIds) {
      await db.delete(documents).where(eq(documents.uploadedBy, userId));
      await db.delete(photos).where(eq(photos.uploadedBy, userId));
      await db.delete(invitations).where(eq(invitations.invitedBy, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(accounts).where(eq(accounts.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  }

  // Clean up old Vetted Trainers org if exists
  const oldOrg = await db.select().from(organizations).where(eq(organizations.slug, "vetted-trainers"));
  if (oldOrg.length > 0) {
    console.log("Cleaning up old Vetted Trainers organization...");
    const oldOrgId = oldOrg[0].id;
    
    // Get all projects for this org
    const orgProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.organizationId, oldOrgId));
    
    // Delete project-related data
    for (const proj of orgProjects) {
      await db.delete(projectDeadlines).where(eq(projectDeadlines.projectId, proj.id));
      await db.delete(projectTasks).where(eq(projectTasks.projectId, proj.id));
      await db.delete(projectPhases).where(eq(projectPhases.projectId, proj.id));
    }
    await db.delete(projects).where(eq(projects.organizationId, oldOrgId));
    await db.delete(documents).where(eq(documents.organizationId, oldOrgId));
    await db.delete(photos).where(eq(photos.organizationId, oldOrgId));
    await db.delete(organizations).where(eq(organizations.slug, "vetted-trainers"));
  }

  // Create or get Demo Business organization
  console.log("Creating demo organization...");
  let orgId = "org_demo_business";
  const existingOrg = await db.select().from(organizations).where(eq(organizations.slug, "demo-business"));
  
  // Get photo tags for the default business type
  const photoTags = getPhotoTagsForBusinessType(DEFAULT_DEMO_BUSINESS_TYPE);
  
  if (existingOrg.length === 0) {
    await db.insert(organizations).values({
      id: orgId,
      name: "Demo Business",
      slug: "demo-business",
      businessType: DEFAULT_DEMO_BUSINESS_TYPE,
      contactName: "Demo User",
      contactEmail: "demo@yourbiz.com",
      status: "active",
      settings: {
        brandColors: {
          primary: "#3b82f6",
          secondary: "#1e40af", 
          accent: "#f59e0b",
        },
        photoTags,
      },
    });
  } else {
    orgId = existingOrg[0].id;
    // Update the existing org with the new settings
    await db.update(organizations)
      .set({
        businessType: DEFAULT_DEMO_BUSINESS_TYPE,
        settings: {
          brandColors: {
            primary: "#3b82f6",
            secondary: "#1e40af",
            accent: "#f59e0b",
          },
          photoTags,
        },
      })
      .where(eq(organizations.id, orgId));
    console.log(`  Organization already exists with ID: ${orgId}, updated settings`);
  }

  // Create admin user
  console.log("Creating admin user...");
  await db.insert(users).values({
    id: "user_admin",
    email: "admin@soundsgoodsoftware.com",
    name: "Admin User",
    role: "admin",
    organizationId: null,
    emailVerified: true,
  });

  // Create admin account (for password auth)
  await db.insert(accounts).values({
    id: "acc_admin",
    userId: "user_admin",
    accountId: "admin@soundsgoodsoftware.com",
    providerId: "credential",
    password: adminPasswordHash,
  });

  // Create demo client user (Team Lead)
  console.log("Creating demo client user (Team Lead)...");
  await db.insert(users).values({
    id: "user_demo_client",
    email: "demo@yourbiz.com",
    name: "Demo Team Lead",
    role: "client",
    accountType: "team_lead",
    organizationId: orgId,
    emailVerified: true,
  });

  // Create demo account (for password auth)
  await db.insert(accounts).values({
    id: "acc_demo_client",
    userId: "user_demo_client",
    accountId: "demo@yourbiz.com",
    providerId: "credential",
    password: demoPasswordHash,
  });

  // Create a demo project for the demo organization with full timeline data
  console.log("Creating demo project with timeline...");
  
  // First, clean up any existing demo project data
  const existingDemoProjects = await db.select().from(projects).where(eq(projects.organizationId, orgId));
  if (existingDemoProjects.length > 0) {
    console.log("  Cleaning up existing demo project data...");
    for (const proj of existingDemoProjects) {
      await db.delete(projectDeadlines).where(eq(projectDeadlines.projectId, proj.id));
      await db.delete(projectTasks).where(eq(projectTasks.projectId, proj.id));
      await db.delete(projectPhases).where(eq(projectPhases.projectId, proj.id));
      await db.delete(projects).where(eq(projects.id, proj.id));
    }
  }
  
  // Calculate dates relative to today for a realistic demo
  const today = new Date();
  const weeksAgo = (weeks: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (weeks * 7));
    return d;
  };
  const weeksFromNow = (weeks: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + (weeks * 7));
    return d;
  };
  
  // Create the project - started 3 weeks ago, 12 weeks total
  const [demoProject] = await db.insert(projects).values({
    organizationId: orgId,
    name: "Custom Business Platform",
    description: "Full-stack business management platform including booking system, client management, and admin dashboard.",
    clientName: "Demo Business",
    status: "in-progress",
    startDate: weeksAgo(3),
    targetEndDate: weeksFromNow(9),
    totalWeeks: 12,
    agreementDate: weeksAgo(3),
    projectType: "full_platform",
    deliverables: {
      crm: { enabled: true, status: "in-progress", notes: "Client management system" },
      booking: { enabled: true, status: "pending", notes: "Appointment scheduling" },
      marketing: { enabled: false, status: "pending" },
      admin: { enabled: true, status: "pending", notes: "Business analytics dashboard" },
      website: { enabled: true, status: "in-progress", notes: "Public-facing website" },
    },
  }).returning();
  console.log(`  Created demo project: ${demoProject.name}`);
  
  // Helper for deliverables
  const d = (name: string, completed = false) => ({ name, completed });
  
  // Create project phases - in a middle state (some complete, one in progress, some upcoming)
  const phasesData = [
    {
      name: "Discovery & Planning",
      description: "Initial consultation, requirements gathering, and project scoping",
      orderIndex: 1,
      status: "completed" as const,
      isMilestone: false,
      estimatedStartDate: weeksAgo(3),
      estimatedEndDate: weeksAgo(3),
      actualStartDate: weeksAgo(3),
      actualEndDate: weeksAgo(3),
      deliverables: [d("Requirements document", true), d("Project scope", true), d("Timeline agreement", true)],
    },
    {
      name: "Content & Asset Collection",
      description: "Gathering photos, branding assets, and business data",
      orderIndex: 2,
      status: "completed" as const,
      isMilestone: false,
      estimatedStartDate: weeksAgo(2),
      estimatedEndDate: weeksAgo(1),
      actualStartDate: weeksAgo(2),
      actualEndDate: weeksAgo(1),
      deliverables: [d("Business photos", true), d("Logo and brand colors", true), d("Service descriptions", true)],
    },
    {
      name: "Foundation & Database",
      description: "Database architecture, authentication, and core infrastructure",
      orderIndex: 3,
      status: "in-progress" as const,
      isMilestone: true,
      milestoneLabel: "Milestone 1 (Weeks 1-4)",
      estimatedStartDate: weeksAgo(1),
      estimatedEndDate: weeksFromNow(1),
      actualStartDate: weeksAgo(1),
      deliverables: [d("Database schema", true), d("User authentication", true), d("Client portal", false), d("Admin access", false)],
    },
    {
      name: "Core Features",
      description: "Booking system, client management, and service catalog",
      orderIndex: 4,
      status: "upcoming" as const,
      isMilestone: false,
      estimatedStartDate: weeksFromNow(1),
      estimatedEndDate: weeksFromNow(3),
      deliverables: [d("Booking system"), d("Client profiles"), d("Service management"), d("Notifications")],
    },
    {
      name: "Working Demo",
      description: "Presentation of functional application for client review",
      orderIndex: 5,
      status: "upcoming" as const,
      isMilestone: true,
      milestoneLabel: "Milestone 2 (Weeks 5-7)",
      estimatedStartDate: weeksFromNow(4),
      estimatedEndDate: weeksFromNow(5),
      deliverables: [d("Demo presentation"), d("Client feedback session"), d("Revision planning")],
    },
    {
      name: "Admin Dashboard & Polish",
      description: "Business analytics, reporting, and UI refinements",
      orderIndex: 6,
      status: "upcoming" as const,
      isMilestone: false,
      estimatedStartDate: weeksFromNow(5),
      estimatedEndDate: weeksFromNow(7),
      deliverables: [d("Admin dashboard"), d("Analytics reports"), d("UI polish"), d("Mobile optimization")],
    },
    {
      name: "Testing & Revisions",
      description: "Quality assurance, bug fixes, and final adjustments",
      orderIndex: 7,
      status: "upcoming" as const,
      isMilestone: false,
      estimatedStartDate: weeksFromNow(7),
      estimatedEndDate: weeksFromNow(8),
      deliverables: [d("QA testing"), d("Bug fixes"), d("Performance optimization")],
    },
    {
      name: "Launch & Training",
      description: "Production deployment, staff training, and support handoff",
      orderIndex: 8,
      status: "upcoming" as const,
      isMilestone: true,
      milestoneLabel: "Milestone 3 (Weeks 10-12)",
      estimatedStartDate: weeksFromNow(9),
      estimatedEndDate: weeksFromNow(9),
      deliverables: [d("Production deployment"), d("Staff training"), d("Documentation"), d("Support setup")],
    },
  ];
  
  await db.insert(projectPhases).values(
    phasesData.map(p => ({ ...p, projectId: demoProject.id }))
  );
  console.log(`  Created ${phasesData.length} project phases`);
  
  // Create some action items/tasks
  const tasksData = [
    {
      title: "Review and approve homepage design mockup",
      description: "Check the proposed design and provide feedback",
      assignee: "Demo Business",
      priority: "high" as const,
      status: "pending" as const,
      dueDate: weeksFromNow(1),
    },
    {
      title: "Provide list of services and pricing",
      description: "Complete service catalog with descriptions and prices",
      assignee: "Demo Business",
      priority: "medium" as const,
      status: "pending" as const,
      dueDate: weeksFromNow(2),
    },
    {
      title: "Schedule demo presentation",
      description: "Pick a time for the working demo walkthrough",
      assignee: "Demo Business",
      priority: "low" as const,
      status: "pending" as const,
      dueDate: weeksFromNow(4),
    },
  ];
  
  await db.insert(projectTasks).values(
    tasksData.map(t => ({ ...t, projectId: demoProject.id }))
  );
  console.log(`  Created ${tasksData.length} action items`);
  
  // Create key deadlines
  const deadlinesData = [
    { title: "Foundation complete (Milestone 1)", date: weeksFromNow(1) },
    { title: "Working demo presentation (Milestone 2)", date: weeksFromNow(5) },
    { title: "Final review deadline", date: weeksFromNow(8) },
    { title: "Launch day! (Milestone 3)", date: weeksFromNow(9) },
  ];
  
  await db.insert(projectDeadlines).values(
    deadlinesData.map(d => ({ ...d, projectId: demoProject.id }))
  );
  console.log(`  Created ${deadlinesData.length} key deadlines`)

  console.log("\n✅ Seeding complete!");
  console.log("\n📝 Login credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin:");
  console.log("  Email:    admin@soundsgoodsoftware.com");
  console.log("  Password: admin123");
  console.log("\nDemo Client (Team Lead):");
  console.log("  Email:    demo@yourbiz.com");
  console.log("  Password: demo123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("Available business types for demo:");
  businessTypes.forEach(type => console.log(`  - ${type}`));
  console.log("\n📊 To seed a full example project with phases, run:");
  console.log("  pnpm dotenv -e apps/web/.env.local -- npx tsx scripts/seed-vt-project.ts");
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
