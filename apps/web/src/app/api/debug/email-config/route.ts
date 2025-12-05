import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db, users, eq } from "@soundsgood/db";

/**
 * GET - Check email configuration (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Check email configuration
    const resendApiKeySet = !!process.env.RESEND_API_KEY;
    const resendApiKeyPrefix = process.env.RESEND_API_KEY 
      ? process.env.RESEND_API_KEY.substring(0, 10) + "..." 
      : "[NOT SET]";
    
    const emailFrom = process.env.EMAIL_FROM || 
      (process.env.NODE_ENV === "production" 
        ? "SoundsGood Software <noreply@soundsgoodapps.com>"
        : "SoundsGood Software <onboarding@resend.dev>");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const nodeEnv = process.env.NODE_ENV;

    return NextResponse.json({
      status: "ok",
      config: {
        resendApiKeySet,
        resendApiKeyPrefix,
        emailFrom,
        appUrl,
        nodeEnv,
      },
      notes: [
        resendApiKeySet 
          ? "✅ RESEND_API_KEY is set" 
          : "❌ RESEND_API_KEY is NOT set - emails will not send",
        nodeEnv === "production" && emailFrom.includes("soundsgoodapps.com")
          ? "⚠️ Using soundsgoodapps.com domain - make sure it's verified in Resend"
          : "Using Resend test domain",
        `Invite links will point to: ${appUrl}/accept-invite?token=...`,
      ],
    });
  } catch (error) {
    console.error("Email config check error:", error);
    return NextResponse.json(
      { error: "Failed to check email config", details: String(error) },
      { status: 500 }
    );
  }
}

