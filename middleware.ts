import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("[v0] Middleware processing:", request.nextUrl.pathname);

  // Cek apakah user mengakses route admin (kecuali login)
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login")
  ) {
    // Cek token di cookies atau header
    const token =
      request.cookies.get("admin_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    console.log("[v0] Token check for admin route:", !!token);

    // Jika tidak ada token, redirect ke login
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      console.log("[v0] Redirecting to login:", loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }
  }

  // Let the login page handle its own redirect logic

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
