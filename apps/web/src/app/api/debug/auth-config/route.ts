import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint to check auth configuration
 * Shows environment variables and configuration (without sensitive data)
 */
export async function GET(request: NextRequest) {
  const config = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    host: request.headers.get("host"),
    origin: request.headers.get("origin"),
    
    // Auth configuration (redact sensitive values)
    betterAuthUrl: process.env.BETTER_AUTH_URL || "[NOT SET]",
    betterAuthSecretSet: !!process.env.BETTER_AUTH_SECRET,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || "[NOT SET]",
    
    // Database
    databaseUrlSet: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "..." || "[NOT SET]",
    
    // R2
    r2AccountId: process.env.R2_ACCOUNT_ID?.substring(0, 8) + "..." || "[NOT SET]",
    r2BucketName: process.env.R2_BUCKET_NAME || "[NOT SET]",
    r2PublicUrl: process.env.R2_PUBLIC_URL || "[NOT SET]",
    
    // Request info
    requestUrl: request.url,
    requestHeaders: {
      host: request.headers.get("host"),
      "x-forwarded-host": request.headers.get("x-forwarded-host"),
      "x-forwarded-proto": request.headers.get("x-forwarded-proto"),
    },
  };

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}



