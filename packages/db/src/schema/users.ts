import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { createId } from "../utils";

// User role enum values (system-wide role)
export const userRoles = ["admin", "staff", "client"] as const;
export type UserRole = (typeof userRoles)[number];

// Account type enum values (for client users within their org)
// - team_lead: Primary contact/founder, full access to documents, invoices, contracts
// - team_member: Team member, restricted access (no sensitive docs, can be restricted from certain photos)
export const accountTypes = ["team_lead", "team_member"] as const;
export type AccountType = (typeof accountTypes)[number];

// Users table
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  
  // System-wide role (admin, staff, client)
  role: text("role", { enum: userRoles }).default("client").notNull(),
  
  // Account type within organization (for client users)
  // Team Lead = full access, Team Member = restricted access
  accountType: text("account_type", { enum: accountTypes }).default("team_member"),
  
  // Organization membership
  organizationId: text("organization_id").references(() => organizations.id),
  
  // Account status
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// User relations
export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

// Infer types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
