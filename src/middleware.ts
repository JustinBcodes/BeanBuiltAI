import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const url = request.nextUrl.clone()
  
  console.log(`🔄 Middleware: ${url.pathname} | Token: ${!!token} | Onboarding: ${token?.hasCompletedOnboarding}`)
  
  // Skip middleware for API routes
  if (url.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Allow root page to pass through (landing page)
  if (url.pathname === '/') {
    return NextResponse.next()
  }

  // If no token (unauthenticated) and trying to access protected routes
  if (!token && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/onboarding'))) {
    console.log(`❌ No token, redirecting ${url.pathname} → /auth/signin`)
    url.pathname = '/auth/signin'
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If authenticated but on auth pages, redirect based on onboarding status
  if (token && url.pathname.startsWith('/auth')) {
    if (token.hasCompletedOnboarding) {
      console.log(`✅ Auth page with completed onboarding → /dashboard`)
      url.pathname = '/dashboard'
    } else {
      console.log(`🚀 Auth page without completed onboarding → /onboarding`)
      url.pathname = '/onboarding'
    }
    return NextResponse.redirect(url)
  }

  // CRITICAL FIX: Allow access to onboarding when authenticated, regardless of onboarding status
  if (token && url.pathname.startsWith('/onboarding')) {
    if (token.hasCompletedOnboarding) {
      console.log(`✅ Onboarding page but already completed → /dashboard`)
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    } else {
      console.log(`🎯 Allowing access to onboarding page`)
      return NextResponse.next()
    }
  }

  // If authenticated but onboarding not complete, force to onboarding (except for onboarding routes)
  if (token && !token.hasCompletedOnboarding && !url.pathname.startsWith('/onboarding') && !url.pathname.startsWith('/auth')) {
    console.log(`🚀 Not completed onboarding, redirecting ${url.pathname} → /onboarding`)
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // Let it through
  console.log(`✓ Allowing access to ${url.pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/auth/:path*', 
    '/onboarding/:path*',
    '/profile/:path*',
    '/goals/:path*',
    '/nutrition/:path*',
    '/workouts/:path*',
    '/progress/:path*',
    '/settings/:path*'
  ],
} 