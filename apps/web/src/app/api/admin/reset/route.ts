import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db, users, accounts, sessions, invitations, eq, not } from "@soundsgood/db";

/**
 * POST - Reset database for testing (keeps admin user, clears everything else)
 * Admin only, dev mode only
 */
export async function POST(request: NextRequest) {
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

    // Only admins can reset
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminUserId = session.user.id;

    // Delete all invitations
    const deletedInvitations = await db.delete(invitations).returning({ id: invitations.id });

    // Delete all sessions except current admin's
    const deletedSessions = await db
      .delete(sessions)
      .where(not(eq(sessions.userId, adminUserId)))
      .returning({ id: sessions.id });

    // Delete all accounts except admin's
    const deletedAccounts = await db
      .delete(accounts)
      .where(not(eq(accounts.userId, adminUserId)))
      .returning({ id: accounts.id });

    // Delete all users except admin
    const deletedUsers = await db
      .delete(users)
      .where(not(eq(users.id, adminUserId)))
      .returning({ id: users.id });

    return NextResponse.json({
      success: true,
      message: "Database reset complete",
      deleted: {
        users: deletedUsers.length,
        accounts: deletedAccounts.length,
        sessions: deletedSessions.length,
        invitations: deletedInvitations.length,
      },
    });
  } catch (error) {
    console.error("Failed to reset database:", error);
    return NextResponse.json(
      { error: "Failed to reset database" },
      { status: 500 }
    );
  }
}


