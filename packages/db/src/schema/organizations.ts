import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { BusinessType } from "./business-types";

// Organization status enum values
export const organizationStatuses = [
  "lead",
  "active",
  "paused",
  "completed",
] as const;
export type OrganizationStatus = (typeof organizationStatuses)[number];

// Brand colors for the organization
export interface BrandColors {
  primary?: string;    // Main brand color (hex)
  secondary?: string;  // Secondary color (hex)
  accent?: string;     // Accent color (hex)
}

// Organization settings type (extended)
export interface OrganizationSettings {
  // Branding
  logo?: string;            // URL to logo in R2
  logoKey?: string;         // R2 object key for deletion
  brandColors?: BrandColors;
  customDomain?: string;
  
  // Photo tags for this org (derived from business type, but can be customized)
  photoTags?: string[];
  
  // Any additional custom settings
  [key: string]: unknown;
}

// Organizations table (clients/companies)
export const organizations = pgTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  
  // Business information
  businessType: text("business_type").$type<BusinessType>(),
  contactName: text("contact_name"),       // Primary contact name
  contactEmail: text("contact_email"),     // Primary contact email
  contactPhone: text("contact_phone"),     // Primary contact phone
  
  // Status
  status: text("status", { enum: organizationStatuses }).default("lead"),
  
  // Extended settings (JSON blob)
  settings: jsonb("settings").$type<OrganizationSettings>(),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Infer types from schema
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
