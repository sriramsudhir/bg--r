import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin email whitelist
const ADMIN_EMAILS = ['sriramsudhir11@gmail.com'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname } = req.nextUrl;

  // Verify session
  const { data: { session } } = await supabase.auth.getSession();

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Check if user email is in admin whitelist
    if (!ADMIN_EMAILS.includes(session.user.email || '')) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    try {
      // Verify admin role in database
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', session.user.id)
        .single();

      if (roleError || !roleData || roleData.role !== 'ADMIN' || !roleData.is_active) {
        // If no role record exists or role is not admin, create/update it
        const { error: upsertError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: session.user.id,
            email: session.user.email,
            role: 'ADMIN',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          console.error('Error upserting role:', upsertError);
          return NextResponse.redirect(new URL('/auth/login', req.url));
        }
      }
    } catch (error) {
      console.error('Error verifying admin role:', error);
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  // Add cache control headers
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  
  return response;
}

export const config = {
  matcher: ['/admin/:path*']
};