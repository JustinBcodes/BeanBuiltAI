import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return null
  }

  if (!isAuth) {
    let from = request.nextUrl.pathname
    if (request.nextUrl.search) {
      from += request.nextUrl.search
    }

    return NextResponse.redirect(
      new URL(`/auth/signin?from=${encodeURIComponent(from)}`, request.url)
    )
  }

  // Check if user has completed onboarding for dashboard pages
  if (isDashboardPage && !isOnboardingPage) {
    // Use token data first (faster), fallback to API if needed
    if (token?.hasCompletedOnboarding === false) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    
    // If token doesn't have onboarding status, check via API
    if (token?.hasCompletedOnboarding === undefined) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/user/profile`, {
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        })

        if (!response.ok) {
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }

        const profile = await response.json()
        if (!profile || !profile.hasCompletedOnboarding) {
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }
      } catch (error) {
        console.error('Middleware: Error checking profile:', error)
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
  }
  
  // If user has completed onboarding but is on onboarding page, redirect to dashboard
  if (isOnboardingPage && token?.hasCompletedOnboarding === true) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return null
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/onboarding/:path*'],
} 