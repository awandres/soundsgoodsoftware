import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "../utils";

// Organization status enum values
export const organizationStatuses = [
  "lead",
  "active",
  "paused",
  "completed",
] as const;
export type OrganizationStatus = (typeof organizationStatuses)[number];

// Organizations table (clients/companies)
export const organizations = pgTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: organizationStatuses }).default("lead"),
  settings: jsonb("settings").$type<OrganizationSettings>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Organization settings type
export interface OrganizationSettings {
  primaryColor?: string;
  logo?: string;
  customDomain?: string;
}

// Infer types from schema
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

