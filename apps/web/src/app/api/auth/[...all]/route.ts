import { auth } from "@soundsgood/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const handlers = toNextJsHandler(auth);

// Wrap GET with logging
export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log("🔐 AUTH GET:", {
    path,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString(),
  });

  const response = await handlers.GET(request);
  
  console.log("📤 AUTH GET Response:", {
    path,
    status: response.status,
    timestamp: new Date().toISOString(),
  });

  return response;
}

// Wrap POST with logging
export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const clonedRequest = request.clone();
  
  let body;
  try {
    body = await clonedRequest.json();
    // Don't log the actual password, just show it exists
    if (body.password) {
      body = { ...body, password: "[REDACTED]" };
    }
  } catch {
    body = "[Unable to parse body]";
  }

  console.log("🔐 AUTH POST:", {
    path,
    url: request.url,
    body,
    headers: {
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      "user-agent": request.headers.get("user-agent"),
    },
    timestamp: new Date().toISOString(),
  });

  const response = await handlers.POST(request);
  
  const clonedResponse = response.clone();
  let responseBody;
  try {
    responseBody = await clonedResponse.json();
  } catch {
    responseBody = "[Unable to parse response]";
  }

  console.log("📤 AUTH POST Response:", {
    path,
    status: response.status,
    statusText: response.statusText,
    body: responseBody,
    timestamp: new Date().toISOString(),
  });

  return response;
}

