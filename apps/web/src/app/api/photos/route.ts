import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db, photos, eq, and, desc, or } from "@soundsgood/db";
import { deleteFromR2 } from "@/lib/r2";

/**
 * GET - List user's photos (respects visibility based on accountType)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    let userPhotos;

    // Admins and staff see all photos
    if (user.role === "admin" || user.role === "staff") {
      userPhotos = await db
        .select()
        .from(photos)
        .where(
          user.organizationId
            ? eq(photos.organizationId, user.organizationId)
            : eq(photos.uploadedBy, session.user.id)
        )
        .orderBy(desc(photos.createdAt));
    }
    // Team Leads see all photos in their org
    else if (user.accountType === "team_lead") {
      userPhotos = await db
        .select()
        .from(photos)
        .where(
          user.organizationId
            ? eq(photos.organizationId, user.organizationId)
            : eq(photos.uploadedBy, session.user.id)
        )
        .orderBy(desc(photos.createdAt));
    }
    // Team Members only see photos with visibility = "all" (or null for legacy)
    else {
      userPhotos = await db
        .select()
        .from(photos)
        .where(
          and(
            user.organizationId
              ? eq(photos.organizationId, user.organizationId)
              : eq(photos.uploadedBy, session.user.id),
            or(
              eq(photos.visibility, "all"),
              eq(photos.visibility, null as any) // Legacy photos without visibility
            )
          )
        )
        .orderBy(desc(photos.createdAt));
    }

    return NextResponse.json({ photos: userPhotos });
  } catch (error) {
    console.error("Failed to fetch photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a photo from database and R2 storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("id");

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID required" },
        { status: 400 }
      );
    }

    // First, get the photo to find its R2 key
    const [photo] = await db
      .select()
      .from(photos)
      .where(
        and(
          eq(photos.id, photoId),
          user.organizationId
            ? eq(photos.organizationId, user.organizationId)
            : eq(photos.uploadedBy, session.user.id)
        )
      )
      .limit(1);

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    // Only team leads/admins can delete owner_only photos
    if (photo.visibility === "owner_only") {
      if (user.role !== "admin" && user.role !== "staff" && user.accountType !== "team_lead") {
        return NextResponse.json(
          { error: "You don't have permission to delete this photo" },
          { status: 403 }
        );
      }
    }

    // Delete from R2 storage
    if (photo.fileKey) {
      try {
        await deleteFromR2(photo.fileKey);
      } catch (r2Error) {
        console.error("Failed to delete from R2:", r2Error);
        // Continue with database deletion even if R2 delete fails
      }
    }

    // Delete from database
    await db
      .delete(photos)
      .where(eq(photos.id, photoId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
