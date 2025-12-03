/**
 * Type helpers for Better Auth session with custom fields
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  organizationId?: string | null;
  role?: string;
}

/**
 * Helper to safely access organizationId from session user
 * TypeScript doesn't infer the additional fields from Better Auth config
 */
export function getOrgId(user: any): string | null {
  return (user as AuthUser).organizationId || null;
}

