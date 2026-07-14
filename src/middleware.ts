import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  console.log(`🔄 Middleware: ${url.pathname} | Token: ${!!await getToken({ req: request })} | Onboarding: ${(await getToken({ req: request }))?.hasCompletedOnboarding}`)

  // 🔒 1. CRITICAL: Allow ALL /api/auth/* routes to pass through (prevents NextAuth breakage)
  if (url.pathname.startsWith('/api/auth/')) {
    console.log(`✅ NextAuth API route - bypassing middleware: ${url.pathname}`)
    return NextResponse.next()
  }

  // 🔒 2. Allow access to auth-related pages always (prevents infinite redirects)
  if (url.pathname.startsWith('/auth')) {
    // Special handling for authenticated users on auth pages
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token'
    })
    
    if (token?.hasCompletedOnboarding && url.pathname.startsWith('/auth/signin')) {
      console.log(`✅ Auth page with completed onboarding → /dashboard`)
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    
    console.log(`✅ Auth page access allowed: ${url.pathname}`)
    return NextResponse.next()
  }

  // 🔒 3. Allow other API routes (except auth) to pass through
  if (url.pathname.startsWith('/api/')) {
    console.log(`✅ API route access allowed: ${url.pathname}`)
    return NextResponse.next()
  }

  // 🔒 4. Fetch token with enhanced configuration
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
    // Enhanced token configuration for mobile/incognito compatibility
    secureCookie: process.env.NODE_ENV === 'production',
    cookieName: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'
  })
  
  // 🔒 5. If no token, redirect to sign-in (except for auth pages and landing page)
  if (!token) {
    if (url.pathname !== '/auth/signin' && url.pathname !== '/') {
      console.log(`🚀 No token, redirecting ${url.pathname} → /auth/signin`)
      url.pathname = '/auth/signin'
      // Add the original path as a query parameter for post-login redirect
      url.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    // Already on sign-in page or landing page, allow access
    console.log(`✅ No token but on public page, allowing access`)
    return NextResponse.next()
  }

  // 🔒 6. Allow onboarding access if onboarding is incomplete
  if (!token.hasCompletedOnboarding && url.pathname.startsWith('/onboarding')) {
    console.log(`✅ Incomplete onboarding, allowing onboarding access: ${url.pathname}`)
    return NextResponse.next()
  }

  // 🔒 7. Force to onboarding if not completed (except for onboarding routes)
  if (!token.hasCompletedOnboarding && !url.pathname.startsWith('/onboarding')) {
    console.log(`🚀 Onboarding incomplete, redirecting ${url.pathname} → /onboarding`)
    url.pathname = '/onboarding'
    url.searchParams.delete('from') // Clear any redirect parameters
    return NextResponse.redirect(url)
  }

  // 🔒 8. Redirect from onboarding if already completed
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

  console.log(`✓ Allowing access to ${url.pathname}`)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - /api/auth (NextAuth API routes - CRITICAL)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 