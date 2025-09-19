import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard, /login)
  const pathname = request.nextUrl.pathname;

  // Get all cookies and check for any Directus session cookies
  const cookies = request.cookies.getAll();
  const hasDirectusCookie = cookies.some(cookie => 
    cookie.name.includes('directus') || 
    cookie.name.includes('session') ||
    cookie.name.includes('auth') ||
    cookie.name === 'directus_session_token'
  );

  // Debug logging
  console.log('Middleware - Path:', pathname);
  console.log('Middleware - Cookies:', cookies.map(c => c.name));
  console.log('Middleware - Has Directus Cookie:', hasDirectusCookie);

  // Protect API routes (except login API)
  if (pathname.startsWith('/api/') && !pathname.includes('/auth/login')) {
    if (!hasDirectusCookie) {
      console.log('Middleware - API route protected, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized - No valid session found' },
        { status: 401 }
      );
    }
  }

  // If the user is not authenticated and trying to access protected routes
  if (!hasDirectusCookie && pathname.startsWith('/dashboard')) {
    console.log('Middleware - Redirecting to login (no auth cookie)');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Don't redirect from login page in middleware - let the client handle it
  // This prevents redirect loops when cookies are invalid

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
