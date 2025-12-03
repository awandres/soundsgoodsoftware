import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { users } from "./users";
import { createId } from "../utils";

// Document type enum values
export const documentTypes = [
  "contract",
  "roadmap",
  "invoice",
  "proposal",
  "other",
] as const;
export type DocumentType = (typeof documentTypes)[number];

// Documents table
export const documents = pgTable("documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: documentTypes }).default("other"),
  fileUrl: text("file_url").notNull(),
  fileKey: text("file_key"), // R2 object key for deletion
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  version: integer("version").default(1),
  uploadedBy: text("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Document relations
export const documentsRelations = relations(documents, ({ one }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

// Infer types from schema
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

