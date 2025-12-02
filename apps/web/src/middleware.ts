import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/photos", "/documents", "/settings"];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from Better Auth cookie
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;
  const isAuthenticated = !!sessionToken;

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
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

