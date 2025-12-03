import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";

/**
 * Dev-only endpoint to check/toggle admin mode
 * Only works on localhost
 */
export async function GET(request: NextRequest) {
  // Only allow on localhost
  const host = request.headers.get("host") || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  
  if (!isLocalhost) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Check if dev admin cookie is set
  const devAdminCookie = request.cookies.get("dev-admin-mode");
  const isDevAdmin = devAdminCookie?.value === "true";

  return NextResponse.json({
    isDevAdmin,
    userId: session.user.id,
    userName: session.user.name,
    message: isDevAdmin 
      ? "Dev admin mode is ENABLED" 
      : "Dev admin mode is disabled. POST to this endpoint to enable.",
  });
}

export async function POST(request: NextRequest) {
  // Only allow on localhost
  const host = request.headers.get("host") || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  
  if (!isLocalhost) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Toggle dev admin mode
  const devAdminCookie = request.cookies.get("dev-admin-mode");
  const currentState = devAdminCookie?.value === "true";
  const newState = !currentState;

  const response = NextResponse.json({
    isDevAdmin: newState,
    message: newState 
      ? "✅ Dev admin mode ENABLED - you now have admin access" 
      : "❌ Dev admin mode DISABLED",
  });

  // Set or clear the cookie
  if (newState) {
    response.cookies.set("dev-admin-mode", "true", {
      httpOnly: false, // Allow JS access for the dev tool
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
  } else {
    response.cookies.delete("dev-admin-mode");
  }

  return response;
}

