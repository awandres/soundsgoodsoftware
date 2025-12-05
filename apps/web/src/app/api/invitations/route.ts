import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { 
  db, 
  invitations, 
  users, 
  organizations,
  projects, 
  eq, 
  and, 
  desc,
  OrganizationSetupData,
  AccountType,
} from "@soundsgood/db";
import { sendInvitationEmail } from "@/lib/email";
import crypto from "crypto";

// Invitation expiry time (7 days)
const INVITATION_EXPIRY_DAYS = 7;

/**
 * Generate a secure random token for invitations
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * GET - List all invitations (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can list invitations
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all invitations with organization data
    const allInvitations = await db
      .select({
        invitation: invitations,
        organization: organizations,
      })
      .from(invitations)
      .leftJoin(organizations, eq(invitations.organizationId, organizations.id))
      .orderBy(desc(invitations.createdAt));

    return NextResponse.json({
      invitations: allInvitations.map((row) => ({
        ...row.invitation,
        organization: row.organization,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new invitation and send email
 * 
 * Body parameters:
 * - email: string (required)
 * - name: string (optional)
 * - organizationId: string (optional - existing org)
 * - organizationData: OrganizationSetupData (optional - for creating new org)
 * - role: string (default: "client")
 * - accountType: "owner" | "member" (default: "member")
 * - message: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create invitations
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      email, 
      name, 
      organizationId, 
      organizationData,
      projectId,         // Existing project to assign
      projectName,       // New project name to create
      brandColors: brandColorsInput,  // Brand colors to update (for existing org/project)
      message, 
      role = "client",
      accountType = "team_member",
      isDemo = false,
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate accountType
    if (accountType && !["team_lead", "team_member"].includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid account type. Must be 'team_lead' or 'team_member'" },
        { status: 400 }
      );
    }

    // Check if email is already a user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const [existingInvitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email.toLowerCase()),
          eq(invitations.status, "pending")
        )
      )
      .limit(1);

    if (existingInvitation) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email" },
        { status: 400 }
      );
    }

    // If organizationId provided, verify it exists
    let organization = null;
    if (organizationId) {
      [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (!organization) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 400 }
        );
      }
    }

    // If projectId provided, verify it exists and get its organization
    let project = null;
    let finalProjectId = projectId || null;
    let finalOrganizationId = organizationId || null;
    
    if (projectId) {
      [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 400 }
        );
      }

      // If project has an organization and no organizationId was explicitly provided,
      // inherit the organization from the project
      if (project.organizationId && !organizationId) {
        finalOrganizationId = project.organizationId;
        // Also fetch the organization for email branding
        [organization] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, project.organizationId))
          .limit(1);
      }
    }

    // If brandColors are provided and we have an existing organization, update its settings
    if (brandColorsInput && finalOrganizationId && organization) {
      const currentSettings = (organization.settings as Record<string, unknown>) || {};
      const updatedSettings = {
        ...currentSettings,
        brandColors: brandColorsInput,
      };
      
      await db
        .update(organizations)
        .set({ 
          settings: updatedSettings,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, finalOrganizationId));

      // Update the organization object so email uses new colors
      organization = { 
        ...organization, 
        settings: updatedSettings as typeof organization.settings 
      };
    }

    // Validate organizationData if provided (for creating new org on accept)
    // Only validate if we don't already have an organization (either explicit or from project)
    let validatedOrgData: OrganizationSetupData | null = null;
    if (organizationData && !finalOrganizationId) {
      if (!organizationData.businessName) {
        return NextResponse.json(
          { error: "Business name is required when creating a new organization" },
          { status: 400 }
        );
      }
      validatedOrgData = {
        businessName: organizationData.businessName,
        businessType: organizationData.businessType || undefined,
        contactName: organizationData.contactName || undefined,
        logoUrl: organizationData.logoUrl || undefined,
        logoKey: organizationData.logoKey || undefined,
        brandColors: organizationData.brandColors || undefined,
        customPhotoTags: organizationData.customPhotoTags || undefined,
      };
    }

    // Generate secure token and expiry
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    // Create invitation
    const [invitation] = await db
      .insert(invitations)
      .values({
        email: email.toLowerCase(),
        name,
        token,
        organizationId: finalOrganizationId,
        projectId: finalProjectId,
        organizationData: validatedOrgData,
        role,
        accountType: accountType as AccountType,
        isDemo: Boolean(isDemo),
        invitedBy: session.user.id,
        message,
        expiresAt,
      })
      .returning();

    // Build the invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/accept-invite?token=${token}`;

    // Determine organization details for email
    const orgNameForEmail = organization?.name || validatedOrgData?.businessName;
    
    // Get brand colors from organization or organizationData
    const brandColors = organization?.settings?.brandColors || validatedOrgData?.brandColors;
    const logoUrl = organization?.settings?.logo || validatedOrgData?.logoUrl;

    // Send invitation email with brand colors
    const emailResult = await sendInvitationEmail({
      to: email,
      inviteeName: name,
      inviterName: session.user.name || undefined,
      organizationName: orgNameForEmail,
      inviteLink,
      message,
      expiresAt,
      brandColors,
      logoUrl,
    });

    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error);
      // Still return success - invitation is created, email can be resent
    }

    return NextResponse.json({
      invitation,
      emailSent: emailResult.success,
      inviteLink, // Include for development/testing
    });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Revoke an invitation
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can revoke invitations
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("id");

    if (!invitationId) {
      return NextResponse.json(
        { error: "Invitation ID required" },
        { status: 400 }
      );
    }

    // Update invitation status to revoked
    const [updated] = await db
      .update(invitations)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitationId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, invitation: updated });
  } catch (error) {
    console.error("Failed to revoke invitation:", error);
    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}
