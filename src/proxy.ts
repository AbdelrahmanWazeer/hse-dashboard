import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];
const PUBLIC_ROUTES = ["/", "/login", "/accept"];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const hasSession = SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));

  if (!hasSession && !isPublic) {
    const url = new URL("/login", req.nextUrl);
    if (pathname !== "/login") url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)",
  ],
};