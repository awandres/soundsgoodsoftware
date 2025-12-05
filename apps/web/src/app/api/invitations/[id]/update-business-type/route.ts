import { NextRequest, NextResponse } from "next/server";
import { 
  db, 
  invitations, 
  eq,
  businessTypes,
  getPhotoTagsForBusinessType,
  BusinessType,
  OrganizationSetupData,
} from "@soundsgood/db";

/**
 * POST - Update business type on a demo invitation (before account creation)
 * This allows users to confirm/change their business type during the demo flow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { businessType, token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    if (!businessType || !businessTypes.includes(businessType)) {
      return NextResponse.json(
        { error: "Invalid business type", availableTypes: businessTypes },
        { status: 400 }
      );
    }

    // Find the invitation and verify it's a demo invite
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify token matches
    if (invitation.token !== token) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 403 }
      );
    }

    // Verify it's a demo invitation
    if (!invitation.isDemo) {
      return NextResponse.json(
        { error: "This is not a demo invitation" },
        { status: 400 }
      );
    }

    // Verify invitation is still pending
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation is no longer valid" },
        { status: 400 }
      );
    }

    // Get photo tags for the new business type
    const photoTags = getPhotoTagsForBusinessType(businessType);

    // Update the organization data with the new business type
    const currentOrgData = (invitation.organizationData as OrganizationSetupData) || {};
    const updatedOrgData: OrganizationSetupData = {
      ...currentOrgData,
      businessType: businessType as BusinessType,
      customPhotoTags: photoTags,
    };

    // Update the invitation
    const [updated] = await db
      .update(invitations)
      .set({
        organizationData: updatedOrgData,
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      invitation: {
        id: updated.id,
        organizationData: updated.organizationData,
      },
      photoTags,
    });
  } catch (error) {
    console.error("Failed to update business type:", error);
    return NextResponse.json(
      { error: "Failed to update business type" },
      { status: 500 }
    );
  }
}

