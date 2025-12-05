import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db, invitations, desc, eq } from "@soundsgood/db";

/**
 * GET - List all invitations (admin only, dev mode only)
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

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

    // Fetch all invitations
    const allInvitations = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        name: invitations.name,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
      })
      .from(invitations)
      .orderBy(desc(invitations.createdAt));

    return NextResponse.json({ invitations: allInvitations });
  } catch (error) {
    console.error("Failed to fetch invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete all invitations or a specific one (admin only, dev mode only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete invitations
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get("clearAll") === "true";
    const invitationId = searchParams.get("id");

    if (clearAll) {
      // Delete all invitations
      const result = await db.delete(invitations).returning({ id: invitations.id });
      return NextResponse.json({ 
        success: true, 
        message: `Cleared ${result.length} invitation(s)`,
        count: result.length
      });
    }

    if (invitationId) {
      // Delete specific invitation
      const [deleted] = await db
        .delete(invitations)
        .where(eq(invitations.id, invitationId))
        .returning({ id: invitations.id, email: invitations.email });

      if (!deleted) {
        return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Deleted invitation for ${deleted.email}` 
      });
    }

    return NextResponse.json({ error: "Specify id or clearAll=true" }, { status: 400 });
  } catch (error) {
    console.error("Failed to delete invitations:", error);
    return NextResponse.json(
      { error: "Failed to delete invitations" },
      { status: 500 }
    );
  }
}

