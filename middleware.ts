import { NextRequest, NextResponse } from "next/server";

const SESSION_TOKEN = "framewatch_auth_token_v1";
const PUBLIC_ROUTES = ["/login", "/api/auth/login"];

// Private (local network) IP ranges
const LOCAL_IP_PREFIXES = [
  "192.168.",
  "10.",
  "172.16.", "172.17.", "172.18.", "172.19.", "172.20.",
  "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
  "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
  "::1",
  "127.",
];

function isLocalRequest(request: NextRequest): boolean {
  // Allow localhost by hostname — covers direct dev server access
  const hostname = request.nextUrl.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return true;
  }

  // Check IP headers for LAN devices accessing via network IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "";
  return LOCAL_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Auto-allow anyone on the local network (no login required)
  if (isLocalRequest(request)) {
    return NextResponse.next();
  }

  // Check for session cookie (external/Vercel users)
  const sessionCookie = request.cookies.get(SESSION_TOKEN);

  // If no session, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply middleware to all routes except static files and APIs
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
