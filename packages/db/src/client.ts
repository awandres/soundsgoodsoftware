import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Create database connection
const sql = neon(process.env.DATABASE_URL!);

// Export the drizzle client with schema
export const db = drizzle(sql, { schema });

// Export types
export type Database = typeof db;

