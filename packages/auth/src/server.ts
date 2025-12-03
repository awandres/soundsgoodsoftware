import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@soundsgood/db";
import * as schema from "@soundsgood/db";

/**
 * Better Auth server configuration
 * This is the main auth instance used on the server
 */
// Strip trailing slashes from URLs
const stripTrailingSlash = (url: string) => url.replace(/\/$/, "");

export const auth = betterAuth({
  // Base URL for the application
  baseURL: stripTrailingSlash(
    process.env.BETTER_AUTH_URL || 
    process.env.NEXT_PUBLIC_APP_URL || 
    "http://localhost:3000"
  ),
  
  // Use Drizzle adapter with our database
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  
  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  
  // User fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "client",
      },
      organizationId: {
        type: "string",
        required: false,
      },
    },
  },
  
  // Trust proxy headers (required for Vercel/production)
  trustedOrigins: process.env.BETTER_AUTH_URL 
    ? [process.env.BETTER_AUTH_URL]
    : [],
  
  // Advanced configuration
  advanced: {
    generateId: () => crypto.randomUUID() as any,
    useSecureCookies: process.env.NODE_ENV === "production",
    cookieSameSite: "lax",
    crossSubDomainCookies: {
      enabled: false,
    },
  } as any,
});

// Export types
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

