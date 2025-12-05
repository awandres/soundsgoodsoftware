import { pgTable, text, timestamp, integer, boolean, json, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { createId } from "../utils";

// =============================================================================
// PROJECTS
// =============================================================================

// Project status enum
export const projectStatuses = [
  "planning",
  "in-progress",
  "on-hold",
  "completed",
  "cancelled",
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

// Project type enum - describes what kind of project is being delivered
export const projectTypes = [
  "full_platform",    // Complete business management system
  "website_only",     // Just the public-facing website
  "crm_only",         // Customer relationship management only
  "booking_only",     // Booking/scheduling system only
  "custom",           // Custom combination of features
] as const;
export type ProjectType = (typeof projectTypes)[number];

// Deliverable status for project-level deliverables
export const deliverableStatuses = ["pending", "in-progress", "complete"] as const;
export type DeliverableStatus = (typeof deliverableStatuses)[number];

// Type for project deliverables (what's being built)
export interface ProjectDeliverable {
  enabled: boolean;
  status: DeliverableStatus;
  notes?: string;
}

export interface ProjectDeliverables {
  crm?: ProjectDeliverable;
  booking?: ProjectDeliverable;
  marketing?: ProjectDeliverable;
  admin?: ProjectDeliverable;
  website?: ProjectDeliverable;
  custom?: { name: string; enabled: boolean; status: DeliverableStatus; notes?: string }[];
}

// Projects table - one per client project
// All fields optional except name - allows partial project creation
export const projects = pgTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .references(() => organizations.id),
  
  // Required - only name is required
  name: text("name").notNull(),
  
  // Optional - display as TBD/Unassigned when null
  description: text("description"),
  clientName: text("client_name"),              // Now optional - shows "Unassigned" when null
  status: text("status", { enum: projectStatuses }).default("planning"),
  
  // Timeline - all optional, shows "TBD" when null
  startDate: timestamp("start_date", { withTimezone: true }),
  targetEndDate: timestamp("target_end_date", { withTimezone: true }),
  actualEndDate: timestamp("actual_end_date", { withTimezone: true }),
  totalWeeks: integer("total_weeks"),           // Removed default - shows "TBD" when null
  
  // Contract info - optional
  agreementDate: timestamp("agreement_date", { withTimezone: true }),
  contractValue: integer("contract_value"),     // in cents
  
  // Project type/template - describes what's being built
  projectType: text("project_type", { enum: projectTypes }),
  
  // Deliverables checklist - what components are included
  deliverables: jsonb("deliverables").$type<ProjectDeliverables>(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// =============================================================================
// PROJECT PHASES
// =============================================================================

// Phase status enum
export const phaseStatuses = [
  "upcoming",
  "in-progress",
  "completed",
  "skipped",
] as const;
export type PhaseStatus = (typeof phaseStatuses)[number];

// Project phases table
export const projectPhases = pgTable("project_phases", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  projectId: text("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  
  // Phase info
  name: text("name").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(), // for sorting
  status: text("status", { enum: phaseStatuses }).default("upcoming"),
  
  // Milestone marker (for major milestones)
  isMilestone: boolean("is_milestone").default(false),
  milestoneLabel: text("milestone_label"), // e.g., "Milestone 1 (Weeks 1-4)"
  
  // Dates
  estimatedStartDate: timestamp("estimated_start_date", { withTimezone: true }),
  estimatedEndDate: timestamp("estimated_end_date", { withTimezone: true }),
  actualStartDate: timestamp("actual_start_date", { withTimezone: true }),
  actualEndDate: timestamp("actual_end_date", { withTimezone: true }),
  
  // Additional details (for expandable view later)
  details: text("details"), // Rich text / markdown for detailed info
  deliverables: json("deliverables").$type<{ name: string; completed: boolean }[]>(), // List of deliverables with completion status
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// =============================================================================
// PROJECT TASKS (Action Items)
// =============================================================================

// Task priority enum
export const taskPriorities = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;
export type TaskPriority = (typeof taskPriorities)[number];

// Task status enum
export const taskStatuses = [
  "pending",
  "in-progress",
  "completed",
  "cancelled",
] as const;
export type TaskStatus = (typeof taskStatuses)[number];

// Project tasks table
export const projectTasks = pgTable("project_tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  projectId: text("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  phaseId: text("phase_id")
    .references(() => projectPhases.id, { onDelete: "set null" }),
  
  // Task info
  title: text("title").notNull(),
  description: text("description"),
  assignee: text("assignee"), // "Client", "Developer", specific name
  priority: text("priority", { enum: taskPriorities }).default("medium"),
  status: text("status", { enum: taskStatuses }).default("pending"),
  
  // Dates
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// =============================================================================
// PROJECT DEADLINES (Key Dates)
// =============================================================================

export const projectDeadlines = pgTable("project_deadlines", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  projectId: text("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  
  // Deadline info
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  
  // Optional link to phase
  phaseId: text("phase_id")
    .references(() => projectPhases.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  phases: many(projectPhases),
  tasks: many(projectTasks),
  deadlines: many(projectDeadlines),
}));

export const projectPhasesRelations = relations(projectPhases, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectPhases.projectId],
    references: [projects.id],
  }),
  tasks: many(projectTasks),
  deadlines: many(projectDeadlines),
}));

export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
  project: one(projects, {
    fields: [projectTasks.projectId],
    references: [projects.id],
  }),
  phase: one(projectPhases, {
    fields: [projectTasks.phaseId],
    references: [projectPhases.id],
  }),
}));

export const projectDeadlinesRelations = relations(projectDeadlines, ({ one }) => ({
  project: one(projects, {
    fields: [projectDeadlines.projectId],
    references: [projects.id],
  }),
  phase: one(projectPhases, {
    fields: [projectDeadlines.phaseId],
    references: [projectPhases.id],
  }),
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectPhase = typeof projectPhases.$inferSelect;
export type NewProjectPhase = typeof projectPhases.$inferInsert;

export type ProjectTask = typeof projectTasks.$inferSelect;
export type NewProjectTask = typeof projectTasks.$inferInsert;

export type ProjectDeadline = typeof projectDeadlines.$inferSelect;
export type NewProjectDeadline = typeof projectDeadlines.$inferInsert;

