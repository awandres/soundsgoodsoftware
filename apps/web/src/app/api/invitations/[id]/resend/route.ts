import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db, invitations, organizations, eq } from "@soundsgood/db";
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
 * POST - Resend an invitation with a new token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invitationId } = await params;

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can resend invitations
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the existing invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot resend invitation with status: ${invitation.status}` },
        { status: 400 }
      );
    }

    // Generate new token and expiry
    const newToken = generateSecureToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    // Update invitation with new token
    const [updated] = await db
      .update(invitations)
      .set({
        token: newToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitationId))
      .returning();

    // Get organization if exists
    let organization = null;
    if (invitation.organizationId) {
      [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, invitation.organizationId))
        .limit(1);
    }

    // Build the invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/accept-invite?token=${newToken}`;

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      to: invitation.email,
      inviteeName: invitation.name || undefined,
      inviterName: session.user.name || undefined,
      organizationName: organization?.name,
      inviteLink,
      message: invitation.message || undefined,
      expiresAt: newExpiresAt,
    });

    return NextResponse.json({
      invitation: updated,
      emailSent: emailResult.success,
      inviteLink,
    });
  } catch (error) {
    console.error("Failed to resend invitation:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}


