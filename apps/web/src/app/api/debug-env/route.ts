import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    R2_ENDPOINT: process.env.R2_ENDPOINT || "NOT SET",
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "NOT SET",
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? "SET (hidden)" : "NOT SET",
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? "SET (hidden)" : "NOT SET",
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || "NOT SET",
  });
}

