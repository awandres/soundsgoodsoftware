import { pgTable, text, timestamp, integer, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { users } from "./users";
import { createId } from "../utils";

// Photo category enum values
export const photoCategories = [
  "uncategorized",
  "trainer",
  "facility",
  "event",
  "marketing",
  "product",
  "team",
  "other",
] as const;
export type PhotoCategory = (typeof photoCategories)[number];

// Photos table (client-uploaded assets)
export const photos = pgTable("photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .references(() => organizations.id),
  uploadedBy: text("uploaded_by")
    .references(() => users.id)
    .notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: text("file_key").notNull(), // R2 object key for deletion
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  category: text("category", { enum: photoCategories }).default("uncategorized"),
  altText: text("alt_text"),
  notes: text("notes"), // User notes about the photo
  tags: json("tags").$type<string[]>().default([]), // SEO tags for alt-text, keywords, etc.
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Photo relations
export const photosRelations = relations(photos, ({ one }) => ({
  organization: one(organizations, {
    fields: [photos.organizationId],
    references: [organizations.id],
  }),
  uploader: one(users, {
    fields: [photos.uploadedBy],
    references: [users.id],
  }),
}));

// Infer types from schema
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

