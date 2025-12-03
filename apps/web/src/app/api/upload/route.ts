import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db } from "@soundsgood/db/client";
import { photos } from "@soundsgood/db/schema";
import { getUploadUrl, getPublicUrl, generateFileKey } from "@/lib/r2";

/**
 * GET: Generate a presigned URL for browser upload
 * 
 * Flow:
 * 1. Client requests presigned URL with file metadata
 * 2. Server generates URL (no file data transferred)
 * 3. Client uploads directly to R2 using the URL
 * 4. Client calls POST to save metadata after successful upload
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    const fileType = searchParams.get("fileType");
    const category = searchParams.get("category");

    if (!fileName || !fileType || !category) {
      return NextResponse.json(
        { error: "Missing fileName, fileType, or category" },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileKey = generateFileKey(
      session.user.id,
      (session.user as any).organizationId || null,
      fileName,
      category
    );

    // Get presigned upload URL
    const uploadUrl = await getUploadUrl(fileKey, fileType);
    const publicUrl = getPublicUrl(fileKey);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      fileKey,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

/**
 * POST: Save photo metadata after successful browser upload
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileKey, fileName, fileUrl, fileSize, mimeType, category, notes, tags, altText } = body;

    if (!fileKey || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save metadata to database
    const [newPhoto] = await db
      .insert(photos)
      .values({
        organizationId: (session.user as any).organizationId || null,
        uploadedBy: session.user.id,
        fileName,
        fileUrl,
        fileKey,
        fileSize,
        mimeType,
        category: category || "uncategorized",
        notes: notes || null,
        tags: tags || [],
        altText: altText || null,
      })
      .returning();

    return NextResponse.json({ photo: newPhoto });
  } catch (error) {
    console.error("Save photo error:", error);
    return NextResponse.json(
      { error: "Failed to save photo metadata" },
      { status: 500 }
    );
  }
}
