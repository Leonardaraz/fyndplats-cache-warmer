import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuthDecision } from "@/lib/admin-auth";

// CORS för /api/*. Browser-tillägget och AliExpress-sidor anropar dessa
// endpoints från andra origins; preflight (OPTIONS) måste få Allow-headers
// utan att passera auth-kontrollen i route-handlers.
const ALLOWED_ORIGINS = [
  "chrome-extension://dngdndpjjagghaapnjabannifojbefcp",
  "https://www.aliexpress.com",
  "https://www.aliexpress.us",
  "https://m.aliexpress.com",
  // Headless-storefront — anropar /api/restock-subscribe från produktsidan.
  "https://fyndplats.se",
  "https://www.fyndplats.se",
];

// Extra origins via env (kommaseparerat), t.ex. preview-deployer av headless.
function envOrigins(): string[] {
  return (process.env.STOREFRONT_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (envOrigins().includes(origin)) return true;
  // Tillåt alla chrome-extension://-origins under utveckling (unpacked extension får ny ID per maskin).
  if (origin.startsWith("chrome-extension://")) return true;
  // Headless-preview-deployer på Vercel.
  return /^https:\/\/fyndplats-headless[a-z0-9-]*\.vercel\.app$/.test(origin);
}

export function middleware(req: NextRequest) {
  // /admin-sidorna (+ deras server-actions, som POST:ar till samma path): valfri
  // HTTP Basic Auth på app-nivå. Opt-in via ADMIN_BASIC_USER/ADMIN_BASIC_PASS —
  // av som default (ingen utelåsning; Vercel Deployment Protection är yttre lager
  // tills detta sätts). Påverkar INTE /api/* (tillägget auth:ar med token där).
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const decision = adminAuthDecision(
      req.headers.get("authorization"),
      process.env.ADMIN_BASIC_USER,
      process.env.ADMIN_BASIC_PASS,
    );
    if (decision === "unauthorized") {
      return new NextResponse("Autentisering krävs.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Fyndplats Admin", charset="UTF-8"' },
      });
    }
    return NextResponse.next();
  }

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
  matcher: ["/api/:path*", "/admin", "/admin/:path*"],
};
