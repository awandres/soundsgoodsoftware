import { NextRequest, NextResponse } from "next/server";
import { 
  db, 
  organizations, 
  eq,
  businessTypes,
  getPhotoTagsForBusinessType,
  BusinessType,
} from "@soundsgood/db";

// Only allow in development
const isDev = process.env.NODE_ENV === "development";

/**
 * GET - Get current demo business type and available options
 */
export async function GET(_request: NextRequest) {
  if (!isDev) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    // Find the demo organization
    const [demoOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "demo-business"))
      .limit(1);

    if (!demoOrg) {
      return NextResponse.json({ 
        error: "Demo organization not found. Run seed script first.",
        currentType: null,
        availableTypes: businessTypes,
      }, { status: 404 });
    }

    return NextResponse.json({
      currentType: demoOrg.businessType,
      organizationName: demoOrg.name,
      photoTags: demoOrg.settings?.photoTags || [],
      availableTypes: businessTypes,
    });
  } catch (error) {
    console.error("Failed to get demo business type:", error);
    return NextResponse.json(
      { error: "Failed to get demo business type" },
      { status: 500 }
    );
  }
}

/**
 * POST - Change the demo organization's business type
 */
export async function POST(request: NextRequest) {
  if (!isDev) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { businessType } = body;

    // Validate business type
    if (!businessType || !businessTypes.includes(businessType)) {
      return NextResponse.json(
        { 
          error: "Invalid business type",
          availableTypes: businessTypes,
        },
        { status: 400 }
      );
    }

    // Find the demo organization
    const [demoOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "demo-business"))
      .limit(1);

    if (!demoOrg) {
      return NextResponse.json(
        { error: "Demo organization not found. Run seed script first." },
        { status: 404 }
      );
    }

    // Get photo tags for the new business type
    const photoTags = getPhotoTagsForBusinessType(businessType);

    // Update the organization
    const [updated] = await db
      .update(organizations)
      .set({
        businessType: businessType as BusinessType,
        settings: {
          ...demoOrg.settings,
          photoTags,
        },
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, demoOrg.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: updated.id,
        name: updated.name,
        businessType: updated.businessType,
        photoTags,
      },
    });
  } catch (error) {
    console.error("Failed to update demo business type:", error);
    return NextResponse.json(
      { error: "Failed to update demo business type" },
      { status: 500 }
    );
  }
}

