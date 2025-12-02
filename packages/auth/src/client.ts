"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for React components
 * Use this in client components for auth operations
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export commonly used hooks and functions
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

