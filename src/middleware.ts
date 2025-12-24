import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/forms', '/workflows', '/explore', '/static'];
const AUTH_COOKIE_NAME = 'postpipe_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has(AUTH_COOKIE_NAME);

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/login') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard/workflows', request.url));
  }

  // Legacy route redirects
  if (pathname === '/forms') {
    return NextResponse.redirect(new URL('/dashboard/forms', request.url));
  }
  if (pathname === '/workflows') {
    return NextResponse.redirect(new URL('/dashboard/workflows', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/forms', '/workflows', '/explore', '/static'],
}
