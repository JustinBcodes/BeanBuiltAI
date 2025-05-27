import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isRootPage = request.nextUrl.pathname === '/'

  // Skip middleware for API routes
  if (isApiRoute) {
    return NextResponse.next()
  }

  // Allow root page to pass through (landing page)
  if (isRootPage) {
    return NextResponse.next()
  }

  // If user is not authenticated and trying to access protected routes
  if (!isAuth && (isDashboardPage || isOnboardingPage)) {
    let from = request.nextUrl.pathname
    if (request.nextUrl.search) {
      from += request.nextUrl.search
    }
    return NextResponse.redirect(
      new URL(`/auth/signin?from=${encodeURIComponent(from)}`, request.url)
    )
  }

  // If user is on auth pages and is already authenticated, redirect based on onboarding status
  if (isAuthPage && isAuth) {
    const onboardingComplete = token.hasCompletedOnboarding
    if (onboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // If user is authenticated but hasn't completed onboarding
  if (isAuth && !isOnboardingPage) {
    const onboardingComplete = token.hasCompletedOnboarding
    if (!onboardingComplete && isDashboardPage) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }
  
  // If user has completed onboarding but is on onboarding page, redirect to dashboard
  if (isAuth && isOnboardingPage) {
    const onboardingComplete = token.hasCompletedOnboarding
    if (onboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Allow all other requests to pass through
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