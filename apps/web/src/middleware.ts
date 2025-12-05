import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/photos", "/documents", "/settings", "/clients", "/project-status"];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get ALL cookies for debugging
  const allCookies = Array.from(request.cookies.getAll()).map(c => c.name);
  
  // Try multiple possible cookie names Better Auth might use
  // In production (HTTPS), Better Auth uses __Secure- prefix
  const sessionToken = 
    request.cookies.get("__Secure-better-auth.session_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("auth.session_token")?.value ||
    request.cookies.get("session_token")?.value ||
    request.cookies.get("better_auth_session")?.value;
  
  const isAuthenticated = !!sessionToken;

  // Debug logging
  console.log("🛡️ MIDDLEWARE:", {
    pathname,
    isAuthenticated,
    sessionToken: sessionToken ? `${sessionToken.substring(0, 20)}...` : "NONE",
    cookies: allCookies,
    timestamp: new Date().toISOString(),
  });

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if this is an auth route (login, etc.)
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    console.log("❌ MIDDLEWARE: Unauthenticated, redirecting to login");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isAuthenticated) {
    console.log("✅ MIDDLEWARE: Already authenticated, redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  console.log("✅ MIDDLEWARE: Allowing request to proceed");
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

