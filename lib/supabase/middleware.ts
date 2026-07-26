import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const authRoutePrefixes = ['/login', '/signup', '/forgot-password', '/verify'];
// '/discover' (the browse page) requires login; '/discover/[proSlug]' does not
// — public pro profiles need to be crawlable and directly shareable
// (MVP_ARCHITECTURE.md Section 9), so it's deliberately excluded from the
// prefix match below rather than included via '/discover'.
const protectedRouteExact = ['/discover'];
const protectedRoutePrefixes = ['/dashboard', '/projects', '/matches', '/messages', '/profile', '/settings'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // This repo is the app platform only — there's no marketing homepage here
  // anymore, so send the bare root straight to the workspace or the gate.
  if (pathname === '/') {
    const redirectUrl = new URL(user ? '/dashboard' : '/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const isProtectedRoute =
    protectedRouteExact.includes(pathname) ||
    protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthRoute = authRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
