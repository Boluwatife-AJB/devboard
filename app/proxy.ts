import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { getRequestOrgRole } from "@/lib/auth/request-org-role";
import { canAccessRoute } from "@/lib/rbac/route-access";

const PUBLIC_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/invite",
  "/accept-invite",
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function withCacheHeaders(request: NextRequest, response: NextResponse) {
  const rscHeader = request.headers.get("rsc");
  const nextRouterStateTree = request.headers.get("next-router-state-tree");

  response.headers.set(
    "Vary",
    "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept",
  );

  if (rscHeader || nextRouterStateTree) {
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  } else {
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    response.headers.set(
      "CDN-Cache-Control",
      "max-age=60, stale-while-revalidate=86400",
    );
  }

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.includes("/api/") ||
    pathname.includes("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return withCacheHeaders(request, NextResponse.next());
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE);
  if (!token) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const orgRole = getRequestOrgRole(request);
  if (!canAccessRoute(orgRole, pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return withCacheHeaders(request, NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
