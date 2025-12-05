import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { 
  db, 
  documents, 
  eq, 
  and, 
  desc, 
  or,
  defaultDocumentVisibility,
  DocumentType,
} from "@soundsgood/db";
import { deleteFromR2, getUploadUrl, getPublicUrl, generateFileKey } from "@/lib/r2";

/**
 * GET - List user's documents (respects visibility based on accountType)
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

    // Check if requesting a presigned URL for upload
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    const fileType = searchParams.get("fileType");

    // If fileName and fileType provided, generate presigned upload URL
    if (fileName && fileType) {
      const fileKey = generateFileKey(
        session.user.id,
        user.organizationId || null,
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

    // Build base query
    let userDocuments;
    
    // Admins and staff see all documents
    if (user.role === "admin" || user.role === "staff") {
      userDocuments = await db
        .select()
        .from(documents)
        .where(
          user.organizationId
            ? eq(documents.organizationId, user.organizationId)
            : eq(documents.uploadedBy, session.user.id)
        )
        .orderBy(desc(documents.createdAt));
    } 
    // Team Leads see all documents in their org
    else if (user.accountType === "team_lead") {
      userDocuments = await db
        .select()
        .from(documents)
        .where(
          user.organizationId
            ? eq(documents.organizationId, user.organizationId)
            : eq(documents.uploadedBy, session.user.id)
        )
        .orderBy(desc(documents.createdAt));
    }
    // Team Members only see documents with visibility = "all"
    else {
      userDocuments = await db
        .select()
        .from(documents)
        .where(
          and(
            user.organizationId
              ? eq(documents.organizationId, user.organizationId)
              : eq(documents.uploadedBy, session.user.id),
            or(
              eq(documents.visibility, "all"),
              // Also include documents without visibility set (legacy)
              // that aren't contracts, invoices, or proposals
              and(
                eq(documents.visibility, null as any),
                // This is a simplified check - in production you'd filter more precisely
              )
            )
          )
        )
        .orderBy(desc(documents.createdAt));
      
      // Additional filter for legacy documents without visibility
      userDocuments = userDocuments.filter(doc => {
        // If visibility is explicitly set, respect it
        if (doc.visibility) {
          return doc.visibility === "all";
        }
        // For legacy docs without visibility, check document type
        const defaultVis = defaultDocumentVisibility[doc.type as DocumentType] || "all";
        return defaultVis === "all";
      });
    }

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

    const user = session.user as any;
    const body = await request.json();
    const { fileKey, name, fileUrl, fileSize, mimeType, type, description, visibility } = body;

    if (!fileKey || !name || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine visibility - use provided value or default based on type
    const docType = (type || "other") as DocumentType;
    const docVisibility = visibility || defaultDocumentVisibility[docType] || "all";

    // Save metadata to database
    const [newDocument] = await db
      .insert(documents)
      .values({
        organizationId: user.organizationId || null,
        uploadedBy: session.user.id,
        name,
        fileUrl,
        fileKey,
        fileSize,
        mimeType,
        type: docType,
        description: description || null,
        visibility: docVisibility,
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

    const user = session.user as any;
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
          user.organizationId
            ? eq(documents.organizationId, user.organizationId)
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

    // Only team leads/admins can delete owner_only documents
    if (document.visibility === "owner_only") {
      if (user.role !== "admin" && user.role !== "staff" && user.accountType !== "team_lead") {
        return NextResponse.json(
          { error: "You don't have permission to delete this document" },
          { status: 403 }
        );
      }
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
