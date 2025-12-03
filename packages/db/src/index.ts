// @status: complete
// @exports: db client, all schemas, types, and utilities
// Database package main entry point

// Re-export client
export { db, type Database } from "./client";

// Re-export all schemas
export * from "./schema";

// Re-export utilities
export { createId, slugify } from "./utils";

// Re-export commonly used drizzle-orm functions
export { eq, and, or, not, desc, asc, sql, gte, lte, like, ilike } from "drizzle-orm";

