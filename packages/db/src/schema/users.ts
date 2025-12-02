import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { createId } from "../utils";

// User role enum values
export const userRoles = ["admin", "staff", "client"] as const;
export type UserRole = (typeof userRoles)[number];

// Users table
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  role: text("role", { enum: userRoles }).default("client").notNull(),
  organizationId: text("organization_id").references(() => organizations.id),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
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

