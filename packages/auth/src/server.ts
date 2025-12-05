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
    requireEmailVerification: process.env.NODE_ENV === "production", // Enabled in production
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
  
  // Rate limiting for security
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute window
    max: 10, // Max 10 requests per window for auth endpoints
    // Custom limits for specific endpoints
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5, // More strict for login attempts
      },
      "/sign-up/email": {
        window: 60,
        max: 3, // Very strict for sign-ups
      },
      "/forgot-password": {
        window: 300, // 5 minute window
        max: 3, // Only 3 password reset requests per 5 minutes
      },
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

