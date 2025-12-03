import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";

/**
 * Debug endpoint to check current session
 */
export async function GET(request: NextRequest) {
  console.log("🔍 DEBUG SESSION: Checking session...");
  
  // Get all cookies
  const allCookies = Array.from(request.cookies.getAll()).map(c => ({
    name: c.name,
    value: c.value.substring(0, 20) + "...",
  }));
  
  console.log("🍪 All cookies:", allCookies);
  
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    console.log("✅ Session found:", session ? {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    } : "NO SESSION");

    return NextResponse.json({
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role,
        organizationId: (session.user as any).organizationId,
      } : null,
      allCookies,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("❌ Session check error:", error);
    return NextResponse.json({
      error: "Failed to check session",
      message: error instanceof Error ? error.message : String(error),
      allCookies,
    }, { status: 500 });
  }
}

