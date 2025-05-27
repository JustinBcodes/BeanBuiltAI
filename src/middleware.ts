import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const url = request.nextUrl.clone()
  
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
    url.pathname = '/auth/signin'
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If authenticated but on auth pages, redirect based on onboarding status
  if (token && url.pathname.startsWith('/auth')) {
    if (token.hasCompletedOnboarding) {
      url.pathname = '/dashboard'
    } else {
      url.pathname = '/onboarding'
    }
    return NextResponse.redirect(url)
  }

  // If authenticated but onboarding not complete, force to onboarding
  if (token && !token.hasCompletedOnboarding && !url.pathname.startsWith('/onboarding')) {
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // If onboarding is complete but user is on onboarding page, redirect to dashboard
  if (token && token.hasCompletedOnboarding && url.pathname.startsWith('/onboarding')) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Let it through
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