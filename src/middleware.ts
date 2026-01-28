import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/privacy",
  "/terms",
  "/refund",
  "/contact",
];

// Routes to skip middleware entirely
const SKIP_MIDDLEWARE_PREFIXES = [
  "/_next",
  "/api",
  "/auth",
  "/public",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

function shouldSkipMiddleware(pathname: string): boolean {
  return SKIP_MIDDLEWARE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function createRedirectResponse(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and auth routes
  if (shouldSkipMiddleware(pathname) || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createRedirectResponse(request, "/auth/signin");
  }

  // Allow authenticated users to access all pages
  // Let individual pages handle their own onboarding checks
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
