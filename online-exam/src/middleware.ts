import { NextResponse, type NextRequest } from 'next/server';
      import { updateSession } from '@/utils/supabase/middleware';

      export async function middleware(request: NextRequest) {
        const { supabaseResponse, user } = await updateSession(request);

        const pathname = request.nextUrl.pathname;

        // Route protection
        const isAdminRoute = pathname.startsWith('/admin');
        const isStudentRoute = pathname.startsWith('/student');
        const isParentRoute = pathname.startsWith('/parent');

        if (isAdminRoute || isStudentRoute || isParentRoute) {
          // If no user, redirect to login
          if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
          }

          // Read role from user metadata
          const role = user.user_metadata?.role || 'student';

          // Protect routes based on roles
          if (isAdminRoute && role !== 'admin' && role !== 'teacher') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
          }

          if (isStudentRoute && role !== 'student') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
          }

          if (isParentRoute && role !== 'parent') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
          }
        }

        return supabaseResponse;
      }

      export const config = {
        matcher: [
          /*
           * Match all request paths except for the ones starting with:
           * - _next/static (static files)
           * - _next/image (image optimization files)
           * - favicon.ico (favicon file)
           */
          '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
        ],
      };
