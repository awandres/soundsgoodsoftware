import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db } from "@soundsgood/db/client";
import { documents } from "@soundsgood/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { deleteFromR2, getUploadUrl, getPublicUrl, generateFileKey } from "@/lib/r2";

/**
 * GET - List user's documents
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if requesting a presigned URL for upload
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    const fileType = searchParams.get("fileType");

    // If fileName and fileType provided, generate presigned upload URL
    if (fileName && fileType) {
      const fileKey = generateFileKey(
        session.user.id,
        session.user.organizationId || null,
        fileName,
        "documents"
      );

      const uploadUrl = await getUploadUrl(fileKey, fileType);
      const publicUrl = getPublicUrl(fileKey);

      return NextResponse.json({
        uploadUrl,
        publicUrl,
        fileKey,
      });
    }

    // Otherwise, fetch documents for this user/organization (newest first)
    const userDocuments = await db
      .select()
      .from(documents)
      .where(
        session.user.organizationId
          ? eq(documents.organizationId, session.user.organizationId)
          : eq(documents.uploadedBy, session.user.id)
      )
      .orderBy(desc(documents.createdAt));

    return NextResponse.json({ documents: userDocuments });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * POST - Save document metadata after successful upload
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
    const { fileKey, name, fileUrl, fileSize, mimeType, type, description } = body;

    if (!fileKey || !name || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save metadata to database
    const [newDocument] = await db
      .insert(documents)
      .values({
        organizationId: session.user.organizationId || null,
        uploadedBy: session.user.id,
        name,
        fileUrl,
        fileKey,
        fileSize,
        mimeType,
        type: type || "other",
        description: description || null,
      })
      .returning();

    return NextResponse.json({ document: newDocument });
  } catch (error) {
    console.error("Save document error:", error);
    return NextResponse.json(
      { error: "Failed to save document metadata" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a document from database and R2 storage
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
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID required" },
        { status: 400 }
      );
    }

    // First, get the document to find its R2 key
    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          session.user.organizationId
            ? eq(documents.organizationId, session.user.organizationId)
            : eq(documents.uploadedBy, session.user.id)
        )
      )
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete from R2 storage
    if (document.fileKey) {
      try {
        await deleteFromR2(document.fileKey);
      } catch (r2Error) {
        console.error("Failed to delete from R2:", r2Error);
        // Continue with database deletion even if R2 delete fails
      }
    }

    // Delete from database
    await db
      .delete(documents)
      .where(eq(documents.id, documentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

