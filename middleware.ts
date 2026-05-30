import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CORS för /api/*. Browser-tillägget och AliExpress-sidor anropar dessa
// endpoints från andra origins; preflight (OPTIONS) måste få Allow-headers
// utan att passera auth-kontrollen i route-handlers.
const ALLOWED_ORIGINS = [
  "chrome-extension://dngdndpjjagghaapnjabannifojbefcp",
  "https://www.aliexpress.com",
  "https://www.aliexpress.us",
  "https://m.aliexpress.com",
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Tillåt alla chrome-extension://-origins under utveckling (unpacked extension får ny ID per maskin).
  return origin.startsWith("chrome-extension://");
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = isAllowedOrigin(origin);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowed ? origin : "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-fyndplats-token",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const res = NextResponse.next();
  if (allowed) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
