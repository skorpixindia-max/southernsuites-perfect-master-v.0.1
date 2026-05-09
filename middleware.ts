import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = req.cookies.get('admin_session');

    // Validate session is non-empty and not a trivial value
    if (!session?.value || session.value.trim() === '') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // Block obviously spoofed values that aren't UUID or 'super_admin'
    const val = session.value;
    const isSuperAdmin = val === 'super_admin';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (!isSuperAdmin && !isUUID) {
      // Clear bad cookie and redirect
      const response = NextResponse.redirect(new URL('/admin/login', req.url));
      response.cookies.set('admin_session', '', { httpOnly: true, maxAge: 0 });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};