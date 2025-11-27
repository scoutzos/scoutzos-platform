import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Protected routes
    const protectedRoutes = ['/deals', '/buy-boxes'];
    const isProtectedRoute = protectedRoutes.some((route) =>
        req.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Redirect to deals if logged in and trying to access auth pages
    const authRoutes = ['/login', '/signup'];
    const isAuthRoute = authRoutes.some((route) =>
        req.nextUrl.pathname.startsWith(route)
    );

    if (isAuthRoute && session) {
        return NextResponse.redirect(new URL('/deals', req.url));
    }

    return res;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
