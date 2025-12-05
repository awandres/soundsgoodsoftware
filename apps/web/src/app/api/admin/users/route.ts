import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db, users, accounts, sessions, invitations, eq, desc } from "@soundsgood/db";

/**
 * GET - List all users (admin only, dev mode only)
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

    // Only admins can list users
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all users
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a user (admin only, dev mode only)
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

    // Only admins can delete users
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Don't allow deleting yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Delete related records first (due to foreign key constraints)
    // Delete sessions
    await db.delete(sessions).where(eq(sessions.userId, userId));
    
    // Delete accounts
    await db.delete(accounts).where(eq(accounts.userId, userId));
    
    // Delete invitations sent by this user (optional - could also just nullify)
    await db.delete(invitations).where(eq(invitations.invitedBy, userId));

    // Delete the user
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id, email: users.email });

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${deletedUser.email} deleted successfully` 
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}


