// Type augmentation for Better Auth to include custom fields
declare module "@soundsgood/auth" {
  export interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      createdAt: Date;
      updatedAt: Date;
      emailVerified: boolean;
      organizationId?: string | null;
      role?: string;
    };
  }
}

export {};

