import { withAuth } from 'next-auth/middleware'
import { NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(request: NextRequestWithAuth) {
  const url = request.nextUrl.clone()
  
  console.log(`🔄 Middleware: ${url.pathname}`)

  // 🔒 1. Allow access to auth-related pages always (prevents infinite redirects)
  if (url.pathname.startsWith('/auth')) {
    console.log(`✅ Auth page access allowed: ${url.pathname}`)
    return NextResponse.next()
  }

  // API routes (except auth) should be handled separately
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth')) {
    console.log(`✅ API route access allowed: ${url.pathname}`)
    return NextResponse.next()
  }

  // 🔒 2. Fetch token with enhanced configuration
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
    // Enhanced token configuration for mobile/incognito compatibility
    secureCookie: process.env.NODE_ENV === 'production',
    cookieName: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'
  })
  
  console.log(`🔍 Middleware token check:`, {
    pathname: url.pathname,
    hasToken: !!token,
    tokenId: token?.id,
    hasCompletedOnboarding: token?.hasCompletedOnboarding,
    userAgent: request.headers.get('user-agent')?.substring(0, 50)
  })

  // 🔒 3. If no token, redirect to sign-in (but not if already on sign-in)
  if (!token) {
    if (url.pathname !== '/auth/signin') {
      console.log(`🚀 No token, redirecting ${url.pathname} → /auth/signin`)
      url.pathname = '/auth/signin'
      // Add the original path as a query parameter for post-login redirect
      url.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    // Already on sign-in page, allow access
    console.log(`✅ No token but on sign-in page, allowing access`)
    return NextResponse.next()
  }

  // 🔒 4. Allow onboarding access if onboarding is incomplete
  if (!token.hasCompletedOnboarding && url.pathname.startsWith('/onboarding')) {
    console.log(`✅ Incomplete onboarding, allowing onboarding access: ${url.pathname}`)
    return NextResponse.next()
  }

  // 🔒 5. Force to onboarding if not completed (except for onboarding routes)
  if (!token.hasCompletedOnboarding && !url.pathname.startsWith('/onboarding')) {
    console.log(`🚀 Onboarding incomplete, redirecting ${url.pathname} → /onboarding`)
    url.pathname = '/onboarding'
    url.searchParams.delete('from') // Clear any redirect parameters
    return NextResponse.redirect(url)
  }

  // 🔒 6. Redirect from onboarding if already completed
  if (token.hasCompletedOnboarding && url.pathname.startsWith('/onboarding')) {
    console.log(`✅ Onboarding completed, redirecting /onboarding → /dashboard`)
    url.pathname = '/dashboard'
    url.searchParams.delete('from') // Clear any redirect parameters
    return NextResponse.redirect(url)
  }

  // Enhanced response headers for mobile/incognito compatibility
  const response = NextResponse.next()
  
  // Add security headers for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  console.log(`✅ Allowing access to ${url.pathname}`)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 