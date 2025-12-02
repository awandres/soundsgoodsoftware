import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db } from "@soundsgood/db/client";
import { photos } from "@soundsgood/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { deleteFromR2 } from "@/lib/r2";

/**
 * GET - List user's photos
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch photos for this user/organization (newest first)
    const userPhotos = await db
      .select()
      .from(photos)
      .where(
        session.user.organizationId
          ? eq(photos.organizationId, session.user.organizationId)
          : eq(photos.uploadedBy, session.user.id)
      )
      .orderBy(desc(photos.createdAt));

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
          session.user.organizationId
            ? eq(photos.organizationId, session.user.organizationId)
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
