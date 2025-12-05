import { NextRequest, NextResponse } from "next/server";
import { 
  db, 
  invitations, 
  users, 
  accounts, 
  organizations,
  projects,
  eq, 
  and,
  slugify,
  createId,
  OrganizationSetupData,
  getPhotoTagsForBusinessType,
  AccountType,
} from "@soundsgood/db";
import { sendWelcomeEmail } from "@/lib/email";
import { hashPassword } from "better-auth/crypto";

/**
 * GET - Validate an invitation token and return invitation details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation link", code: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "This invitation has already been used", code: "ALREADY_ACCEPTED" },
        { status: 400 }
      );
    }

    // Check if revoked
    if (invitation.status === "revoked") {
      return NextResponse.json(
        { error: "This invitation has been revoked", code: "REVOKED" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > new Date(invitation.expiresAt)) {
      // Update status to expired
      await db
        .update(invitations)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(invitations.id, invitation.id));

      return NextResponse.json(
        { error: "This invitation has expired", code: "EXPIRED" },
        { status: 400 }
      );
    }

    // Return invitation details (excluding sensitive token)
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        organizationId: invitation.organizationId,
        organizationData: invitation.organizationData,
        role: invitation.role,
        accountType: invitation.accountType,
        isDemo: invitation.isDemo,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Failed to validate invitation:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation" },
      { status: 500 }
    );
  }
}

/**
 * Create a unique slug for an organization
 */
async function createUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName);
  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (true) {
    const [existing] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (!existing) break;
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * POST - Accept an invitation and create the user account
 * Also creates organization and project if organizationData is present
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, name } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find and validate the invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.token, token),
          eq(invitations.status, "pending")
        )
      )
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > new Date(invitation.expiresAt)) {
      await db
        .update(invitations)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(invitations.id, invitation.id));

      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Double-check email isn't already taken
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email))
      .limit(1);

    if (existingUser) {
      // Mark invitation as accepted since user exists
      await db
        .update(invitations)
        .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
        .where(eq(invitations.id, invitation.id));

      return NextResponse.json(
        { error: "An account with this email already exists. Please log in instead." },
        { status: 400 }
      );
    }

    // Determine organization ID
    let organizationId = invitation.organizationId;
    let createdOrganization = null;
    let createdProject = null;
    let assignedProject = null;

    // If projectId is set, get the project's organization
    if (invitation.projectId && !organizationId) {
      const [existingProject] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, invitation.projectId))
        .limit(1);

      if (existingProject) {
        assignedProject = existingProject;
        // Use the project's organization
        if (existingProject.organizationId) {
          organizationId = existingProject.organizationId;
        }
      }
    }

    // If organizationData is present (and we don't already have an org), create the organization
    const orgData = invitation.organizationData as OrganizationSetupData | null;
    if (orgData && !organizationId) {
      // Create unique slug
      const slug = await createUniqueSlug(orgData.businessName);

      // Determine photo tags based on business type
      const photoTags = orgData.customPhotoTags?.length 
        ? orgData.customPhotoTags 
        : getPhotoTagsForBusinessType(orgData.businessType || null);

      // Create the organization
      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: orgData.businessName,
          slug,
          businessType: orgData.businessType || null,
          contactName: orgData.contactName || name || invitation.name || null,
          contactEmail: invitation.email,
          status: "active",
          settings: {
            logo: orgData.logoUrl || undefined,
            logoKey: orgData.logoKey || undefined,
            brandColors: orgData.brandColors || undefined,
            photoTags,
          },
        })
        .returning();

      organizationId = newOrg.id;
      createdOrganization = newOrg;

      // Create a default project for the new client (only if no project was pre-assigned)
      if (!assignedProject) {
        const projectName = `${orgData.businessName} Website`;
        const [newProject] = await db
          .insert(projects)
          .values({
            organizationId: newOrg.id,
            name: projectName,
            description: `Web development project for ${orgData.businessName}`,
            clientName: orgData.businessName,
            status: "planning",
          })
          .returning();

        createdProject = newProject;
      }
    }

    // Hash the password using BetterAuth's scrypt-based hasher
    const passwordHash = await hashPassword(password);

    // Create the user
    const result = await db
      .insert(users)
      .values({
        email: invitation.email,
        name: name || invitation.name,
        role: invitation.role as "admin" | "staff" | "client",
        accountType: (invitation.accountType as AccountType) || "team_member",
        organizationId,
        emailVerified: true, // Email is verified by accepting invitation
      })
      .returning();

    const newUser = result[0];
    if (!newUser) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Create the credential account for Better Auth
    // accountId must be the email for credential providers
    await db.insert(accounts).values({
      userId: newUser.id,
      accountId: invitation.email,
      providerId: "credential",
      password: passwordHash,
    });

    // Mark invitation as accepted
    await db
      .update(invitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitation.id));

    // Send welcome email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendWelcomeEmail({
      to: newUser.email,
      name: newUser.name || undefined,
      loginUrl: `${baseUrl}/login`,
    });

    // Return success with credentials for auto-login
    // The client will use these to sign in via BetterAuth
    return NextResponse.json({
      success: true,
      autoLogin: {
        email: newUser.email,
        password: password, // Send back for immediate sign-in
      },
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        accountType: newUser.accountType,
      },
      organization: createdOrganization,
      project: createdProject || assignedProject,
    });
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
