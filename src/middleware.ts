import { withAuth } from 'next-auth/middleware'
import { NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const url = request.nextUrl.clone()
  
  console.log(`🔄 Middleware: ${url.pathname} | Token: ${!!token} | Onboarding: ${token?.hasCompletedOnboarding}`)

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/error', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route))

  // API routes (except auth) should be handled separately
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth')) {
    console.log(`✓ API route, allowing: ${url.pathname}`)
    return NextResponse.next()
  }

  // If not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    console.log(`🚀 Not authenticated, redirecting ${url.pathname} → /auth/signin`)
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // If not authenticated but on public route, allow
  if (!token && isPublicRoute) {
    console.log(`✓ Public route access: ${url.pathname}`)
    return NextResponse.next()
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

  // If authenticated but onboarding not complete, force to onboarding (except for onboarding routes)
  if (token && !token.hasCompletedOnboarding && !url.pathname.startsWith('/onboarding') && !url.pathname.startsWith('/auth')) {
    console.log(`🚀 Not completed onboarding, redirecting ${url.pathname} → /onboarding`)
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // If authenticated, onboarding complete, but trying to access onboarding, redirect to dashboard
  if (token && token.hasCompletedOnboarding && url.pathname.startsWith('/onboarding')) {
    console.log(`✅ Completed onboarding, redirecting /onboarding → /dashboard`)
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Let it through
  console.log(`✓ Allowing access to ${url.pathname}`)
  return NextResponse.next()
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