// proxy.ts
import {auth} from "@/auth";
import {NextResponse} from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup";
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/todos");

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/todos", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/todos/:path*", "/login", "/signup", "/admin/:path*"],
};
