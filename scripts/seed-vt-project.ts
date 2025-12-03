/**
 * Seed script for Vetted Trainers project data
 * Run with: pnpm dotenv -e apps/web/.env.local -- npx tsx scripts/seed-vt-project.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import {
  projects,
  projectPhases,
  projectTasks,
  projectDeadlines,
  organizations,
  users,
} from "../packages/db/src/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Simple ID generator (copy from utils since we can't import it easily)
function createId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seedVTProject() {
  console.log("🌱 Seeding Vetted Trainers project data...\n");

  // First, find or create the Vetted Trainers organization
  let [vtOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, "Vetted Trainers"))
    .limit(1);

  if (!vtOrg) {
    console.log("Creating Vetted Trainers organization...");
    const [newOrg] = await db
      .insert(organizations)
      .values({
        id: createId(),
        name: "Vetted Trainers",
        slug: "vetted-trainers",
      })
      .returning();
    vtOrg = newOrg;
    console.log(`✓ Created organization: ${vtOrg.name} (${vtOrg.id})`);
    
    // Update the VT user to be part of this organization
    const [vtUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "client@vettedtrainers.com"))
      .limit(1);
    
    if (vtUser) {
      await db
        .update(users)
        .set({ organizationId: vtOrg.id })
        .where(eq(users.id, vtUser.id));
      console.log(`✓ Updated user ${vtUser.email} to organization ${vtOrg.name}`);
    }
  } else {
    console.log(`✓ Found organization: ${vtOrg.name} (${vtOrg.id})`);
  }

  // Check if project already exists
  const [existingProject] = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, vtOrg.id))
    .limit(1);

  if (existingProject) {
    console.log(`⚠️  Project already exists: ${existingProject.name}`);
    console.log("   Skipping to avoid duplicates. Delete existing data first if you want to reseed.");
    process.exit(0);
  }

  // Create the VT project
  const [project] = await db
    .insert(projects)
    .values({
      id: createId(),
      organizationId: vtOrg.id,
      name: "Custom Business Management Platform",
      description: "Full-stack business management platform including web application, booking system, membership management, SMS integration, and admin dashboard.",
      clientName: "Vetted Trainers",
      status: "in-progress",
      startDate: new Date("2025-11-21"),
      targetEndDate: new Date("2026-02-10"),
      totalWeeks: 12,
      agreementDate: new Date("2025-11-21"),
      contractValue: 600000, // $6,000.00 in cents
    })
    .returning();

  console.log(`✓ Created project: ${project.name} (${project.id})`);

  // Helper to create deliverables with completion status
  const d = (name: string, completed = false) => ({ name, completed });

  // Create project phases
  const phasesData = [
    {
      id: createId(),
      name: "Discovery & Planning",
      description: "Initial consultation, requirements gathering, scope definition, and agreement signing",
      orderIndex: 1,
      status: "completed" as const,
      isMilestone: false,
      estimatedStartDate: new Date("2025-11-21"),
      estimatedEndDate: new Date("2025-11-21"),
      actualStartDate: new Date("2025-11-21"),
      actualEndDate: new Date("2025-11-21"),
      deliverables: [d("Requirements document", true), d("Signed agreement", true), d("Project timeline", true)],
    },
    {
      id: createId(),
      name: "Content Collection",
      description: "Gathering trainer photos, facility images, branding assets, and migrating Google Sheets data",
      orderIndex: 2,
      status: "in-progress" as const,
      isMilestone: false,
      estimatedStartDate: new Date("2025-11-25"),
      estimatedEndDate: new Date("2025-12-08"),
      actualStartDate: new Date("2025-11-25"),
      deliverables: [d("Trainer photos"), d("Facility photos"), d("Brand assets"), d("Google Sheets access")],
    },
    {
      id: createId(),
      name: "Foundation & Database",
      description: "Database architecture, authentication system, data migration from Google Sheets",
      orderIndex: 3,
      status: "upcoming" as const,
      isMilestone: true,
      milestoneLabel: "Milestone 1 (Weeks 1-4)",
      estimatedStartDate: new Date("2025-12-09"),
      estimatedEndDate: new Date("2025-12-19"),
      deliverables: [d("Database schema"), d("User authentication"), d("Data migration"), d("Client portal")],
    },
    {
      id: createId(),
      name: "Core Features Development",
      description: "Trainer scheduling, client booking system, membership management, SMS integration",
      orderIndex: 4,
      status: "upcoming" as const,
      isMilestone: false,
      estimatedStartDate: new Date("2025-12-23"),
      estimatedEndDate: new Date("2026-01-03"),
      deliverables: [d("Trainer scheduling system"), d("Client booking"), d("Membership tiers"), d("SMS notifications")],
    },
    {
      id: createId(),
      name: "Working Demo",
      description: "Presentation of functional application with core features for client review",
      orderIndex: 5,
      status: "upcoming" as const,
      isMilestone: true,
      milestoneLabel: "Milestone 2 (Weeks 6-8)",
      estimatedStartDate: new Date("2026-01-06"),
      estimatedEndDate: new Date("2026-01-10"),
      deliverables: [d("Working demo"), d("Client presentation"), d("Feedback collection")],
    },
    {
      id: createId(),
      name: "Admin Dashboard & Polish",
      description: "Business analytics, revenue tracking, email marketing integration, final refinements",
      orderIndex: 6,
      status: "upcoming" as const,
      isMilestone: false,
      estimatedStartDate: new Date("2026-01-13"),
      estimatedEndDate: new Date("2026-01-24"),
      deliverables: [d("Admin dashboard"), d("Business analytics"), d("Email marketing"), d("UI polish")],
    },
    {
      id: createId(),
      name: "Review & Revisions",
      description: "Client testing, feedback incorporation, staff training for Youseff and team",
      orderIndex: 7,
      status: "upcoming" as const,
      isMilestone: false,
      estimatedStartDate: new Date("2026-01-27"),
      estimatedEndDate: new Date("2026-02-07"),
      deliverables: [d("Client feedback"), d("Bug fixes"), d("Staff training"), d("Documentation")],
    },
    {
      id: createId(),
      name: "Launch & Deployment",
      description: "Final testing, production deployment, go-live, and support period begins",
      orderIndex: 8,
      status: "upcoming" as const,
      isMilestone: true,
      milestoneLabel: "Milestone 3 (Weeks 10-12)",
      estimatedStartDate: new Date("2026-02-10"),
      estimatedEndDate: new Date("2026-02-10"),
      deliverables: [d("Production deployment"), d("DNS configuration"), d("Go-live"), d("Support handoff")],
    },
  ];

  const phases = await db
    .insert(projectPhases)
    .values(phasesData.map(p => ({ ...p, projectId: project.id })))
    .returning();

  console.log(`✓ Created ${phases.length} project phases`);

  // Create project tasks (action items)
  const tasksData = [
    {
      id: createId(),
      title: "Upload trainer headshots and professional bio photos",
      description: "High-quality photos of each trainer for the website",
      assignee: "Vetted Trainers",
      priority: "high" as const,
      status: "pending" as const,
      dueDate: new Date("2025-12-08"),
    },
    {
      id: createId(),
      title: "Provide facility and gym equipment photos",
      description: "Photos of the gym, equipment, and training spaces",
      assignee: "Vetted Trainers",
      priority: "high" as const,
      status: "pending" as const,
      dueDate: new Date("2025-12-08"),
    },
    {
      id: createId(),
      title: "Share branding assets (logo, colors, fonts)",
      description: "Brand guidelines, logo files, color codes, and font information",
      assignee: "Vetted Trainers",
      priority: "medium" as const,
      status: "pending" as const,
      dueDate: new Date("2025-12-06"),
    },
    {
      id: createId(),
      title: "Provide access to existing Google Sheets data",
      description: "Share access to current client, trainer, and business data",
      assignee: "Vetted Trainers",
      priority: "high" as const,
      status: "pending" as const,
      dueDate: new Date("2025-12-09"),
    },
  ];

  const tasks = await db
    .insert(projectTasks)
    .values(tasksData.map(t => ({ ...t, projectId: project.id })))
    .returning();

  console.log(`✓ Created ${tasks.length} project tasks`);

  // Create project deadlines
  const deadlinesData = [
    { id: createId(), title: "All photos and assets uploaded", date: new Date("2025-12-08") },
    { id: createId(), title: "Google Sheets data access provided", date: new Date("2025-12-09") },
    { id: createId(), title: "Foundation complete (Milestone 1)", date: new Date("2025-12-19") },
    { id: createId(), title: "Working demo presentation (Milestone 2)", date: new Date("2026-01-10") },
    { id: createId(), title: "Final delivery & launch (Milestone 3)", date: new Date("2026-02-10") },
  ];

  const deadlines = await db
    .insert(projectDeadlines)
    .values(deadlinesData.map(d => ({ ...d, projectId: project.id })))
    .returning();

  console.log(`✓ Created ${deadlines.length} project deadlines`);

  console.log("\n✅ Vetted Trainers project data seeded successfully!");
  console.log(`   Project ID: ${project.id}`);
}

seedVTProject()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error seeding VT project:", err);
    process.exit(1);
  });
