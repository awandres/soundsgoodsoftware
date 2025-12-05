import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations, BrandColors } from "./organizations";
import { projects } from "./projects";
import { users, AccountType, accountTypes } from "./users";
import { BusinessType } from "./business-types";
import { createId } from "../utils";

// Invitation status enum values
export const invitationStatuses = ["pending", "accepted", "expired", "revoked"] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];

// Organization setup data - stored on invitation for creating org when accepted
export interface OrganizationSetupData {
  // Business information
  businessName: string;
  businessType?: BusinessType;
  contactName?: string;
  
  // Branding
  logoUrl?: string;      // URL to uploaded logo
  logoKey?: string;      // R2 key for logo
  brandColors?: BrandColors;
  
  // Custom photo tags (override defaults from business type)
  customPhotoTags?: string[];
}

// Invitations table for client intake
export const invitations = pgTable("invitations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  
  // Who is being invited
  email: text("email").notNull(),
  name: text("name"),
  
  // Secure token for the magic link
  token: text("token").notNull().unique(),
  
  // What organization they'll belong to (null if creating new org)
  organizationId: text("organization_id").references(() => organizations.id),
  
  // Pre-assign to a project (can be existing or new project created with invite)
  projectId: text("project_id").references(() => projects.id),
  
  // Data for creating a new organization (when organizationId is null)
  organizationData: jsonb("organization_data").$type<OrganizationSetupData>(),
  
  // What system role they'll have (default: client)
  role: text("role").default("client").notNull(),
  
  // What account type within their org (team_lead = full access, team_member = restricted)
  accountType: text("account_type", { enum: accountTypes }).default("team_member"),
  
  // Invitation status
  status: text("status", { enum: invitationStatuses }).default("pending").notNull(),
  
  // Demo invite flag - allows user to preview portal before committing
  isDemo: boolean("is_demo").default(false),
  
  // Who sent the invitation
  invitedBy: text("invited_by").references(() => users.id),
  
  // Optional message to include in the email
  message: text("message"),
  
  // Timestamps
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Invitation relations
export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [invitations.projectId],
    references: [projects.id],
  }),
  invitedByUser: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

// Infer types from schema
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
